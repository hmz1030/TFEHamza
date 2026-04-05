import requests
from django.core.management.base import BaseCommand
from decouple import config


LIVE_FOOTBALL_API_KEY = config('LIVE_FOOTBALL_API_KEY', default='')
BASE_URL = 'https://live-football-api.com/api/v1'


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
