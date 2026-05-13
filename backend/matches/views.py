from io import StringIO

from django.conf import settings
from django.core.management import call_command
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.db.models import Avg, Sum
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Badge
from .models import Team, Player, Match, MatchPlayer, Rating, Comment, CommentReaction, Vote, Pronostic
from .pronostics import update_pronostic_points
from .serializers import TeamSerializer, PlayerSerializer, MatchPlayerSerializer, MatchSerializer, RatingSerializer, CommentSerializer, VoteSerializer, PronosticSerializer

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


class TeamListView(generics.ListAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.AllowAny]

class TeamDetailView(generics.RetrieveAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [permissions.AllowAny]

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
