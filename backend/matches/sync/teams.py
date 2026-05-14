from matches.models import Team
from matches.clubs import canonical_club_key
from matches.sync.http import TEAM_LOGO_URL


def _find_existing_team(team_name):
    target_key = canonical_club_key(team_name)
    for team in Team.objects.all().order_by('-logo', 'id'):
        if canonical_club_key(team.name) == target_key:
            return team
    return None


def _release_api_id_from_other(api_id, keep_team):
    """Libere `api_id` s'il est tenu par une autre Team que `keep_team`."""
    Team.objects.filter(api_id=api_id).exclude(pk=keep_team.pk).update(api_id=None)


def _team_logo_url(api_id):
    api_id = (api_id or '').strip()
    if not api_id:
        return ''
    return TEAM_LOGO_URL.format(api_id=api_id)


def _save_if_changed(team, changed):
    if changed:
        team.save()
    return team


def _set_field(team, field, value, overwrite=True):
    if not value:
        return False
    current = getattr(team, field)
    if current == value or (current and not overwrite):
        return False
    setattr(team, field, value)
    return True


def find_or_create_team(team_data, league_name):
    """Trouve ou cree une Team depuis le bloc home/away Live Football API."""
    api_id = str(team_data.get('id') or '').strip()
    name = (team_data.get('name') or '').strip()
    logo = _team_logo_url(api_id)

    if api_id:
        team = Team.objects.filter(api_id=api_id).first()
        if team:
            changed = _set_field(team, 'name', name)
            changed = _set_field(team, 'logo', logo) or changed
            if league_name != 'Champions League' and team.league != league_name:
                team.league = league_name
                changed = True
            return _save_if_changed(team, changed)

    existing_team = _find_existing_team(name)
    if existing_team:
        changed = _set_field(existing_team, 'logo', logo, overwrite=False)
        if league_name != 'Champions League' and existing_team.league != league_name:
            existing_team.league = league_name
            changed = True
        return _save_if_changed(existing_team, changed)

    team = Team.objects.filter(name__iexact=name, league=league_name).first()
    if team:
        changed = False
        if api_id and team.api_id != api_id:
            _release_api_id_from_other(api_id, team)
            team.api_id = api_id
            changed = True
        changed = _set_field(team, 'logo', logo) or changed
        return _save_if_changed(team, changed)

    return Team.objects.create(
        api_id=api_id or None,
        name=name,
        league=league_name,
        logo=logo,
    )
