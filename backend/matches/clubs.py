import re
import unicodedata

from matches.models import Team


CLUB_ALIASES = {
    'fc barcelona': 'barcelona',
    'barca': 'barcelona',
    'bayern munih': 'bayern munchen',
    'bayern munich': 'bayern munchen',
    'psg': 'paris saint germain',
}


def normalize_club_name(value):
    normalized = unicodedata.normalize('NFD', value or '')
    normalized = ''.join(char for char in normalized if unicodedata.category(char) != 'Mn')
    normalized = normalized.lower().replace('&', ' and ')
    normalized = re.sub(r'[^a-z0-9]+', ' ', normalized).strip()
    return re.sub(r'\s+', ' ', normalized)


def canonical_club_key(value):
    normalized = normalize_club_name(value)
    normalized = CLUB_ALIASES.get(normalized, normalized)
    normalized = re.sub(r'^(fc|cf|sc|ac)\s+', '', normalized)
    normalized = re.sub(r'\s+(fc|cf|sc|ac)$', '', normalized)
    return CLUB_ALIASES.get(normalized, normalized)


def get_related_team_ids(team):
    target_key = canonical_club_key(team.name)
    return [
        candidate.id
        for candidate in Team.objects.all()
        if canonical_club_key(candidate.name) == target_key
    ]


def unique_teams(queryset):
    teams = []
    seen_keys = set()

    for team in queryset:
        key = canonical_club_key(team.name)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        teams.append(team)

    return teams
