from datetime import date

import requests
from decouple import config


BASE_URL = "https://live-football-api.com/api/v1"
LIVE_FOOTBALL_API_KEY = config("LIVE_FOOTBALL_API_KEY", default="")


TARGET_LEAGUES = {
    "la_liga": ("la liga", "laliga"),
    "serie_a": ("serie a",),
    "premier_league": ("premier league",),
    "ligue_1": ("ligue 1",),
}


class LiveFootballApiError(Exception):
    pass


def _normalize(text: str) -> str:
    return (text or "").strip().lower()


def _extract_matches(payload: dict) -> list:
    if not payload.get("success"):
        raise LiveFootballApiError("LiveFootballApi returned success=false")
    data = payload.get("data", {})
    return data.get("matches", [])


def _league_key(league_name: str) -> str | None:
    name = _normalize(league_name)
    for key, aliases in TARGET_LEAGUES.items():
        if any(alias in name for alias in aliases):
            return key
    return None


def _request_matches_by_date(target_date: date, lang: str = "en") -> list:
    if not LIVE_FOOTBALL_API_KEY:
        raise LiveFootballApiError(
            "Missing LIVE_FOOTBALL_API_KEY environment variable"
        )

    response = requests.get(
        f"{BASE_URL}/matches.php",
        params={
            "api_key": LIVE_FOOTBALL_API_KEY,
            "date": target_date.isoformat(),
            "lang": lang,
        },
        timeout=15,
    )
    response.raise_for_status()
    return _extract_matches(response.json())


def get_overview(today: date, tomorrow: date) -> dict:
    today_matches = _request_matches_by_date(today)
    tomorrow_matches = _request_matches_by_date(tomorrow)

    grouped_today = {
        "la_liga": [],
        "serie_a": [],
        "premier_league": [],
        "ligue_1": [],
    }

    for match in today_matches:
        league_name = match.get("league", {}).get("name", "")
        league_key = _league_key(league_name)
        if league_key in grouped_today:
            grouped_today[league_key].append(match)

    tomorrow_laliga = []
    for match in tomorrow_matches:
        league_name = match.get("league", {}).get("name", "")
        if _league_key(league_name) == "la_liga":
            tomorrow_laliga.append(match)

    return {
        "today_date": today.isoformat(),
        "tomorrow_date": tomorrow.isoformat(),
        "today": grouped_today,
        "tomorrow_laliga": tomorrow_laliga,
        "meta": {
            "credits_used_per_overview_call": 2,
            "source": "LiveFootballApi matches.php",
        },
    }
