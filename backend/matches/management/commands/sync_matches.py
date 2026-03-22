from datetime import date, timezone as dt_timezone

import requests
from django.core.management.base import BaseCommand
from django.utils import timezone
from decouple import config
from matches.models import Team, Match

#workflow de cette script : 
# - on recup les matchs du jour depuis live football API en format json 
# - on met ces data dans des variables python (home_name, away_name etc..)
# et ensuite apres verif, on ecrit ou update les matchs dans la database 


LIVE_FOOTBALL_API_KEY = config('LIVE_FOOTBALL_API_KEY', default='')
# Optionnel : IDs `league.id` renvoyés par matches.php (séparés par des virgules).
# Si défini, seuls ces matchs sont importés (liste blanche stricte, recommandé).
LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS = frozenset(
    x.strip()
    for x in config('LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS', default='').split(',')
    if x.strip()
)
BASE_URL = 'https://live-football-api.com/api/v1'

# Ligues cibles et leurs aliases pour matcher les noms retournes par l'API
TARGET_LEAGUES = {
    'Premier League': {
        'aliases': ('premier league',),
        'countries': ('england',),
    },
    'La Liga': {
        'aliases': ('la liga', 'laliga'),
        'countries': ('spain',),
    },
    'Serie A': {
        'aliases': ('serie a',),
        'countries': ('italy',),
    },
    'Ligue 1': {
        'aliases': ('ligue 1',),
        'countries': ('france',),
    },
    'Bundesliga': {
        'aliases': ('bundesliga',),
        'countries': ('germany',),
    },
}

# Pays autorisés pour les 5 grands championnats (après normalisation)
_ALLOWED_COUNTRIES = frozenset()
for _cfg in TARGET_LEAGUES.values():
    _ALLOWED_COUNTRIES = _ALLOWED_COUNTRIES | frozenset(_cfg['countries'])

# Sous-chaînes dans le nom de ligue : ligues à exclure (Portugal, 2e divisions, etc.)
_REJECT_LEAGUE_NAME_SUBSTRINGS = (
    'primeira',
    'liga portugal',
    'ligue 2',
    'bundesliga 2',
    '2. bundesliga',
    'serie b',
    'segunda',
    'la liga 2',
    'laliga 2',
    'eredivisie',
    'brasileir',
    'super lig',
    'scottish',
    'welsh',
    'northern irish',
    'championship',  # Championship anglais (pas Premier League)
    'league one',
    'league two',
)


def _normalize(text):
    return (text or '').strip().lower()


def _normalize_country(raw):
    """Unifie les variantes (UK, Deutschland…) pour le filtre pays."""
    c = _normalize(raw if isinstance(raw, str) else str(raw or ''))
    mapping = {
        'uk': 'england',
        'united kingdom': 'england',
        'great britain': 'england',
        'gb': 'england',
        'deutschland': 'germany',
        'espana': 'spain',
        'españa': 'spain',
        'italia': 'italy',
    }
    return mapping.get(c, c)


def _reject_league_name(api_league_name):
    """Exclut les ligues dont le nom ressemble aux grands championnats mais ne l'est pas."""
    n = _normalize(api_league_name)
    if not n:
        return True
    return any(sub in n for sub in _REJECT_LEAGUE_NAME_SUBSTRINGS)


def _get_league_name(api_league_name, api_country_name):
    """Retourne le nom normalise de la ligue si elle fait partie des 5 grands championnats."""
    if _reject_league_name(api_league_name):
        return None

    name = _normalize(api_league_name)
    country = _normalize_country(api_country_name)

    # Pays doit être strictement l'un des 5 (évite pays vide / erreur API)
    if country not in _ALLOWED_COUNTRIES:
        return None

    for league_name, cfg in TARGET_LEAGUES.items():
        aliases = cfg['aliases']
        countries = cfg['countries']

        if country in countries and any(alias == name for alias in aliases):
            return league_name
    return None


def _league_allowed_by_id(api_league_id):
    """Si LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS est défini, seul l'ID compte."""
    if not LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS:
        return True
    lid = (api_league_id or '').strip()
    return lid in LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS


def _find_or_create_team(team_name, league_name):
    """Cherche une equipe par nom + ligue. Si introuvable, la creer sans logo."""
    team_name = (team_name or '').strip()

    # Cherche par nom + ligue (insensible a la casse)
    team = Team.objects.filter(name__iexact=team_name, league=league_name).first()
    if team:
        return team

    # Equipe introuvable (probablement promue), on la cree sans logo
    return Team.objects.create(
        name=team_name,
        league=league_name,
    )


class Command(BaseCommand):
    help = 'Synchronise les matchs du jour depuis Live Football API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date au format YYYY-MM-DD (par defaut -> aujourdhui)',
        )

    def handle(self, *args, **options):
        if not LIVE_FOOTBALL_API_KEY:
            self.stdout.write(self.style.ERROR('LIVE_FOOTBALL_API_KEY manquante dans .env'))
            return

        target_date = options.get('date')
        if target_date:
            target_date = date.fromisoformat(target_date)
        else:
            target_date = timezone.now().date()

        self.stdout.write(f"Recuperation des matchs pour le {target_date.isoformat()}...")

        response = requests.get(
            f'{BASE_URL}/matches.php',
            params={
                'api_key': LIVE_FOOTBALL_API_KEY,
                'date': target_date.isoformat(),
                'lang': 'en',
            },
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()

        if not payload.get('success'):
            self.stdout.write(self.style.ERROR('API a retourne success=false'))
            return

        all_matches = payload.get('data', {}).get('matches', [])
        self.stdout.write(f"  {len(all_matches)} matchs totaux recus de l'API")

        created = 0
        updated = 0
        skipped = 0
        valid_api_ids = set()

        for match_data in all_matches:
            league_block = match_data.get('league') or {}
            api_league_id = str(league_block.get('id', '') or '').strip()
            api_league_name = league_block.get('name', '')
            api_country_name = league_block.get('country', '')

            # Liste blanche stricte optionnelle (LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS)
            if not _league_allowed_by_id(api_league_id):
                skipped += 1
                continue

            # Verifier si c'est un des 5 grands championnats (nom + pays + exclusions)
            league_name = _get_league_name(api_league_name, api_country_name)
            if not league_name:
                skipped += 1
                continue

            api_id = str(match_data.get('id', '')).strip()
            if not api_id:
                skipped += 1
                continue

            home_name = match_data.get('home', {}).get('name', '')
            away_name = match_data.get('away', {}).get('name', '')
            home_score = match_data.get('home', {}).get('score', '0')
            away_score = match_data.get('away', {}).get('score', '0')
            kickoff = match_data.get('kickoff', '00:00')
            status_data = match_data.get('status', {})
            status = status_data.get('status', 'scheduled')

            if not home_name or not away_name:
                skipped += 1
                continue

            # Trouver ou creer les equipes
            home_team = _find_or_create_team(home_name, league_name)
            away_team = _find_or_create_team(away_name, league_name)

            # Construire le datetime du match
            match_datetime = timezone.datetime.combine(
                target_date,
                timezone.datetime.strptime(kickoff, '%H:%M').time(),
                tzinfo=dt_timezone.utc,
            )

            # Convertir les scores en int
            try:
                home_score_int = int(home_score) if home_score else 0
            except (ValueError, TypeError):
                home_score_int = 0
            try:
                away_score_int = int(away_score) if away_score else 0
            except (ValueError, TypeError):
                away_score_int = 0

            # Creer ou mettre a jour le match
            match, was_created = Match.objects.update_or_create(
                api_id=api_id,
                defaults={
                    'date': match_datetime,
                    'league': league_name,
                    'home_team': home_team,
                    'away_team': away_team,
                    'home_score': home_score_int,
                    'away_score': away_score_int,
                    'status': status,
                },
            )

            if was_created:
                created += 1
            else:
                updated += 1

            valid_api_ids.add(api_id)

        deleted = Match.objects.filter(date__date=target_date).exclude(api_id__in=valid_api_ids).delete()[0]

        self.stdout.write(self.style.SUCCESS(
            f"\nTermine ! {created} matchs crees, {updated} mis a jour, {deleted} supprimes, {skipped} ignores (autres ligues)."
        ))
