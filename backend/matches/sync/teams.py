from matches.models import Team
from matches.clubs import canonical_club_key
from matches.sync.http import TEAM_LOGO_URL


def _find_existing_team(team_name):
    target_key = canonical_club_key(team_name)
    return Team.objects.filter(canonical_key=target_key).order_by('-logo', 'id').first()


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


def _should_replace_api_id(current_api_id, next_api_id):
    if not next_api_id:
        return False
    if not current_api_id:
        return True
    return current_api_id.isdigit() and not next_api_id.isdigit()


def _should_replace_logo(current_logo, next_logo):
    if not next_logo:
        return False
    if not current_logo:
        return True
    return 'api-sports.io' in current_logo and 'live-football-api.com' in next_logo


def find_or_create_team(team_data, league_name):
    """Trouve ou cree une Team depuis le bloc home/away Live Football API."""
    api_id = str(team_data.get('id') or '').strip()
    name = (team_data.get('name') or '').strip()
    canonical_key = canonical_club_key(name)
    logo = _team_logo_url(api_id)

    if api_id:
        team = Team.objects.filter(api_id=api_id).first()
        if team:
            changed = _set_field(team, 'name', name)
            changed = _set_field(team, 'canonical_key', canonical_key) or changed
            changed = _set_field(team, 'logo', logo) or changed
            if league_name != 'Champions League' and team.league != league_name:
                team.league = league_name
                changed = True
            return _save_if_changed(team, changed)

    existing_team = _find_existing_team(name)
    if existing_team:
        changed = _set_field(existing_team, 'logo', logo, overwrite=_should_replace_logo(existing_team.logo, logo))
        if _should_replace_api_id(existing_team.api_id or '', api_id):
            _release_api_id_from_other(api_id, existing_team)
            existing_team.api_id = api_id
            changed = True
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
        canonical_key=canonical_key,
        name=name,
        league=league_name,
        logo=logo,
    )
