import requests
from decouple import config

API_FOOTBALL_KEY = config('API_FOOTBALL_KEY')
BASE_URL = 'https://v3.football.api-sports.io'

def get_matches(league_id,season):
    headers = {
        'x-apisports-key': API_FOOTBALL_KEY,
    }
    params = {
        'league': league_id,
        'season': season
    }
    response = requests.get(f'{BASE_URL}/fixtures', headers=headers, params=params)
    return response.json()

def get_teams(league_id, season):
    headers = { 'x-apisports-key': API_FOOTBALL_KEY }
    params = { 'league': league_id, 'season': season }
    response = requests.get(f'{BASE_URL}/teams', headers=headers, params=params)
    return response.json()
