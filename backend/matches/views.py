from io import StringIO
from datetime import timedelta

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
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Badge
from .models import Team, Player, Match, Rating, Vote, Pronostic
from .serializers import TeamSerializer, PlayerSerializer, MatchSerializer, RatingSerializer, VoteSerializer, PronosticSerializer

User = get_user_model()

def get_match_queryset():
    return Match.objects.annotate(
        average_rating=Avg('ratings__score')
    ).order_by('date')


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
    serializer_class = PlayerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        match = get_object_or_404(Match, pk=self.kwargs['match_id'])
        return Player.objects.filter(match_players__match=match).order_by('team_id', 'name').distinct()


class TodayMatchListView(generics.ListAPIView):
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        today = timezone.now().date()
        return get_match_queryset().filter(date__date=today)


class DevSyncMatchesView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.DEBUG:
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

        try:
            start_date = parse_date(target_date) if target_date else timezone.now().date()
            for offset in range(days_ahead + 1):
                command_kwargs = {
                    'stdout': stdout,
                    'date': (start_date + timedelta(days=offset)).isoformat(),
                }
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


class DevSyncPlayersView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.DEBUG:
            return Response({'detail': 'Cet endpoint est disponible uniquement en mode développement.'}, status=status.HTTP_403_FORBIDDEN)

        stdout = StringIO()
        command_kwargs = {'stdout': stdout}
        if request.data.get('date'):
            command_kwargs['date'] = request.data['date']
        if request.data.get('match_id'):
            command_kwargs['match_id'] = request.data['match_id']

        try:
            call_command('sync_players', **command_kwargs)
        except Exception as exc:
            return Response({'detail': str(exc), 'output': stdout.getvalue()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': 'Synchronisation des joueurs terminee.', 'output': stdout.getvalue()}, status=status.HTTP_200_OK)


class RatingCreateView(generics.CreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
            #integrity error : permet de lever une exception si une erreur db est levée
        except IntegrityError:
            raise generics.ValidationError("Vous avez déjà noté ce match.")

        # apres chaque rating, on check si le user merite un nouveau badge
        user = self.request.user
        total_ratings = Rating.objects.filter(user=user).count()
        # on prend le badge le plus eleve que le user peut avoir
        best_badge = Badge.objects.filter(min_rated_match__lte=total_ratings).order_by('-min_rated_match').first()
        if best_badge and user.badge != best_badge:
            user.badge = best_badge
            user.save()


class VoteCreateView(generics.CreateAPIView):
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise generics.ValidationError("Vous avez déjà voté pour ce match.")


class PronosticCreateView(generics.CreateAPIView):
    serializer_class = PronosticSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise generics.ValidationError("Vous avez déjà pronostiqué ce match.")


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
