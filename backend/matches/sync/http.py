import requests
from decouple import config


LIVE_FOOTBALL_API_KEY = config('LIVE_FOOTBALL_API_KEY', default='')
BASE_URL = 'https://live-football-api.com/api/v1'
TEAM_LOGO_URL = 'https://live-football-api.com/teams/{api_id}.png'
TRANSIENT_HTTP_STATUSES = frozenset({500, 502, 503, 504})


class SyncError(Exception):
    """Erreur generique levee lors d'une sync."""


def api_get(endpoint, params):
    """Appelle un endpoint de Live Football API avec la cle d'API globale."""
    if not LIVE_FOOTBALL_API_KEY:
        raise SyncError("LIVE_FOOTBALL_API_KEY manquante dans .env")

    params = dict(params)
    params['api_key'] = LIVE_FOOTBALL_API_KEY
    params.setdefault('lang', 'en')

    try:
        response = requests.get(f'{BASE_URL}/{endpoint}', params=params, timeout=20)
    except (requests.Timeout, requests.ConnectionError):
        return None

    if response.status_code in TRANSIENT_HTTP_STATUSES:
        return None

    response.raise_for_status()
    payload = response.json()
    if not payload.get('success'):
        return None
    return payload.get('data') or {}


def parse_int(raw, default=0):
    if raw in (None, '', '-'):
        return default
    try:
        return int(str(raw).strip())
    except (ValueError, TypeError):
        return default
