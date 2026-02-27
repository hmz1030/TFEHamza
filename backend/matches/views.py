from django.db import IntegrityError
from django.utils import timezone
from rest_framework import generics, permissions
from .models import Team, Player, Match, Rating, Vote, Pronostic
from .serializers import TeamSerializer, PlayerSerializer, MatchSerializer, RatingSerializer, VoteSerializer, PronosticSerializer


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
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]

class MatchDetailView(generics.RetrieveAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]
    

class TodayMatchListView(generics.ListAPIView):
    serializer_class = MatchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        today = timezone.now().date()
        return Match.objects.filter(date__date=today).order_by('date')


class RatingCreateView(generics.CreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
            #integrity error : permet de lever une exception si une erreur db est levée
        except IntegrityError:
            raise generics.ValidationError("Vous avez déjà noté ce match.")


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
