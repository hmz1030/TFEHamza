"""Refresh ultra-leger : met a jour UNIQUEMENT score + status des matchs d'une date.

A appeler frequemment (30-60s) pendant les fenetres de matchs en cours.

Differences avec `sync_matches` :
- Ne cree pas de nouveaux matchs (si un match n'existe pas en DB, on l'ignore)
- Ne touche pas aux equipes ni aux horaires
- Ne supprime rien
- Sauvegarde uniquement les champs home_score / away_score / status modifies

Par defaut, ne fait rien s'il n'y a aucun match en cours (status != live/finished).
Cela evite des appels API inutiles la nuit ou entre deux journees.
"""
from django.core.management.base import BaseCommand

from matches.models import Match
from matches.pronostics import update_pronostic_points
from matches.sync.http import SyncError
from matches.sync.matches import (
    fetch_matches_for_date,
    resolve_target_date,
    update_match_live_data,
)


def _has_live_or_pending_matches(target_date):
    """Retourne True s'il y a au moins un match a rafraichir a cette date."""
    return Match.objects.filter(date__date=target_date).exclude(
        status__iregex=r'(finish|term|^ft$|ended)'
    ).exists()


class Command(BaseCommand):
    help = "Refresh leger : met a jour uniquement score + status des matchs d'une date"

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Date YYYY-MM-DD (defaut : aujourdhui)')
        parser.add_argument(
            '--force',
            action='store_true',
            help="Force l'appel API meme si aucun match n'est en cours / en attente",
        )

    def handle(self, *args, **options):
        try:
            target_date = resolve_target_date(options.get('date'))
        except ValueError:
            self.stdout.write(self.style.ERROR('Format de date invalide (attendu YYYY-MM-DD).'))
            return

        if not options.get('force') and not _has_live_or_pending_matches(target_date):
            self.stdout.write(
                f"Aucun match en cours ou a venir pour le {target_date.isoformat()}, skip (utiliser --force pour forcer)."
            )
            return

        try:
            all_matches = fetch_matches_for_date(target_date)
        except SyncError as exc:
            self.stdout.write(self.style.ERROR(str(exc)))
            return

        refreshed = 0
        unchanged = 0
        for match_data in all_matches:
            result = update_match_live_data(match_data)
            if result is None:
                continue
            refreshed += 1

        points_result = update_pronostic_points(target_date=target_date)

        self.stdout.write(self.style.SUCCESS(
            f"Refresh live termine pour {target_date.isoformat()} : "
            f"{refreshed} match(s) verifie(s), "
            f"{points_result['updated']} pronostic(s) mis a jour."
        ))
