import re
import unicodedata

from django.db import migrations


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
    normalized = CLUB_ALIASES.get(normalize_club_name(value), normalize_club_name(value))
    normalized = re.sub(r'^(fc|cf|sc|ac)\s+', '', normalized)
    normalized = re.sub(r'\s+(fc|cf|sc|ac)$', '', normalized)
    return CLUB_ALIASES.get(normalized, normalized)


def pick_canonical_team(teams):
    def is_live_api_id(team):
        return bool(team.api_id) and not str(team.api_id).isdigit()

    def has_live_logo(team):
        return 'live-football-api.com' in (team.logo or '')

    return sorted(
        teams,
        key=lambda team: (
            not is_live_api_id(team),
            not bool(team.api_id),
            team.league == 'Champions League',
            not has_live_logo(team),
            not bool(team.logo),
            team.id,
        ),
    )[0]


def merge_duplicates(apps, schema_editor):
    Team = apps.get_model('matches', 'Team')
    Match = apps.get_model('matches', 'Match')
    Player = apps.get_model('matches', 'Player')
    FavoriteClub = apps.get_model('accounts', 'FavoriteClub')

    groups = {}
    for team in Team.objects.all():
        groups.setdefault(canonical_club_key(team.name), []).append(team)

    for teams in groups.values():
        if len(teams) < 2:
            continue

        keep = pick_canonical_team(teams)
        duplicates = [team for team in teams if team.id != keep.id]

        for duplicate in duplicates:
            Match.objects.filter(home_team=duplicate).update(home_team=keep)
            Match.objects.filter(away_team=duplicate).update(away_team=keep)
            Player.objects.filter(team=duplicate).update(team=keep)

            for favorite in FavoriteClub.objects.filter(team=duplicate):
                if FavoriteClub.objects.filter(user=favorite.user, team=keep).exists():
                    favorite.delete()
                else:
                    favorite.team = keep
                    favorite.save(update_fields=['team'])

            if not keep.logo and duplicate.logo:
                keep.logo = duplicate.logo
            if not keep.country and duplicate.country:
                keep.country = duplicate.country
            keep.save()
            duplicate.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_user_avatar_user_bio'),
        ('matches', '0013_pronosticgroup_pronosticgroupmember'),
    ]

    operations = [
        migrations.RunPython(merge_duplicates, migrations.RunPython.noop),
    ]
