import requests
from django.core.management.base import BaseCommand
from decouple import config
from matches.models import Match, Player


LIVE_FOOTBALL_API_KEY = config('LIVE_FOOTBALL_API_KEY', default='')
BASE_URL = 'https://live-football-api.com/api/v1'


def _fetch_lineups(match_api_id):
    response = requests.get(
        f'{BASE_URL}/lineups.php',
        params={'api_key': LIVE_FOOTBALL_API_KEY, 'match_id': match_api_id, 'lang': 'en'},
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get('success'):
        return None
    return payload.get('data') or {}


def _players_from_side(side_data):
    players = []
    for group in ('starting', 'subs'):
        players.extend(side_data.get(group) or [])
    return players


def _upsert_players(team, raw_players):
    total = 0
    for raw_player in raw_players:
        api_id = str(raw_player.get('id') or '').strip()
        name = (raw_player.get('name') or '').strip()
        if not api_id or not name:
            continue
        Player.objects.update_or_create(
            api_id=api_id,
            defaults={'name': name, 'team': team},
        )
        total += 1
    return total


class Command(BaseCommand):
    help = 'Synchronise les joueurs depuis Live Football API'

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

        for match in queryset:
            data = _fetch_lineups(match.api_id)
            if not data or not data.get('home') or not data.get('away'):
                continue
            synced_players += _upsert_players(match.home_team, _players_from_side(data['home']))
            synced_players += _upsert_players(match.away_team, _players_from_side(data['away']))
            synced_matches += 1

        self.stdout.write(self.style.SUCCESS(
            f'Synchronisation terminee : {synced_matches} match(s), {synced_players} joueur(s).'
        ))
