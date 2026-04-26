"""Services partages pour la synchronisation des matchs depuis Live Football API.

Ce module factorise la logique utilisee par plusieurs commandes de sync :
- sync_matches      : sync complet d'une journee (calendrier + scores + statuts)
- sync_live_scores  : refresh ultra-leger (score + statut uniquement)
- sync_lineups      : sync des compositions/joueurs (via sync_players)

Objectif : une seule source de verite pour le filtrage des ligues et l'upsert
des matchs, afin que toutes les commandes restent coherentes.
"""

from datetime import date, timezone as dt_timezone

import requests
from decouple import config
from django.utils import timezone

from matches.models import Match, MatchPlayer, Player, Team


LIVE_FOOTBALL_API_KEY = config('LIVE_FOOTBALL_API_KEY', default='')
BASE_URL = 'https://live-football-api.com/api/v1'
TEAM_LOGO_URL = 'https://live-football-api.com/teams/{api_id}.png'

LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS = frozenset(
    x.strip()
    for x in config('LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS', default='').split(',')
    if x.strip()
)

TARGET_LEAGUES = {
    'Premier League': {
        'aliases': ('premier league',),
        'countries': ('england',),
    },
    'La Liga': {
        'aliases': ('la liga', 'laliga'),
        'countries': ('spain',),
    },
    'Serie A': {
        'aliases': ('serie a',),
        'countries': ('italy',),
    },
    'Ligue 1': {
        'aliases': ('ligue 1',),
        'countries': ('france',),
    },
    'Bundesliga': {
        'aliases': ('bundesliga',),
        'countries': ('germany',),
    },
    'Champions League': {
        'aliases': ('champions league', 'uefa champions league'),
        'countries': ('europe',),
    },
}

_ALLOWED_COUNTRIES = frozenset()
for _cfg in TARGET_LEAGUES.values():
    _ALLOWED_COUNTRIES = _ALLOWED_COUNTRIES | frozenset(_cfg['countries'])

_REJECT_LEAGUE_NAME_SUBSTRINGS = (
    'primeira',
    'liga portugal',
    'ligue 2',
    'bundesliga 2',
    '2. bundesliga',
    'serie b',
    'segunda',
    'la liga 2',
    'laliga 2',
    'eredivisie',
    'brasileir',
    'super lig',
    'scottish',
    'welsh',
    'northern irish',
    'championship',
    'league one',
    'league two',
)


class SyncError(Exception):
    """Erreur generique levee lors d'une sync."""


def _normalize(text):
    return (text or '').strip().lower()


def _normalize_country(raw):
    c = _normalize(raw if isinstance(raw, str) else str(raw or ''))
    mapping = {
        'uk': 'england',
        'united kingdom': 'england',
        'great britain': 'england',
        'gb': 'england',
        'deutschland': 'germany',
        'espana': 'spain',
        'españa': 'spain',
        'italia': 'italy',
    }
    return mapping.get(c, c)


def _reject_league_name(api_league_name):
    n = _normalize(api_league_name)
    if not n:
        return True
    return any(sub in n for sub in _REJECT_LEAGUE_NAME_SUBSTRINGS)


def get_league_name(api_league_name, api_country_name):
    """Retourne le nom normalise si la ligue fait partie des championnats cibles."""
    if _reject_league_name(api_league_name):
        return None

    name = _normalize(api_league_name)
    country = _normalize_country(api_country_name)

    if country not in _ALLOWED_COUNTRIES:
        return None

    for league_name, cfg in TARGET_LEAGUES.items():
        aliases = cfg['aliases']
        countries = cfg['countries']
        if country in countries and any(alias == name for alias in aliases):
            return league_name
    return None


def league_allowed_by_id(api_league_id):
    """Si LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS est defini, seul l'ID compte."""
    if not LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS:
        return True
    lid = (api_league_id or '').strip()
    return lid in LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS


def _find_existing_team(team_name):
    return Team.objects.filter(name__iexact=team_name).order_by('-logo', 'id').first()


def _team_logo_url(api_id):
    api_id = (api_id or '').strip()
    if not api_id:
        return ''
    return TEAM_LOGO_URL.format(api_id=api_id)


def find_or_create_team(team_data, league_name):
    """Trouve ou cree une Team depuis le bloc home/away d'un payload Live Football API.

    `team_data` doit contenir au minimum `name` ; `id` (alphanumerique) sert
    a remplir Team.api_id et a construire le logo officiel.
    """
    api_id = str(team_data.get('id') or '').strip()
    name = (team_data.get('name') or '').strip()
    logo = _team_logo_url(api_id)

    if api_id:
        team = Team.objects.filter(api_id=api_id).first()
        if team:
            changed = False
            if name and team.name != name:
                team.name = name
                changed = True
            if logo and team.logo != logo:
                team.logo = logo
                changed = True
            if league_name != 'Champions League' and team.league != league_name:
                team.league = league_name
                changed = True
            if changed:
                team.save()
            return team

    if league_name == 'Champions League':
        existing_team = _find_existing_team(name)
        if existing_team:
            changed = False
            if api_id and not existing_team.api_id:
                existing_team.api_id = api_id
                changed = True
            if logo and not existing_team.logo:
                existing_team.logo = logo
                changed = True
            if changed:
                existing_team.save()
            return existing_team

    team = Team.objects.filter(name__iexact=name, league=league_name).first()
    if team:
        changed = False
        if api_id and not team.api_id:
            team.api_id = api_id
            changed = True
        if logo and team.logo != logo:
            team.logo = logo
            changed = True
        if changed:
            team.save()
        return team

    return Team.objects.create(
        api_id=api_id or None,
        name=name,
        league=league_name,
        logo=logo,
    )


def api_get(endpoint, params):
    """Appelle un endpoint de Live Football API avec la cle d'API globale."""
    if not LIVE_FOOTBALL_API_KEY:
        raise SyncError("LIVE_FOOTBALL_API_KEY manquante dans .env")

    params = dict(params)
    params['api_key'] = LIVE_FOOTBALL_API_KEY
    params.setdefault('lang', 'en')

    response = requests.get(f'{BASE_URL}/{endpoint}', params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()
    if not payload.get('success'):
        return None
    return payload.get('data') or {}


def fetch_matches_for_date(target_date):
    """Recupere la liste brute des matchs pour une date donnee (matches.php)."""
    data = api_get('matches.php', {'date': target_date.isoformat()})
    if data is None:
        return []
    return data.get('matches', []) or []


def _parse_int(raw, default=0):
    try:
        return int(raw) if raw not in (None, '') else default
    except (ValueError, TypeError):
        return default


def _filter_target_match(match_data):
    """Retourne (league_name, api_id) si le match est cible, sinon None."""
    league_block = match_data.get('league') or {}
    api_league_id = str(league_block.get('id', '') or '').strip()

    if not league_allowed_by_id(api_league_id):
        return None

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
    """Crée ou met a jour un match complet (horaires, equipes, scores, status).

    Retourne (match_obj, was_created) ou None si le match est filtre.
    """
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

    home_score = _parse_int(home_data.get('score', 0))
    away_score = _parse_int(away_data.get('score', 0))
    status_data = match_data.get('status', {})
    status = status_data.get('status', 'scheduled')

    match, was_created = Match.objects.update_or_create(
        api_id=api_id,
        defaults={
            'date': match_datetime,
            'league': league_name,
            'home_team': home_team,
            'away_team': away_team,
            'home_score': home_score,
            'away_score': away_score,
            'status': status,
        },
    )
    return match, was_created


def update_match_live_data(match_data):
    """Met a jour UNIQUEMENT score + status d'un match existant.

    Plus leger que upsert_match_full : ne touche pas aux equipes ni a l'horaire.
    Ne cree pas de nouveau match : si le match n'existe pas en DB, on l'ignore.

    Retourne le Match si mis a jour, None sinon.
    """
    filtered = _filter_target_match(match_data)
    if not filtered:
        return None
    _, api_id = filtered

    try:
        match = Match.objects.get(api_id=api_id)
    except Match.DoesNotExist:
        return None

    home_score = _parse_int(match_data.get('home', {}).get('score', 0))
    away_score = _parse_int(match_data.get('away', {}).get('score', 0))
    status_data = match_data.get('status', {})
    new_status = status_data.get('status', match.status)

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



# Helpers pour la synchron des lineups / joueurs


def fetch_lineups(match_api_id):
    return api_get('lineups.php', {'match_id': match_api_id})


def fetch_match_details(match_api_id):
    return api_get('live_match_details.php', {'match_id': match_api_id})


def get_sub_in_ids(events):
    """Extrait les api_id des remplacants effectivement entres en jeu."""
    sub_in_ids = set()
    for event in events or []:
        if event.get('type', '').lower() != 'substitution':
            continue
        detail = event.get('detail') or {}
        player_in = detail.get('in') or {}
        pid = str(player_in.get('id') or '').strip()
        if pid:
            sub_in_ids.add(pid)
    return sub_in_ids


def players_who_played(side_data, sub_in_ids):
    """Retourne titulaires + seulement les remplacants entres en jeu.

    Chaque entree porte un flag `is_starter` que l'on conserve pour
    alimenter MatchPlayer.is_starter en aval.
    """
    players = []
    for raw in side_data.get('starting') or []:
        players.append({**raw, 'is_starter': True})
    for raw in side_data.get('subs') or []:
        pid = str(raw.get('id') or '').strip()
        if pid in sub_in_ids:
            players.append({**raw, 'is_starter': False})
    return players


def ensure_players(team, raw_players):
    """Cree/maj les Player et renvoie la liste de paires (Player, raw_player).

    On conserve le raw_player pour pouvoir set MatchPlayer.is_starter ensuite,
    et pour stocker l'URL `image` fournie par l'API.
    """
    pairs = []
    for raw_player in raw_players:
        api_id = str(raw_player.get('id') or '').strip()
        name = (raw_player.get('name') or '').strip()
        if not api_id or not name:
            continue
        image = (raw_player.get('image') or '').strip()
        player, _ = Player.objects.update_or_create(
            api_id=api_id,
            defaults={'name': name, 'team': team, 'image': image},
        )
        pairs.append((player, raw_player))
    return pairs


def sync_match_players(match, pairs):
    """Synchronise MatchPlayer a partir d'une liste de (Player, raw_player)."""
    players = [pair[0] for pair in pairs]
    MatchPlayer.objects.filter(match=match).exclude(player__in=players).delete()
    for player, raw in pairs:
        MatchPlayer.objects.update_or_create(
            match=match,
            player=player,
            defaults={'is_starter': bool(raw.get('is_starter'))},
        )


def sync_lineup_for_match(match):
    """Synchronise les joueurs d'un match (titulaires + subs entres en jeu).

    Met egalement a jour `match.lineup_synced_at` pour permettre aux commandes
    de skipper les matchs deja sync apres leur fin (cf. build_relevant_queryset).

    Retourne le nombre de joueurs enregistres, ou None si lineup indisponible.
    """
    lineups = fetch_lineups(match.api_id)
    if not lineups or not lineups.get('home') or not lineups.get('away'):
        return None

    details = fetch_match_details(match.api_id)
    events = (details or {}).get('events') or []
    sub_in_ids = get_sub_in_ids(events)

    home_played = players_who_played(lineups['home'], sub_in_ids)
    away_played = players_who_played(lineups['away'], sub_in_ids)

    home_pairs = ensure_players(match.home_team, home_played)
    away_pairs = ensure_players(match.away_team, away_played)
    all_pairs = home_pairs + away_pairs

    sync_match_players(match, all_pairs)

    match.lineup_synced_at = timezone.now()
    match.save(update_fields=['lineup_synced_at'])

    return len(all_pairs)
