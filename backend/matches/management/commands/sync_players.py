"""Synchronise les joueurs (titulaires + remplacants entres en jeu) pour un/des matchs.

Commande originale conservee pour compatibilite. Pour une sync "intelligente"
avec une fenetre limitee (matchs en cours ou pres de commencer), utiliser
plutot `sync_lineups`.
"""

from django.core.management.base import BaseCommand

from matches.models import Match
from matches.sync.http import SyncError
from matches.sync.lineups import sync_lineup_for_match


class Command(BaseCommand):
    help = "Synchronise les joueurs (titulaires + remplacants entres en jeu) depuis Live Football API"

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Date YYYY-MM-DD')
        parser.add_argument('--match-id', type=int, help='ID local du match')

    def handle(self, *args, **options):
        queryset = Match.objects.exclude(api_id__isnull=True).exclude(api_id='')
        if options.get('match_id'):
            queryset = queryset.filter(pk=options['match_id'])
        elif options.get('date'):
            queryset = queryset.filter(date__date=options['date'])

        synced_matches = 0
        synced_players = 0

        try:
            for match in queryset:
                count = sync_lineup_for_match(match)
                if count is None:
                    continue
                synced_matches += 1
                synced_players += count
        except SyncError as exc:
            self.stdout.write(self.style.ERROR(str(exc)))
            return

        self.stdout.write(self.style.SUCCESS(
            f'Synchronisation terminee : {synced_matches} match(s), {synced_players} joueur(s).'
        ))
