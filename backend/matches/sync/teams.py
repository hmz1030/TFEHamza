from matches.models import Team
from matches.sync.http import TEAM_LOGO_URL


def _find_existing_team(team_name):
    return Team.objects.filter(name__iexact=team_name).order_by('-logo', 'id').first()


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


def find_or_create_team(team_data, league_name):
    """Trouve ou cree une Team depuis le bloc home/away Live Football API."""
    api_id = str(team_data.get('id') or '').strip()
    name = (team_data.get('name') or '').strip()
    logo = _team_logo_url(api_id)

    if api_id:
        team = Team.objects.filter(api_id=api_id).first()
        if team:
            changed = False
            if name and team.name != name:
                team.name = name
                changed = True
            if logo and team.logo != logo:
                team.logo = logo
                changed = True
            if league_name != 'Champions League' and team.league != league_name:
                team.league = league_name
                changed = True
            return _save_if_changed(team, changed)

    if league_name == 'Champions League':
        existing_team = _find_existing_team(name)
        if existing_team:
            changed = False
            if api_id and existing_team.api_id != api_id:
                _release_api_id_from_other(api_id, existing_team)
                existing_team.api_id = api_id
                changed = True
            if logo and not existing_team.logo:
                existing_team.logo = logo
                changed = True
            return _save_if_changed(existing_team, changed)

    team = Team.objects.filter(name__iexact=name, league=league_name).first()
    if team:
        changed = False
        if api_id and team.api_id != api_id:
            _release_api_id_from_other(api_id, team)
            team.api_id = api_id
            changed = True
        if logo and team.logo != logo:
            team.logo = logo
            changed = True
        return _save_if_changed(team, changed)

    return Team.objects.create(
        api_id=api_id or None,
        name=name,
        league=league_name,
        logo=logo,
    )
