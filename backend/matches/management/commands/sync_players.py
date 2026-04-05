import requests
from django.core.management.base import BaseCommand
from decouple import config
from matches.models import Match, MatchPlayer, Player


LIVE_FOOTBALL_API_KEY = config('LIVE_FOOTBALL_API_KEY', default='')
BASE_URL = 'https://live-football-api.com/api/v1'


def _api_get(endpoint, params):
    params['api_key'] = LIVE_FOOTBALL_API_KEY
    params.setdefault('lang', 'en')
    response = requests.get(f'{BASE_URL}/{endpoint}', params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()
    if not payload.get('success'):
        return None
    return payload.get('data') or {}


def _fetch_lineups(match_api_id):
    return _api_get('lineups.php', {'match_id': match_api_id})


def _fetch_match_details(match_api_id):
    return _api_get('live_match_details.php', {'match_id': match_api_id})


def _get_sub_in_ids(events):
    """Extrait les api_id des remplaçants effectivement entrés en jeu."""
    sub_in_ids = set()
    for event in events:
        if event.get('type', '').lower() != 'substitution':
            continue
        detail = event.get('detail') or {}
        player_in = detail.get('in') or {}
        pid = str(player_in.get('id') or '').strip()
        if pid:
            sub_in_ids.add(pid)
    return sub_in_ids


def _players_who_played(side_data, sub_in_ids):
    """Retourne titulaires + seulement les remplaçants entrés en jeu."""
    players = list(side_data.get('starting') or [])
    for sub in (side_data.get('subs') or []):
        pid = str(sub.get('id') or '').strip()
        if pid in sub_in_ids:
            players.append(sub)
    return players


def _ensure_players(team, raw_players):
    players = []
    for raw_player in raw_players:
        api_id = str(raw_player.get('id') or '').strip()
        name = (raw_player.get('name') or '').strip()
        if not api_id or not name:
            continue
        player, _ = Player.objects.update_or_create(
            api_id=api_id,
            defaults={'name': name, 'team': team},
        )
        players.append(player)
    return players


def _sync_match_players(match, players):
    MatchPlayer.objects.filter(match=match).exclude(player__in=players).delete()
    for player in players:
        MatchPlayer.objects.get_or_create(match=match, player=player)


class Command(BaseCommand):
    help = 'Synchronise les joueurs (titulaires + remplaçants entrés en jeu) depuis Live Football API'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Date YYYY-MM-DD')
        parser.add_argument('--match-id', type=int, help='ID local du match')

    def handle(self, *args, **options):
        if not LIVE_FOOTBALL_API_KEY:
            self.stdout.write(self.style.ERROR('LIVE_FOOTBALL_API_KEY manquante dans .env'))
            return

        queryset = Match.objects.exclude(api_id__isnull=True).exclude(api_id='')
        if options.get('match_id'):
            queryset = queryset.filter(pk=options['match_id'])
        elif options.get('date'):
            queryset = queryset.filter(date__date=options['date'])

        synced_matches = 0
        synced_players = 0
        synced_links = 0

        for match in queryset:
            lineups = _fetch_lineups(match.api_id)
            if not lineups or not lineups.get('home') or not lineups.get('away'):
                continue

            details = _fetch_match_details(match.api_id)
            events = (details or {}).get('events') or []
            sub_in_ids = _get_sub_in_ids(events)

            home_played = _players_who_played(lineups['home'], sub_in_ids)
            away_played = _players_who_played(lineups['away'], sub_in_ids)

            home_players = _ensure_players(match.home_team, home_played)
            away_players = _ensure_players(match.away_team, away_played)
            all_players = home_players + away_players

            _sync_match_players(match, all_players)

            synced_players += len(all_players)
            synced_links += len(all_players)
            synced_matches += 1

        self.stdout.write(self.style.SUCCESS(
            f'Synchronisation terminee : {synced_matches} match(s), {synced_players} joueur(s), {synced_links} participation(s).'
        ))
