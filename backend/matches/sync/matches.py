from datetime import date, timezone as dt_timezone

from django.utils import timezone

from matches.models import Match
from matches.sync.http import api_get, parse_int
from matches.sync.leagues import get_league_name
from matches.sync.teams import find_or_create_team


def fetch_matches_for_date(target_date):
    """Recupere la liste brute des matchs pour une date donnee (matches.php)."""
    data = api_get('matches.php', {'date': target_date.isoformat()})
    if data is None:
        return []
    return data.get('matches', []) or []


def _filter_target_match(match_data):
    """Retourne (league_name, api_id) si le match est cible, sinon None."""
    league_block = match_data.get('league') or {}
    league_name = get_league_name(
        league_block.get('name', ''),
        league_block.get('country', ''),
    )
    if not league_name:
        return None

    api_id = str(match_data.get('id', '')).strip()
    if not api_id:
        return None

    return league_name, api_id


def upsert_match_full(match_data, target_date):
    """Cree ou met a jour un match complet (horaires, equipes, scores, status)."""
    filtered = _filter_target_match(match_data)
    if not filtered:
        return None
    league_name, api_id = filtered

    home_data = match_data.get('home') or {}
    away_data = match_data.get('away') or {}
    if not home_data.get('name') or not away_data.get('name'):
        return None

    home_team = find_or_create_team(home_data, league_name)
    away_team = find_or_create_team(away_data, league_name)

    kickoff = match_data.get('kickoff', '00:00')
    match_datetime = timezone.datetime.combine(
        target_date,
        timezone.datetime.strptime(kickoff, '%H:%M').time(),
        tzinfo=dt_timezone.utc,
    )

    match, was_created = Match.objects.update_or_create(
        api_id=api_id,
        defaults={
            'date': match_datetime,
            'league': league_name,
            'home_team': home_team,
            'away_team': away_team,
            'home_score': parse_int(home_data.get('score', 0)),
            'away_score': parse_int(away_data.get('score', 0)),
            'status': (match_data.get('status') or {}).get('status', 'scheduled'),
        },
    )
    return match, was_created


def update_match_live_data(match_data):
    """Met a jour uniquement score + status d'un match existant."""
    filtered = _filter_target_match(match_data)
    if not filtered:
        return None
    _, api_id = filtered

    try:
        match = Match.objects.get(api_id=api_id)
    except Match.DoesNotExist:
        return None

    home_score = parse_int(match_data.get('home', {}).get('score', 0))
    away_score = parse_int(match_data.get('away', {}).get('score', 0))
    new_status = (match_data.get('status') or {}).get('status', match.status)

    dirty = False
    if match.home_score != home_score:
        match.home_score = home_score
        dirty = True
    if match.away_score != away_score:
        match.away_score = away_score
        dirty = True
    if match.status != new_status:
        match.status = new_status
        dirty = True

    if dirty:
        match.save(update_fields=['home_score', 'away_score', 'status'])
    return match


def resolve_target_date(value):
    """Convertit une valeur (str 'YYYY-MM-DD' ou None) en date."""
    if value is None:
        return timezone.now().date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)
