from django.db.models import Count

from .models import Vote


def update_match_mvp(match):
    """Met a jour le MVP courant du match a partir des votes utilisateurs."""
    winner = (
        Vote.objects
        .filter(match=match)
        .values('player')
        .annotate(total=Count('id'))
        .order_by('-total', 'player')
        .first()
    )
    next_mvp_id = winner['player'] if winner else None

    if match.mvp_id != next_mvp_id:
        match.mvp_id = next_mvp_id
        match.save(update_fields=['mvp'])

    return next_mvp_id
