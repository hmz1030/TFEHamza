from decouple import config


LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS = frozenset(
    x.strip()
    for x in config('LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS', default='').split(',')
    if x.strip()
)

TARGET_LEAGUES = {
    'Premier League': {'aliases': ('premier league',), 'countries': ('england',)},
    'La Liga': {'aliases': ('la liga', 'laliga'), 'countries': ('spain',)},
    'Serie A': {'aliases': ('serie a',), 'countries': ('italy',)},
    'Ligue 1': {'aliases': ('ligue 1',), 'countries': ('france',)},
    'Bundesliga': {'aliases': ('bundesliga',), 'countries': ('germany',)},
    'Champions League': {
        'aliases': ('champions league', 'uefa champions league'),
        'countries': ('europe',),
    },
}

_ALLOWED_COUNTRIES = frozenset(
    country
    for cfg in TARGET_LEAGUES.values()
    for country in cfg['countries']
)

_REJECT_LEAGUE_NAME_SUBSTRINGS = (
    'primeira', 'liga portugal', 'ligue 2', 'bundesliga 2',
    '2. bundesliga', 'serie b', 'segunda', 'la liga 2',
    'laliga 2', 'eredivisie', 'brasileir', 'super lig',
    'scottish', 'welsh', 'northern irish', 'championship',
    'league one', 'league two',
)


def _normalize(text):
    return (text or '').strip().lower()


def _normalize_country(raw):
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
    n = _normalize(api_league_name)
    if not n:
        return True
    return any(sub in n for sub in _REJECT_LEAGUE_NAME_SUBSTRINGS)


def get_league_name(api_league_name, api_country_name):
    """Retourne le nom normalise si la ligue fait partie des championnats cibles."""
    if _reject_league_name(api_league_name):
        return None

    name = _normalize(api_league_name)
    country = _normalize_country(api_country_name)
    if country not in _ALLOWED_COUNTRIES:
        return None

    for league_name, cfg in TARGET_LEAGUES.items():
        if country in cfg['countries'] and any(alias == name for alias in cfg['aliases']):
            return league_name
    return None


def league_allowed_by_id(api_league_id):
    """Si LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS est defini, seul l'ID compte."""
    if not LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS:
        return True
    lid = (api_league_id or '').strip()
    return lid in LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS
