import requests
from django.core.management.base import BaseCommand

from matches.models import Team
from matches.pronostics import update_pronostic_points
from matches.sync.http import SyncError
from matches.sync.leagues import TARGET_LEAGUES
from matches.sync.team_matches import sync_team_matches


def is_lfa_api_id(value):
    """Les IDs Live Football API contiennent generalement des lettres."""
    if not value:
        return False
    return not str(value).isdigit()


class Command(BaseCommand):
    help = "Synchronise les matchs de saison par equipe via team_matches.php"

    def add_arguments(self, parser):
        parser.add_argument('--team-api-id', type=str, help='api_id Live Football API d une equipe')
        parser.add_argument('--league', type=str, help='Restreindre a une ligue cible')
        parser.add_argument('--season', type=int, help='Saison API optionnelle, ex: 2025')

    def handle(self, *args, **options):
        queryset = Team.objects.exclude(api_id__isnull=True).exclude(api_id='').order_by('league', 'name')

        if options.get('team_api_id'):
            queryset = queryset.filter(api_id=options['team_api_id'])
        elif options.get('league'):
            queryset = queryset.filter(league=options['league'])
        else:
            queryset = queryset.filter(league__in=TARGET_LEAGUES.keys())

        teams = [team for team in queryset if is_lfa_api_id(team.api_id)]
        skipped_legacy = queryset.count() - len(teams)

        if not teams:
            self.stdout.write('Aucune equipe eligible a synchroniser.')
            if skipped_legacy:
                self.stdout.write(f'{skipped_legacy} equipe(s) ignoree(s) avec un api_id obsolete.')
            return

        season = options.get('season')
        self.stdout.write(f'Sync team_matches pour {len(teams)} equipe(s)...')
        if season:
            self.stdout.write(f'Saison API : {season}')
        if skipped_legacy:
            self.stdout.write(self.style.WARNING(
                f'{skipped_legacy} equipe(s) avec un api_id obsolete ignoree(s).'
            ))

        total_received = 0
        total_created = 0
        total_updated = 0
        total_skipped = 0
        affected_dates = set()
        errored = 0

        for index, team in enumerate(teams, start=1):
            label = f'[{index}/{len(teams)}] {team.name} ({team.league})'
            try:
                result = sync_team_matches(team, season=season)
            except SyncError as exc:
                self.stdout.write(self.style.ERROR(str(exc)))
                return
            except requests.RequestException as exc:
                errored += 1
                self.stdout.write(self.style.WARNING(f'{label} -> erreur reseau: {exc}'))
                continue

            total_received += result['received']
            total_created += result['created']
            total_updated += result['updated']
            total_skipped += result['skipped']
            affected_dates.update(result['affected_dates'])

            self.stdout.write(self.style.SUCCESS(
                f"{label} -> {result['created']} cree(s), "
                f"{result['updated']} mis a jour, {result['skipped']} ignore(s)"
            ))

        total_pronostics = 0
        for target_date in affected_dates:
            total_pronostics += update_pronostic_points(target_date=target_date)['updated']

        self.stdout.write(self.style.SUCCESS(
            f'\nTermine : {total_received} match(s) recus, '
            f'{total_created} cree(s), {total_updated} mis a jour, '
            f'{total_skipped} ignore(s), {total_pronostics} pronostic(s) recalcules, '
            f'{errored} erreur(s).'
        ))
