"""Facade temporaire pour les services de synchronisation Live Football API.

Les implementations vivent maintenant dans `matches.sync.*`. Ce module garde
les anciens imports valides pendant la migration progressive des consommateurs.
"""

from matches.sync.http import (
    BASE_URL,
    LIVE_FOOTBALL_API_KEY,
    TEAM_LOGO_URL,
    TRANSIENT_HTTP_STATUSES,
    SyncError,
    api_get,
)
from matches.sync.leagues import (
    LIVE_FOOTBALL_ALLOWED_LEAGUE_IDS,
    TARGET_LEAGUES,
    _normalize,
    _normalize_country,
    _reject_league_name,
    get_league_name,
    league_allowed_by_id,
)
from matches.sync.lineups import (
    ensure_players,
    fetch_lineups,
    fetch_match_details,
    get_sub_in_ids,
    players_who_played,
    sync_lineup_for_match,
    sync_match_players,
)
from matches.sync.matches import (
    _filter_target_match,
    _parse_int,
    fetch_matches_for_date,
    resolve_target_date,
    update_match_live_data,
    upsert_match_full,
)
from matches.sync.squads import (
    _parse_optional_int,
    fetch_team_squad,
    sync_squad_for_team,
)
from matches.sync.teams import (
    _find_existing_team,
    _release_api_id_from_other,
    _team_logo_url,
    find_or_create_team,
)
