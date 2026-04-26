"""Synchronise les squads (rosters) des equipes depuis Live Football API.

Pour chaque Team avec un api_id alphanumerique LFA, appelle team_squad.php
et upsert chaque Player avec image / position / number / age.

Modes :
- --all (defaut)         : toutes les Teams ayant un api_id alphanumerique LFA
- --team-api-id <id>     : une seule team par son api_id
- --match-id <local_id>  : les 2 equipes d'un match local
- --league <name>        : restreint a une ligue (Premier League, La Liga, ...)

Les Teams dont l'api_id est purement numerique (heritage API-Football) sont
ignorees automatiquement : il faut d'abord lancer `sync_matches` pour les
remettre a jour avec les bons IDs LFA.
"""

import requests
from django.core.management.base import BaseCommand

from matches.models import Match, Team
from matches.sync.http import SyncError
from matches.sync.squads import sync_squad_for_team


def _is_lfa_api_id(value):
    """Un api_id LFA est alphanumerique (avec souvent des lettres).

    Les vieux api_id API-Football etaient purement numeriques ('541', '42'...),
    on les exclut pour ne pas gaspiller des credits sur des appels qui
    renverront `squad: []`.
    """
    if not value:
        return False
    return not value.isdigit()


class Command(BaseCommand):
    help = "Sync des squads (image/position/number/age) pour les equipes Live Football API"

    def add_arguments(self, parser):
        parser.add_argument('--team-api-id', type=str, help='api_id LFA d\'une team specifique')
        parser.add_argument('--match-id', type=int, help='ID local d\'un match (sync les 2 equipes)')
        parser.add_argument('--league', type=str, help='Restreindre a une ligue (ex: "Premier League")')
        parser.add_argument('--all', action='store_true', help='Toutes les teams avec un api_id LFA (defaut)')

    def handle(self, *args, **options):
        if options.get('team_api_id'):
            queryset = Team.objects.filter(api_id=options['team_api_id'])
        elif options.get('match_id'):
            try:
                match = Match.objects.get(pk=options['match_id'])
            except Match.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Match {options["match_id"]} introuvable'))
                return
            queryset = Team.objects.filter(pk__in=[match.home_team_id, match.away_team_id])
        else:
            queryset = Team.objects.exclude(api_id__isnull=True).exclude(api_id='')
            if options.get('league'):
                queryset = queryset.filter(league=options['league'])

        teams = [t for t in queryset if _is_lfa_api_id(t.api_id)]
        skipped_legacy = queryset.count() - len(teams)

        if not teams:
            self.stdout.write('Aucune team eligible (api_id LFA alphanumerique requis).')
            if skipped_legacy:
                self.stdout.write(
                    f'{skipped_legacy} team(s) ignoree(s) avec un api_id obsolete '
                    '(lance `sync_matches` pour les rafraichir).'
                )
            return

        total = len(teams)
        self.stdout.write(f'Sync des squads pour {total} equipe(s)...')
        if skipped_legacy:
            self.stdout.write(self.style.WARNING(
                f'{skipped_legacy} team(s) avec un api_id obsolete ignoree(s).'
            ))

        synced_teams = 0
        created_total = 0
        updated_total = 0
        empty = 0
        errored = 0

        for index, team in enumerate(teams, start=1):
            label = f'[{index}/{total}] {team.name} ({team.league})'
            try:
                result = sync_squad_for_team(team)
            except SyncError as exc:
                self.stdout.write(self.style.ERROR(str(exc)))
                return
            except requests.RequestException as exc:
                errored += 1
                self.stdout.write(self.style.WARNING(f'{label} -> erreur reseau: {exc}'))
                continue

            if result is None:
                empty += 1
                self.stdout.write(f'{label} -> squad indisponible')
                continue

            created, updated = result
            if created == 0 and updated == 0:
                empty += 1
                self.stdout.write(f'{label} -> squad vide')
                continue

            synced_teams += 1
            created_total += created
            updated_total += updated
            self.stdout.write(self.style.SUCCESS(
                f'{label} -> {created} cree(s), {updated} mis a jour'
            ))

        self.stdout.write(self.style.SUCCESS(
            f'Termine : {synced_teams} squad(s) synchronise(s), '
            f'{created_total} player(s) cree(s), {updated_total} mis a jour, '
            f'{empty} vide(s), {errored} en erreur reseau.'
        ))
