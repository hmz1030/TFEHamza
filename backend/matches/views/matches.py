from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import generics, permissions

from ..models import Match, MatchPlayer
from ..serializers import MatchPlayerSerializer, MatchSerializer
from .common import get_match_queryset


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

        return queryset.filter(date__date=parsed_date)


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
        today = timezone.now().date()
        return get_match_queryset().filter(date__date=today)
