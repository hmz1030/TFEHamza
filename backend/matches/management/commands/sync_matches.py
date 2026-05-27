"""Synchronise le calendrier des matchs (scores + statuts) depuis Live Football API.

Cette commande fait un sync complet pour une date donnee, ou une plage de dates
consecutives via --days-ahead (utile pour le cron nocturne qui pre-charge les
prochaines semaines) ici j'ai decidé de le faire a 21 jours pour pas 
trop cramer les crédits API . Par defaut, elle supprime pas les matchs absents de la
reponse API : activer --delete-missing explicitement pour cela.

Workflow (par date) :
On recupere les matchs du jour via matches.php
Pour chaque match dans une ligue cible : create ou update (via matches.sync)
Suppression des matchs obsoletes uniquement si --delete-missing est passe
"""

from datetime import timedelta

from django.core.management.base import BaseCommand

from matches.models import Match
from matches.pronostics import update_pronostic_points
from matches.sync.http import SyncError
from matches.sync.matches import (
    _filter_target_match,
    fetch_matches_for_date,
    resolve_target_date,
    upsert_match_full,
)


MAX_DAYS_AHEAD = 21


class Command(BaseCommand):
    help = "Synchronise (calendrier + scores + statuts) les matchs d'une date (ou d'une plage) depuis Live Football API"

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date de depart au format YYYY-MM-DD (par defaut -> aujourdhui)',
        )
        parser.add_argument(
            '--days-ahead',
            type=int,
            default=0,
            help=(
                f"Nombre de jours supplementaires a synchroniser apres --date "
                f"(0 = uniquement la date cible). Max autorise : {MAX_DAYS_AHEAD}. "
                f"Chaque jour = 1 appel API supplementaire."
            ),
        )
        parser.add_argument(
            '--delete-missing',
            action='store_true',
            help=(
                "Supprime les matchs locaux absents de la reponse API pour chaque date traitee. "
                "DANGER : cela supprime aussi en cascade les Pronostics/Ratings/Votes/MatchPlayer. "
                "A utiliser uniquement pour un nettoyage manuel controle."
            ),
        )

    def handle(self, *args, **options):
        try:
            start_date = resolve_target_date(options.get('date'))
        except ValueError:
            self.stdout.write(self.style.ERROR('Format de date invalide (attendu YYYY-MM-DD).'))
            return

        days_ahead = options.get('days_ahead') or 0
        if days_ahead < 0 or days_ahead > MAX_DAYS_AHEAD:
            self.stdout.write(self.style.ERROR(
                f'--days-ahead doit etre compris entre 0 et {MAX_DAYS_AHEAD}.'
            ))
            return

        delete_missing = bool(options.get('delete_missing'))

        total_created = 0
        total_updated = 0
        total_deleted = 0
        total_skipped = 0

        for offset in range(days_ahead + 1):
            current_date = start_date + timedelta(days=offset)
            result = self._sync_single_date(current_date, delete_missing)
            if result is None:
                continue
            total_created += result['created']
            total_updated += result['updated']
            total_deleted += result['deleted']
            total_skipped += result['skipped']

        delete_note = (
            f"{total_deleted} supprimes"
            if delete_missing
            else "suppression desactivee (utiliser --delete-missing)"
        )
        self.stdout.write(self.style.SUCCESS(
            f"\nTotal sur {days_ahead + 1} jour(s) : "
            f"{total_created} crees, {total_updated} mis a jour, "
            f"{delete_note}, {total_skipped} ignores (autres ligues)."
        ))

    def _sync_single_date(self, target_date, delete_missing):
        self.stdout.write(f"Recuperation des matchs pour le {target_date.isoformat()}...")

        try:
            all_matches = fetch_matches_for_date(target_date)
        except SyncError as exc:
            self.stdout.write(self.style.ERROR(str(exc)))
            return None

        self.stdout.write(f"  {len(all_matches)} matchs totaux recus de l'API")

        created = 0
        updated = 0
        skipped = 0
        valid_api_ids = set()

        for match_data in all_matches:
            filtered = _filter_target_match(match_data)
            if not filtered:
                skipped += 1
                continue

            result = upsert_match_full(match_data, target_date)
            if result is None:
                skipped += 1
                continue

            _, was_created = result
            if was_created:
                created += 1
            else:
                updated += 1

            valid_api_ids.add(filtered[1])

        deleted = 0
        if delete_missing:
            # Safeguard : si l'API ne nous a renvoye aucun match cible mais qu'on
            # avait deja des matchs en DB, on refuse le delete. Cas typique : erreur
            # temporaire de l'API externe, rate limit, JSON corrompu.
            existing_count = Match.objects.filter(date__date=target_date).count()
            if not valid_api_ids and existing_count > 0:
                self.stdout.write(self.style.WARNING(
                    f"Safeguard : l'API n'a renvoye aucun match cible mais {existing_count} "
                    f"matchs existent en DB pour le {target_date.isoformat()}. Suppression annulee."
                ))
            else:
                deleted = (
                    Match.objects
                    .filter(date__date=target_date)
                    .exclude(api_id__in=valid_api_ids)
                    .delete()[0]
                )

        points_result = update_pronostic_points(target_date=target_date)
        if points_result['updated']:
            self.stdout.write(
                f"  {points_result['updated']} pronostic(s) mis a jour pour cette date."
            )

        return {
            'created': created,
            'updated': updated,
            'deleted': deleted,
            'skipped': skipped,
        }
