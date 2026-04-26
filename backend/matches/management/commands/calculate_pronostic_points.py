from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_date

from matches.pronostics import update_pronostic_points


class Command(BaseCommand):
    help = "Calcule les points des pronostics pour les matchs termines"

    def add_arguments(self, parser):
        parser.add_argument('--match-id', type=int, help='ID local du match')
        parser.add_argument('--date', type=str, help='Date des matchs au format YYYY-MM-DD')

    def handle(self, *args, **options):
        target_date = None
        if options.get('date'):
            target_date = parse_date(options['date'])
            if not target_date:
                self.stdout.write(self.style.ERROR('Format de date invalide (attendu YYYY-MM-DD).'))
                return

        result = update_pronostic_points(
            match_id=options.get('match_id'),
            target_date=target_date,
        )

        self.stdout.write(self.style.SUCCESS(
            f"Points pronostics : {result['updated']} mis a jour, {result['skipped']} ignores."
        ))
