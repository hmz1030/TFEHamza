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


class Command(BaseCommand):
    help = 'Synchronise les joueurs depuis Live Football API'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Date YYYY-MM-DD')
        parser.add_argument('--match-id', type=int, help='ID local du match')

    def handle(self, *args, **options):
        if not LIVE_FOOTBALL_API_KEY:
            self.stdout.write(self.style.ERROR('LIVE_FOOTBALL_API_KEY manquante dans .env'))
            return

        self.stdout.write('Commande sync_players initialisee.')
