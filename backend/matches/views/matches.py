from datetime import datetime, time, timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import generics, permissions

from ..models import Match, MatchPlayer
from ..serializers import MatchPlayerSerializer, MatchSerializer
from .common import get_match_queryset


DISPLAY_TIMEZONE = ZoneInfo('Europe/Brussels')


def filter_matches_for_display_date(queryset, target_date):
    start = datetime.combine(target_date, time.min, tzinfo=DISPLAY_TIMEZONE)
    end = start + timedelta(days=1)
    return queryset.filter(
        date__gte=start.astimezone(dt_timezone.utc),
        date__lt=end.astimezone(dt_timezone.utc),
    )


class MatchListView(generics.ListAPIView):
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = get_match_queryset()
        target_date = self.request.query_params.get('date')

        if not target_date:
            return queryset

        parsed_date = parse_date(target_date)
        if not parsed_date:
            return Match.objects.none()

        return filter_matches_for_display_date(queryset, parsed_date)


class MatchDetailView(generics.RetrieveAPIView):
    queryset = get_match_queryset()
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]


class MatchPlayerListView(generics.ListAPIView):
    serializer_class = MatchPlayerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        match = get_object_or_404(Match, pk=self.kwargs['match_id'])
        return (
            MatchPlayer.objects
            .filter(match=match)
            .select_related('player', 'player__team')
            .order_by('player__team_id', '-is_starter', 'player__number', 'player__name')
        )


class TodayMatchListView(generics.ListAPIView):
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        today = timezone.now().astimezone(DISPLAY_TIMEZONE).date()
        return filter_matches_for_display_date(get_match_queryset(), today)
