import re
import unicodedata

from django.db import migrations, models


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


def populate_canonical_keys(apps, schema_editor):
    Team = apps.get_model('matches', 'Team')
    for team in Team.objects.all():
        team.canonical_key = canonical_club_key(team.name)
        team.save(update_fields=['canonical_key'])


class Migration(migrations.Migration):

    dependencies = [
        ('matches', '0014_merge_duplicate_teams'),
    ]

    operations = [
        migrations.AddField(
            model_name='team',
            name='canonical_key',
            field=models.CharField(blank=True, db_index=True, max_length=140, null=True, unique=True),
        ),
        migrations.RunPython(populate_canonical_keys, migrations.RunPython.noop),
    ]
