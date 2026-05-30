from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Avg
from django.shortcuts import get_object_or_404

from ..models import Match, PronosticGroup, PronosticGroupMember


User = get_user_model()


def sync_endpoints_enabled():
    return settings.DEBUG and settings.ENABLE_SYNC_ENDPOINTS


def get_match_queryset():
    return (
        Match.objects
        .select_related('home_team', 'away_team', 'mvp')
        .annotate(average_rating=Avg('ratings__score'))
        .order_by('date')
    )


def get_group_for_member(group_id, user):
    return get_object_or_404(
        PronosticGroup.objects.prefetch_related('memberships__user', 'memberships__invited_by'),
        pk=group_id,
        memberships__user=user,
        memberships__status=PronosticGroupMember.ACCEPTED,
    )
