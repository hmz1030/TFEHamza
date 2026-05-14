from io import StringIO
from datetime import datetime, timezone as dt_timezone

from django.conf import settings
from django.core.management import call_command
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q, Sum
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Badge
from .clubs import get_related_team_ids, unique_teams
from .models import Team, Player, Match, MatchPlayer, Rating, Comment, CommentReaction, Vote, Pronostic, PronosticGroup, PronosticGroupMember
from .pronostics import update_pronostic_points
from .serializers import TeamSerializer, PlayerSerializer, MatchPlayerSerializer, MatchSerializer, RatingSerializer, CommentSerializer, VoteSerializer, PronosticSerializer, PronosticGroupSerializer, PronosticGroupMemberSerializer, PronosticGroupCreateSerializer, PronosticGroupInviteSerializer, PronosticGroupResponseSerializer

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
                matches_played=Count('match_players', filter=Q(match_players__match__in=matches), distinct=True),
            )
            .order_by('-mvp_votes', 'name')
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
            'recent_matches': MatchSerializer(matches.order_by('-date')[:12], many=True).data,
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
            'matches_played': player.matches_played,
        }

class PlayerListView(generics.ListAPIView):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [permissions.AllowAny]

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


class DevSyncMatchesView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not sync_endpoints_enabled():
            return Response(
                {'detail': 'Cet endpoint est disponible uniquement en mode développement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        stdout = StringIO()
        target_date = request.data.get('date')
        days_ahead = request.data.get('days_ahead', 0)

        if target_date and not parse_date(target_date):
            return Response(
                {'detail': 'Le format de date attendu est YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            days_ahead = int(days_ahead)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'days_ahead doit etre un entier.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if days_ahead < 0 or days_ahead > 21:
            return Response(
                {'detail': 'days_ahead doit etre compris entre 0 et 21.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start_date = parse_date(target_date) if target_date else timezone.now().date()
            command_kwargs = {
                'stdout': stdout,
                'date': start_date.isoformat(),
                'days_ahead': days_ahead,
            }
            if request.data.get('delete_missing'):
                command_kwargs['delete_missing'] = True
            call_command('sync_matches', **command_kwargs)
        except Exception as exc:
            return Response(
                {
                    'detail': 'La synchronisation des matchs a échoué.',
                    'error': str(exc),
                    'output': stdout.getvalue(),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                'detail': 'Synchronisation terminée.',
                'output': stdout.getvalue(),
            },
            status=status.HTTP_200_OK,
        )


class DevSyncLiveScoresView(APIView):
    """Refresh ultra-leger : scores + statuts des matchs d'une date."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not sync_endpoints_enabled():
            return Response(
                {'detail': 'Cet endpoint est disponible uniquement en mode développement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        stdout = StringIO()
        command_kwargs = {'stdout': stdout}

        target_date = request.data.get('date')
        if target_date and not parse_date(target_date):
            return Response(
                {'detail': 'Le format de date attendu est YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if target_date:
            command_kwargs['date'] = target_date
        if request.data.get('force'):
            command_kwargs['force'] = True

        try:
            call_command('sync_live_scores', **command_kwargs)
        except Exception as exc:
            return Response(
                {'detail': 'Le refresh live a echoue.', 'error': str(exc), 'output': stdout.getvalue()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'detail': 'Refresh live termine.', 'output': stdout.getvalue()},
            status=status.HTTP_200_OK,
        )


class DevSyncLineupsView(APIView):
    """Sync des lineups sur la fenetre utile (live / imminents / recents)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not sync_endpoints_enabled():
            return Response(
                {'detail': 'Cet endpoint est disponible uniquement en mode développement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        stdout = StringIO()
        command_kwargs = {'stdout': stdout}

        if request.data.get('match_id'):
            command_kwargs['match_id'] = request.data['match_id']
        if request.data.get('all'):
            command_kwargs['all'] = True
        if request.data.get('window_before_hours') is not None:
            command_kwargs['window_before_hours'] = int(request.data['window_before_hours'])
        if request.data.get('recent_hours') is not None:
            command_kwargs['recent_hours'] = int(request.data['recent_hours'])

        try:
            call_command('sync_lineups', **command_kwargs)
        except Exception as exc:
            return Response(
                {'detail': 'La sync des lineups a echoue.', 'error': str(exc), 'output': stdout.getvalue()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'detail': 'Sync des lineups terminee.', 'output': stdout.getvalue()},
            status=status.HTTP_200_OK,
        )


class DevSyncSquadsView(APIView):
    """Sync des squads (image / position / number / age) via team_squad.php."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not sync_endpoints_enabled():
            return Response(
                {'detail': 'Cet endpoint est disponible uniquement en mode développement.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        stdout = StringIO()
        command_kwargs = {'stdout': stdout}

        if request.data.get('team_api_id'):
            command_kwargs['team_api_id'] = request.data['team_api_id']
        if request.data.get('match_id'):
            command_kwargs['match_id'] = int(request.data['match_id'])
        if request.data.get('league'):
            command_kwargs['league'] = request.data['league']
        if request.data.get('all'):
            command_kwargs['all'] = True

        try:
            call_command('sync_squads', **command_kwargs)
        except Exception as exc:
            return Response(
                {'detail': 'La sync des squads a echoue.', 'error': str(exc), 'output': stdout.getvalue()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'detail': 'Sync des squads terminee.', 'output': stdout.getvalue()},
            status=status.HTTP_200_OK,
        )


class RatingCreateView(generics.CreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
            #integrity error : permet de lever une exception si une erreur db est levée
        except IntegrityError:
            raise ValidationError("Vous avez déjà noté ce match.")

        # apres chaque rating, on check si le user merite un nouveau badge
        user = self.request.user
        total_ratings = Rating.objects.filter(user=user).count()
        # on prend le badge le plus eleve que le user peut avoir
        best_badge = Badge.objects.filter(min_rated_match__lte=total_ratings).order_by('-min_rated_match').first()
        if best_badge and user.badge != best_badge:
            user.badge = best_badge
            user.save()


class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CommentReactionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, comment_id):
        comment = get_object_or_404(Comment, pk=comment_id)
        value = request.data.get('value')

        if value not in (CommentReaction.LIKE, CommentReaction.DISLIKE):
            return Response(
                {'detail': 'Reaction invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reaction = CommentReaction.objects.filter(
            user=request.user,
            comment=comment,
        ).first()

        if reaction and reaction.value == value:
            reaction.delete()
            my_reaction = None
        elif reaction:
            reaction.value = value
            reaction.save(update_fields=['value'])
            my_reaction = value
        else:
            CommentReaction.objects.create(
                user=request.user,
                comment=comment,
                value=value,
            )
            my_reaction = value

        return Response({
            'comment': comment.id,
            'likes_count': comment.reactions.filter(value=CommentReaction.LIKE).count(),
            'dislikes_count': comment.reactions.filter(value=CommentReaction.DISLIKE).count(),
            'my_reaction': my_reaction,
        })


class VoteCreateView(generics.CreateAPIView):
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError("Vous avez déjà voté pour ce match.")


class PronosticCreateView(generics.CreateAPIView):
    serializer_class = PronosticSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError("Vous avez déjà pronostiqué ce match.")


class PronosticPointsCalculationView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        match_id = request.data.get('match')

        if match_id is not None:
            try:
                match_id = int(match_id)
            except (TypeError, ValueError):
                return Response(
                    {'detail': 'match doit etre un identifiant entier.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        result = update_pronostic_points(match_id=match_id)

        return Response({
            'updated': result['updated'],
            'skipped': result['skipped'],
            'scoring': {
                'exact_score': 3,
                'correct_result': 1,
                'wrong_result': 0,
            },
        })


class PronosticListView(generics.ListAPIView):
    serializer_class = PronosticSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Pronostic.objects.filter(match_id=self.kwargs['match_id'])
    
class RatingListView(generics.ListAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Rating.objects.filter(match_id=self.kwargs['match_id'])


class CommentListView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Comment.objects
            .filter(match_id=self.kwargs['match_id'])
            .select_related('user', 'match', 'parent')
            .order_by('created_at')
        )
    
class VoteListView(generics.ListAPIView):
    serializer_class = VoteSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Vote.objects.filter(match_id=self.kwargs['match_id'])


class LeaderboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        users = User.objects.filter(pronostics__isnull=False).select_related('badge').annotate(
            total_points=Coalesce(Sum('pronostics__points'), 0)
        ).order_by('-total_points', 'username').distinct()

        data = [{
            'user': {
                'id': user.id,
                'username': user.username,
                'badge': None if not user.badge else {
                    'id': user.badge.id,
                    'name': user.badge.name,
                    'icon': user.badge.icon,
                },
            },
            'total_points': user.total_points,
        } for user in users]

        return Response(data)


class PronosticGroupListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        groups = (
            PronosticGroup.objects
            .filter(memberships__user=request.user, memberships__status=PronosticGroupMember.ACCEPTED)
            .select_related('owner')
            .prefetch_related('memberships__user', 'memberships__invited_by')
            .distinct()
        )
        return Response(PronosticGroupSerializer(groups, many=True).data)

    def post(self, request):
        serializer = PronosticGroupCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = serializer.save(owner=request.user)
        PronosticGroupMember.objects.create(
            group=group,
            user=request.user,
            invited_by=request.user,
            status=PronosticGroupMember.ACCEPTED,
            responded_at=timezone.now(),
        )
        return Response(PronosticGroupSerializer(group).data, status=status.HTTP_201_CREATED)


class PronosticGroupInvitationListView(generics.ListAPIView):
    serializer_class = PronosticGroupMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            PronosticGroupMember.objects
            .filter(user=self.request.user, status=PronosticGroupMember.PENDING)
            .select_related('group', 'user', 'invited_by')
            .order_by('-created_at')
        )


class PronosticGroupDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        group = get_group_for_member(group_id, request.user)
        return Response(PronosticGroupSerializer(group).data)


class PronosticGroupInviteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        group = get_group_for_member(group_id, request.user)
        serializer = PronosticGroupInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = get_object_or_404(User, pk=serializer.validated_data['user'])

        if target_user == request.user:
            return Response({'detail': 'Tu es deja membre de ce groupe.'}, status=status.HTTP_400_BAD_REQUEST)

        membership, created = PronosticGroupMember.objects.get_or_create(
            group=group,
            user=target_user,
            defaults={'invited_by': request.user},
        )

        if not created and membership.status in (PronosticGroupMember.ACCEPTED, PronosticGroupMember.PENDING):
            return Response({'detail': 'Cet utilisateur est deja membre ou invite.'}, status=status.HTTP_400_BAD_REQUEST)

        if not created:
            membership.status = PronosticGroupMember.PENDING
            membership.invited_by = request.user
            membership.responded_at = None
            membership.save(update_fields=['status', 'invited_by', 'responded_at'])

        return Response(PronosticGroupMemberSerializer(membership).data, status=status.HTTP_201_CREATED)


class PronosticGroupResponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        membership = get_object_or_404(
            PronosticGroupMember,
            group_id=group_id,
            user=request.user,
            status=PronosticGroupMember.PENDING,
        )
        serializer = PronosticGroupResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']

        membership.status = PronosticGroupMember.ACCEPTED if action == 'accept' else PronosticGroupMember.REFUSED
        membership.responded_at = timezone.now()
        membership.save(update_fields=['status', 'responded_at'])

        return Response(PronosticGroupMemberSerializer(membership).data)


class PronosticGroupLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        membership = get_object_or_404(
            PronosticGroupMember,
            group_id=group_id,
            user=request.user,
            status=PronosticGroupMember.ACCEPTED,
        )
        membership.status = PronosticGroupMember.LEFT
        membership.responded_at = timezone.now()
        membership.save(update_fields=['status', 'responded_at'])
        return Response({'detail': 'Tu as quitte le groupe.'})


class PronosticGroupLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        group = get_group_for_member(group_id, request.user)
        member_ids = group.memberships.filter(status=PronosticGroupMember.ACCEPTED).values_list('user_id', flat=True)
        users = User.objects.filter(id__in=member_ids).select_related('badge').annotate(
            total_points=Coalesce(Sum('pronostics__points'), 0)
        ).order_by('-total_points', 'username')

        data = [{
            'user': {
                'id': user.id,
                'username': user.username,
                'badge': None if not user.badge else {
                    'id': user.badge.id,
                    'name': user.badge.name,
                    'icon': user.badge.icon,
                },
            },
            'total_points': user.total_points,
        } for user in users]

        return Response(data)
