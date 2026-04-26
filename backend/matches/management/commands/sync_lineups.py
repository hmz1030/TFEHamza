"""Synchronise les lineups SEULEMENT pour les matchs dans une fenetre utile.

Difference avec `sync_players` :
- Par defaut, cible uniquement les matchs :
    - en cours (status contient 'live', 'direct', 'progress')
    - ou venant de finir dans les dernieres heures (--recent-hours)
    - ou commencant bientot (--window-before-hours)
- Evite les appels API pour des matchs dont le lineup ne peut plus changer
  (matchs finis il y a longtemps, matchs prevus dans plusieurs jours).

Avec `--all`, bypass le filtre et tente tous les matchs (comportement de
`sync_players` classique).
"""

from datetime import timedelta

import requests
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from matches.models import Match
from matches.sync.http import SyncError
from matches.sync.lineups import sync_lineup_for_match


LIVE_STATUS_REGEX = r'(live|direct|progress|half|1h|2h|^ht$)'
FINISHED_STATUS_REGEX = r'(finish|term|^ft$|ended)'
# Tampon apres le kickoff pour etre sur que le coup de sifflet final est passe
# (90 min de jeu + mi-temps + prolongations / temps additionnel).
POST_MATCH_BUFFER = timedelta(hours=2, minutes=30)


def _should_skip_finished(match):
    """Skip si le match est fini ET deja sync apres sa fin probable.

    Protege le cas "sub a la 90+3" : tant qu'on n'a pas sync au moins une fois
    apres (kickoff + 2h30), on re-tente le sync pour rattraper les dernieres
    actions du match.
    """
    status = (match.status or '').lower()
    is_finished = any(token in status for token in ('finish', 'term', 'ended')) or status == 'ft'
    if not is_finished:
        return False

    if not match.lineup_synced_at:
        return False

    match_end_approx = match.date + POST_MATCH_BUFFER
    return match.lineup_synced_at >= match_end_approx


def build_relevant_queryset(window_before_hours=2, recent_hours=4):
    """Renvoie les matchs dont la sync de lineup a du sens MAINTENANT.

    Branches :
    - En cours (status contient live/direct/progress/half/ht)
    - Commencant bientot (scheduled/notstarted dans les prochaines heures)
    - Recemment joues (kickoff recent ET status live ou finished)
      On exclut ici les matchs scheduled/notstarted dont le kickoff est passe :
      ce sont typiquement des matchs reportes ou a kickoff fantome, les sync
      ne retourneront rien d'utile et consomment des credits pour rien.
    """
    now = timezone.now()
    soon = now + timedelta(hours=window_before_hours)
    recent_past = now - timedelta(hours=recent_hours)

    return (
        Match.objects
        .exclude(api_id__isnull=True)
        .exclude(api_id='')
        .filter(
            Q(status__iregex=LIVE_STATUS_REGEX)
            | Q(status__iexact='scheduled', date__gte=now, date__lte=soon)
            | Q(status__iexact='notstarted', date__gte=now, date__lte=soon)
            | (
                Q(date__gte=recent_past, date__lte=now)
                & (
                    Q(status__iregex=LIVE_STATUS_REGEX)
                    | Q(status__iregex=FINISHED_STATUS_REGEX)
                )
            )
        )
        .distinct()
    )


class Command(BaseCommand):
    help = "Sync des lineups limitee aux matchs dans une fenetre utile (live / imminents / recents)"

    def add_arguments(self, parser):
        parser.add_argument('--match-id', type=int, help='ID local d\'un match (bypass la fenetre)')
        parser.add_argument('--all', action='store_true', help='Ignorer la fenetre, tenter tous les matchs')
        parser.add_argument(
            '--window-before-hours',
            type=int,
            default=2,
            help='Sync les matchs commencant dans les X heures (defaut : 2)',
        )
        parser.add_argument(
            '--recent-hours',
            type=int,
            default=4,
            help='Sync les matchs finis dans les X dernieres heures (defaut : 4)',
        )

    def handle(self, *args, **options):
        if options.get('match_id'):
            queryset = Match.objects.filter(pk=options['match_id'])
        elif options.get('all'):
            queryset = Match.objects.exclude(api_id__isnull=True).exclude(api_id='')
        else:
            queryset = build_relevant_queryset(
                window_before_hours=options['window_before_hours'],
                recent_hours=options['recent_hours'],
            )

        total = queryset.count()
        if total == 0:
            self.stdout.write('Aucun match dans la fenetre, rien a synchroniser.')
            return

        self.stdout.write(f'Sync des lineups pour {total} match(s)...')

        synced_matches = 0
        synced_players = 0
        skipped = 0
        errored = 0

        for index, match in enumerate(queryset, start=1):
            label = f'[{index}/{total}] {match.home_team} vs {match.away_team}'

            if _should_skip_finished(match):
                skipped += 1
                self.stdout.write(f'{label} -> deja sync, skip')
                continue

            try:
                count = sync_lineup_for_match(match)
            except SyncError as exc:
                self.stdout.write(self.style.ERROR(str(exc)))
                return
            except requests.RequestException as exc:
                errored += 1
                self.stdout.write(self.style.WARNING(f'{label} -> erreur reseau: {exc}'))
                continue

            if count is None:
                skipped += 1
                self.stdout.write(f'{label} -> lineup indisponible')
                continue

            synced_matches += 1
            synced_players += count
            self.stdout.write(self.style.SUCCESS(f'{label} -> {count} joueur(s)'))

        self.stdout.write(self.style.SUCCESS(
            f'Termine : {synced_matches} lineup(s) synchronise(s), '
            f'{synced_players} joueur(s), {skipped} indisponible(s), '
            f'{errored} en erreur reseau.'
        ))
