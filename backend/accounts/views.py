from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer, PublicUserSerializer, FollowSerializer, FavoriteClubSerializer, FavoriteClubListSerializer
from .models import Follow, FavoriteClub
from matches.models import Rating, Vote, Pronostic
from matches.serializers import RatingSerializer, VoteSerializer, PronosticSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.select_related('badge')
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.AllowAny]


class FollowView(generics.CreateAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(follower=self.request.user)
        except IntegrityError:
            raise ValidationError("Vous suivez déjà cet utilisateur.")


class UnfollowView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(Follow, follower=self.request.user, followee_id=self.kwargs['followee_id'])


class FavoriteClubCreateView(generics.CreateAPIView):
    serializer_class = FavoriteClubSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError("Ce club est déjà dans vos favoris.")


class FavoriteClubDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(FavoriteClub, user=self.request.user, team_id=self.kwargs['team_id'])


class FavoriteClubListView(generics.ListAPIView):
    serializer_class = FavoriteClubListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FavoriteClub.objects.filter(user=self.request.user).select_related('team')


class MyActivityView(APIView):
    #ici pas une listeapiview car on veut retourner les 3 listes (ratings, votes, pronostics) 
    # au lieu d'une liste d'un seul objet d'un seul  type genre que les ratings 
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            #many= true => signfieq qu'on attend une liste d'objets et pas un seul objet
            'ratings': RatingSerializer(Rating.objects.filter(user=user), many=True).data,
            'votes': VoteSerializer(Vote.objects.filter(user=user), many=True).data,
            'pronostics': PronosticSerializer(Pronostic.objects.filter(user=user), many=True).data,
        })


class UserActivityView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        return Response({
            'ratings': RatingSerializer(Rating.objects.filter(user=user), many=True).data,
            'votes': VoteSerializer(Vote.objects.filter(user=user), many=True).data,
            'pronostics': PronosticSerializer(Pronostic.objects.filter(user=user), many=True).data,
        })
