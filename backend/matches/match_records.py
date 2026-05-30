from django.db.models import Count

from matches.models import Comment, Match, MatchPlayer, Pronostic, Rating, Vote


USER_MATCH_MODELS = (Rating, Vote, Pronostic)
MATCH_PLAYER_BOOLEAN_FIELDS = ('is_starter', 'subbed_in', 'subbed_out')
MATCH_PLAYER_COUNTER_FIELDS = ('goals', 'assists')


def _merge_unique_user_match_rows(model, duplicate, keep):
    """Rebranche les lignes (user, match) sans violer les contraintes d'unicite."""
    for row in model.objects.filter(match=duplicate):
        if model.objects.filter(match=keep, user=row.user).exists():
            row.delete()
        else:
            row.match = keep
            row.save(update_fields=['match'])


def _merge_match_players(duplicate, keep):
    for row in MatchPlayer.objects.filter(match=duplicate):
        existing = MatchPlayer.objects.filter(match=keep, player=row.player).first()
        if not existing:
            row.match = keep
            row.save(update_fields=['match'])
            continue

        changed_fields = []
        if not existing.team_id and row.team_id:
            existing.team = row.team
            changed_fields.append('team')

        for field in MATCH_PLAYER_BOOLEAN_FIELDS:
            if getattr(row, field) and not getattr(existing, field):
                setattr(existing, field, True)
                changed_fields.append(field)

        for field in MATCH_PLAYER_COUNTER_FIELDS:
            next_value = max(getattr(existing, field), getattr(row, field))
            if getattr(existing, field) != next_value:
                setattr(existing, field, next_value)
                changed_fields.append(field)

        if changed_fields:
            existing.save(update_fields=changed_fields)
        row.delete()


def merge_duplicate_match(duplicate, keep):
    """Fusionne un doublon de match sans supprimer l'activite utilisateur utile."""
    if duplicate.pk == keep.pk:
        return keep

    _merge_match_players(duplicate, keep)
    for model in USER_MATCH_MODELS:
        _merge_unique_user_match_rows(model, duplicate, keep)
    Comment.objects.filter(match=duplicate).update(match=keep)

    if not keep.mvp_id and duplicate.mvp_id:
        keep.mvp = duplicate.mvp
        keep.save(update_fields=['mvp'])

    duplicate.delete()
    return keep


def find_match_by_natural_key(match_date, league_name, home_team, away_team):
    """Trouve le match par sa vraie identite sportive et fusionne les doublons."""
    matches = list(
        Match.objects.filter(
            date=match_date,
            league=league_name,
            home_team=home_team,
            away_team=away_team,
        ).order_by('id')
    )
    if not matches:
        return None

    keep = matches[0]
    for duplicate in matches[1:]:
        merge_duplicate_match(duplicate, keep)
    return keep


def _can_assign_api_id(match, api_id):
    if not api_id:
        return False
    return not Match.objects.filter(api_id=api_id).exclude(pk=match.pk).exists()


def update_match_record(
    match,
    *,
    api_id=None,
    replace_api_id=False,
    date,
    league,
    home_team,
    away_team,
    home_score,
    away_score,
    status,
    status_display,
):
    updates = {
        'date': date,
        'league': league,
        'home_team': home_team,
        'away_team': away_team,
        'home_score': home_score,
        'away_score': away_score,
        'status': status,
        'status_display': status_display,
    }

    if _can_assign_api_id(match, api_id) and (replace_api_id or not match.api_id):
        updates['api_id'] = api_id

    changed_fields = []
    for field, value in updates.items():
        if getattr(match, field) != value:
            setattr(match, field, value)
            changed_fields.append(field)

    if changed_fields:
        match.save(update_fields=changed_fields)
    return match


def upsert_match_record(
    *,
    api_id,
    date,
    league,
    home_team,
    away_team,
    home_score,
    away_score,
    status,
    status_display,
    replace_api_id=False,
):
    natural_match = find_match_by_natural_key(date, league, home_team, away_team)
    if natural_match:
        return update_match_record(
            natural_match,
            api_id=api_id,
            replace_api_id=replace_api_id,
            date=date,
            league=league,
            home_team=home_team,
            away_team=away_team,
            home_score=home_score,
            away_score=away_score,
            status=status,
            status_display=status_display,
        ), False

    return Match.objects.update_or_create(
        api_id=api_id,
        defaults={
            'date': date,
            'league': league,
            'home_team': home_team,
            'away_team': away_team,
            'home_score': home_score,
            'away_score': away_score,
            'status': status,
            'status_display': status_display,
        },
    )


def dedupe_matches_by_natural_key():
    duplicate_groups = (
        Match.objects.values('date', 'league', 'home_team_id', 'away_team_id')
        .annotate(total=Count('id'))
        .filter(total__gt=1)
    )

    merged = 0
    for group in duplicate_groups:
        matches = list(
            Match.objects.filter(
                date=group['date'],
                league=group['league'],
                home_team_id=group['home_team_id'],
                away_team_id=group['away_team_id'],
            ).order_by('id')
        )
        keep = matches[0]

        for duplicate in matches[1:]:
            merge_duplicate_match(duplicate, keep)
            merged += 1

    return merged
