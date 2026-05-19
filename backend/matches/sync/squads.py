from matches.models import Player
from matches.sync.http import api_get, parse_int


def fetch_team_squad(team_api_id, season=None):
    """Recupere le squad complet d'une equipe (team_squad.php)."""
    params = {'team_id': team_api_id}
    if season:
        params['season'] = season
    return api_get('team_squad.php', params)


def sync_squad_for_team(team):
    """Synchronise les Player de `team` depuis team_squad.php."""
    if not team.api_id:
        return None
    data = fetch_team_squad(team.api_id)
    if data is None:
        return None

    squad = data.get('squad') or []
    if not squad:
        return (0, 0)

    created = 0
    updated = 0
    for raw in squad:
        api_id = str(raw.get('id') or '').strip()
        name = (raw.get('name') or '').strip()
        if not api_id or not name:
            continue
        defaults = {
            'name': name,
            'team': team,
            'image': (raw.get('image') or '').strip(),
            'position': (raw.get('position') or '').strip(),
            'number': parse_int(raw.get('number'), default=None),
            'age': parse_int(raw.get('age'), default=None),
        }
        _, was_created = Player.objects.update_or_create(
            api_id=api_id,
            defaults=defaults,
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return (created, updated)
