from datetime import datetime, timezone as dt_timezone

from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..clubs import get_related_team_ids, unique_teams
from ..models import Player, Rating, Team
from ..serializers import MatchSerializer, PlayerSerializer, TeamSerializer
from .common import get_match_queryset


class TeamListView(generics.ListAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        teams = unique_teams(self.get_queryset().order_by('name', 'league'))
        return Response(self.get_serializer(teams, many=True).data)


class TeamDetailView(generics.RetrieveAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.AllowAny]


class TeamOverviewView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        team = get_object_or_404(Team, pk=pk)
        season = self._get_season(request)
        start_date = datetime(season, 7, 1, tzinfo=dt_timezone.utc)
        end_date = datetime(season + 1, 7, 1, tzinfo=dt_timezone.utc)
        team_ids = get_related_team_ids(team)

        matches = (
            get_match_queryset()
            .filter(Q(home_team_id__in=team_ids) | Q(away_team_id__in=team_ids))
            .filter(date__gte=start_date, date__lt=end_date)
        )
        players = (
            Player.objects
            .filter(team_id__in=team_ids)
            .annotate(
                mvp_votes=Count('votes'),
                official_mvp_count=Count('mvp_matches', filter=Q(mvp_matches__in=matches), distinct=True),
                matches_played=Count('match_players', filter=Q(match_players__match__in=matches), distinct=True),
            )
            .filter(official_mvp_count__gt=0)
            .order_by('-official_mvp_count', '-mvp_votes', 'name')
        )

        user_ratings = Rating.objects.none()
        if request.user.is_authenticated:
            user_ratings = Rating.objects.filter(user=request.user, match__in=matches)

        return Response({
            'team': TeamSerializer(team).data,
            'season': season,
            'season_label': f'{season}-{season + 1}',
            'activity': {
                'rated_matches': user_ratings.count(),
                'average_rating': user_ratings.aggregate(value=Avg('score'))['value'],
                'total_matches': matches.count(),
            },
            'recent_matches': MatchSerializer(matches.order_by('-date')[:80], many=True).data,
            'top_players': [self._player_data(player) for player in players[:8]],
        })

    def _get_season(self, request):
        try:
            return int(request.query_params.get('season'))
        except (TypeError, ValueError):
            today = timezone.now().date()
            return today.year if today.month >= 7 else today.year - 1

    def _player_data(self, player):
        return {
            'id': player.id,
            'name': player.name,
            'image': player.image,
            'position': player.position,
            'number': player.number,
            'age': player.age,
            'mvp_votes': player.mvp_votes,
            'official_mvp_count': player.official_mvp_count,
            'matches_played': player.matches_played,
        }


class PlayerListView(generics.ListAPIView):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [permissions.AllowAny]
