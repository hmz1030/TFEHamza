from datetime import datetime, timezone as dt_timezone

from matches.models import Match
from matches.sync.http import api_get, parse_int
from matches.sync.leagues import get_league_name
from matches.sync.teams import find_or_create_team


def fetch_team_matches(team_api_id, season=None):
    """Recupere les matchs d'une equipe pour une saison via team_matches.php."""
    params = {'team_id': team_api_id}
    if season:
        params['season'] = season
    return api_get('team_matches.php', params)


def parse_match_date(match_data):
    """Convertit la date Live Football API en datetime UTC."""
    timestamp = match_data.get('timestamp')
    if timestamp not in (None, ''):
        try:
            return datetime.fromtimestamp(int(timestamp), tz=dt_timezone.utc)
        except (TypeError, ValueError, OSError):
            return None

    raw_date = (match_data.get('date') or '').strip()
    if not raw_date:
        return None

    for pattern in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            parsed = datetime.strptime(raw_date, pattern)
            return parsed.replace(tzinfo=dt_timezone.utc)
        except ValueError:
            continue

    return None


def normalize_status(raw_status):
    """Normalise les statuts parfois courts renvoyes par team_matches.php."""
    if isinstance(raw_status, dict):
        status = raw_status.get('status') or raw_status.get('state') or raw_status.get('display')
        display = raw_status.get('display') or status or ''
    else:
        display = str(raw_status or '').strip()
        compact = display.lower().replace('.', '').replace(' ', '')
        if compact in ('ft', 'finished', 'fulltime'):
            status = 'finished'
        elif compact in ('', '-', 'ns', 'notstarted', 'scheduled'):
            status = 'scheduled'
        elif compact in ('ht', 'live') or "'" in display:
            status = 'live'
        else:
            status = compact or 'scheduled'

    return str(status or 'scheduled')[:20], str(display or '')[:20]


def upsert_team_match(match_data):
    """Cree ou met a jour un match depuis la reponse team_matches.php."""
    api_id = str(match_data.get('id') or '').strip()
    if not api_id:
        return None

    league_data = match_data.get('league') or {}
    league_name = get_league_name(
        league_data.get('name', ''),
        league_data.get('country', ''),
    )
    if not league_name:
        return None

    match_date = parse_match_date(match_data)
    if not match_date:
        return None

    home_data = match_data.get('home') or {}
    away_data = match_data.get('away') or {}
    if not home_data.get('name') or not away_data.get('name'):
        return None

    home_team = find_or_create_team(home_data, league_name)
    away_team = find_or_create_team(away_data, league_name)
    status, status_display = normalize_status(match_data.get('status'))

    match, was_created = Match.objects.update_or_create(
        api_id=api_id,
        defaults={
            'date': match_date,
            'league': league_name,
            'home_team': home_team,
            'away_team': away_team,
            'home_score': parse_int(home_data.get('score'), default=0),
            'away_score': parse_int(away_data.get('score'), default=0),
            'status': status,
            'status_display': status_display,
        },
    )
    return match, was_created


def sync_team_matches(team, season=None):
    """Synchronise les matchs connus par l'API pour une equipe."""
    data = fetch_team_matches(team.api_id, season=season)
    raw_matches = (data or {}).get('matches') or []

    created = 0
    updated = 0
    skipped = 0
    affected_dates = set()

    for match_data in raw_matches:
        result = upsert_team_match(match_data)
        if result is None:
            skipped += 1
            continue

        match, was_created = result
        if was_created:
            created += 1
        else:
            updated += 1
        affected_dates.add(match.date.date())

    return {
        'received': len(raw_matches),
        'created': created,
        'updated': updated,
        'skipped': skipped,
        'affected_dates': affected_dates,
    }
