import requests
from django.core.management.base import BaseCommand
from decouple import config
from matches.models import Match, Team

API_FOOTBALL_KEY = config('API_FOOTBALL_KEY', default='')
BASE_URL = 'https://v3.football.api-sports.io'

# Les 5 grands championnats avec leur ID API-Football et la saison dispo en gratuit
LEAGUES = {
    39: {'name': 'Premier League', 'season': 2024},
    140: {'name': 'La Liga', 'season': 2024},
    135: {'name': 'Serie A', 'season': 2024},
    61: {'name': 'Ligue 1', 'season': 2024},
    78: {'name': 'Bundesliga', 'season': 2024},
}

TEAM_SEARCH_ALIASES = {
    'PSG': 'Paris Saint Germain',
    'Bayern Münih': 'Bayern Munchen',
}


def _pick_team_result(results):
    for entry in results:
        name = (entry.get('team', {}).get('name') or '').lower()
        if any(tag in name for tag in (' u19', ' u23', ' ii', ' w')):
            continue
        return entry.get('team', {})
    return {}


def _search_team_logo(headers, team_name):
    search_name = TEAM_SEARCH_ALIASES.get(team_name, team_name)
    response = requests.get(
        f'{BASE_URL}/teams',
        headers=headers,
        params={'search': search_name},
        timeout=15,
    )
    response.raise_for_status()
    return _pick_team_result(response.json().get('response', []))


#le workflow de cette commande est le suivant :
# - pour chaque ligue on recup les teams en format json
# - pour chaque team on verifie si elle existe deja en base (en se basant sur le nom)
# - si elle existe pas on la cree avec le logo
# - si elle existe deja on met a jour le logo (au cas ou il a changé)
class Command(BaseCommand):
    help = 'Synchronise les teams etleur logo (mais que de 2024) depuis api-Football'

    def handle(self, *args, **options):
        if not API_FOOTBALL_KEY:
            self.stdout.write(self.style.ERROR('API_FOOTBALL_KEY manquante dans .env'))
            return

        headers = {'x-apisports-key': API_FOOTBALL_KEY}
        total_created = 0
        total_updated = 0

        for league_id, league_info in LEAGUES.items():
            self.stdout.write(f"\nRecuperation des equipes : {league_info['name']}...")
            # stdout write c le print dans les commands django

            response = requests.get(
                f'{BASE_URL}/teams',
                headers=headers,
                params={'league': league_id, 'season': league_info['season']},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()

            teams = data.get('response', [])
            if not teams:
                self.stdout.write(self.style.WARNING(
                    f"  Aucune equipe trouvee pour {league_info['name']}"
                ))
                continue

            for entry in teams:
                team_data = entry.get('team', {})
                api_id = str(team_data.get('id', '')).strip()
                name = (team_data.get('name') or '').strip()
                logo = team_data.get('logo') or ''
                country = team_data.get('country') or ''

                if not api_id or not name:
                    continue

                league_name = league_info['name']

                # D'abord chercher par name+league (pour merger avec les teams
                # creees par sync_matches qui n'ont pas d'api_id)
                team = Team.objects.filter(name__iexact=name, league=league_name).first()

                if team:
                    # Team existe deja → on met a jour logo/country et on remplit api_id si vide
                    if not team.api_id:
                        team.api_id = api_id
                    team.country = country
                    team.logo = logo
                    team.name = name
                    team.save()
                    total_updated += 1
                else:
                    # Team n'existe pas → on la cree
                    Team.objects.create(
                        api_id=api_id,
                        name=name,
                        league=league_name,
                        country=country,
                        logo=logo,
                    )
                    total_created += 1

            self.stdout.write(self.style.SUCCESS(
                f"  {len(teams)} equipes traitees pour {league_info['name']}"
            ))

        missing_names = set()
        champions_matches = Match.objects.filter(league='Champions League').select_related(
            'home_team',
            'away_team',
        )
        for match in champions_matches:
            if not match.home_team.logo:
                missing_names.add(match.home_team.name)
            if not match.away_team.logo:
                missing_names.add(match.away_team.name)

        for team_name in missing_names:
            team_data = _search_team_logo(headers, team_name)
            logo = team_data.get('logo') or ''
            if not logo:
                continue

            updated = Team.objects.filter(name=team_name).update(logo=logo)
            total_updated += updated
            self.stdout.write(self.style.SUCCESS(
                f"  Logo complete pour {team_name} ({updated} equipes)"
            ))

        self.stdout.write(self.style.SUCCESS(
            f"\nTermine ! {total_created} equipes creees, {total_updated} mises a jour."
        ))
