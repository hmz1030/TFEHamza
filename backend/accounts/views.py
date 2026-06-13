from django.db import IntegrityError
from django.db.models import Avg, Sum
from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404, render
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer, PublicUserSerializer, ProfileUpdateSerializer, FollowSerializer, FavoriteClubSerializer, FavoriteClubListSerializer
from .models import Follow, FavoriteClub
from matches.models import Match, Rating, Comment, Vote, Pronostic
from matches.serializers import MatchSerializer, RatingSerializer, CommentSerializer, VoteSerializer, PronosticSerializer, get_user_avatar_url

User = get_user_model()
FRIENDS_FEED_DEFAULT_LIMIT = 10
FRIENDS_FEED_MAX_LIMIT = 25
PRONOSTICS_DEFAULT_LIMIT = 3
PRONOSTICS_MAX_LIMIT = 25


def parse_positive_int(raw_value, default):
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return default

    return value if value >= 0 else default


def serialize_feed_user(user, request):
    return {
        'id': user.id,
        'username': user.username,
        'avatar_url': get_user_avatar_url(user, request),
        'badge': None if not user.badge else {
            'id': user.badge.id,
            'name': user.badge.name,
            'icon': user.badge.icon,
        },
    }


def get_pronostics_payload(user, request, offset=0, limit=None):
    queryset = (
        Pronostic.objects
        .filter(user=user)
        .select_related('user', 'match', 'match__home_team', 'match__away_team')
        .order_by('-created_at', '-id')
    )
    total_count = queryset.count()
    total_points = queryset.aggregate(total=Sum('points'))['total'] or 0

    if limit is None:
        page = list(queryset)
        has_more = False
    else:
        safe_limit = min(max(limit, 1), PRONOSTICS_MAX_LIMIT)
        page = list(queryset[offset:offset + safe_limit + 1])
        has_more = len(page) > safe_limit
        page = page[:safe_limit]

    return {
        'pronostics': PronosticSerializer(page, many=True, context={'request': request}).data,
        'pronostics_count': total_count,
        'pronostics_total_points': total_points,
        'pronostics_next_offset': offset + len(page),
        'pronostics_has_more': has_more,
    }


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


class ProfileUpdateView(generics.UpdateAPIView):
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    http_method_names = ['patch']

    def get_object(self):
        return self.request.user

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        serializer = UserSerializer(self.request.user, context={'request': request})
        response.data = serializer.data
        return response


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.select_related('badge')
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.AllowAny]


class UserListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.select_related('badge').exclude(pk=self.request.user.pk).order_by('username')
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(username__icontains=search)
        return queryset[:10]


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


class UserFavoriteClubListView(generics.ListAPIView):
    serializer_class = FavoriteClubListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return FavoriteClub.objects.filter(user_id=self.kwargs['user_id']).select_related('team')


class MyActivityView(APIView):
    #ici pas une listeapiview car on veut retourner les 3 listes (ratings, votes, pronostics) 
    # au lieu d'une liste d'un seul objet d'un seul  type genre que les ratings 
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        pronostics_limit = request.query_params.get('pronostics_limit')
        pronostics_offset = parse_positive_int(request.query_params.get('pronostics_offset'), 0)
        pronostics_payload = get_pronostics_payload(
            user,
            request,
            offset=pronostics_offset,
            limit=parse_positive_int(pronostics_limit, PRONOSTICS_DEFAULT_LIMIT) if pronostics_limit else None,
        )
        return Response({
            #many= true => signfieq qu'on attend une liste d'objets et pas un seul objet
            'ratings': RatingSerializer(Rating.objects.filter(user=user), many=True).data,
            'comments': CommentSerializer(Comment.objects.filter(user=user), many=True).data,
            'votes': VoteSerializer(Vote.objects.filter(user=user), many=True).data,
            **pronostics_payload,
        })


class MyPronosticActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        offset = parse_positive_int(request.query_params.get('offset'), 0)
        limit = parse_positive_int(request.query_params.get('limit'), PRONOSTICS_DEFAULT_LIMIT)
        return Response(get_pronostics_payload(request.user, request, offset=offset, limit=limit))


class FriendsFeedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        offset = parse_positive_int(request.query_params.get('offset'), 0)
        requested_limit = parse_positive_int(
            request.query_params.get('limit'),
            FRIENDS_FEED_DEFAULT_LIMIT,
        )
        limit = min(max(requested_limit, 1), FRIENDS_FEED_MAX_LIMIT)
        take = offset + limit + 1

        following_ids = Follow.objects.filter(
            follower=request.user,
        ).values_list('followee_id', flat=True)

        ratings = list(
            Rating.objects
            .filter(user_id__in=following_ids)
            .select_related('user__badge', 'match__home_team', 'match__away_team')
            .order_by('-created_at', '-id')[:take]
        )
        comments = list(
            Comment.objects
            .filter(user_id__in=following_ids)
            .select_related('user__badge', 'match__home_team', 'match__away_team')
            .prefetch_related('reactions')
            .order_by('-created_at', '-id')[:take]
        )

        feed_items = (
            [{'type': 'rating', 'object': rating} for rating in ratings]
            + [{'type': 'comment', 'object': comment} for comment in comments]
        )
        feed_items.sort(
            key=lambda item: (item['object'].created_at, item['object'].id),
            reverse=True,
        )

        page_items = feed_items[offset:offset + limit]
        match_ids = {item['object'].match_id for item in page_items}
        matches = {
            match.id: match
            for match in (
                Match.objects
                .filter(id__in=match_ids)
                .select_related('home_team', 'away_team', 'mvp')
                .annotate(average_rating=Avg('ratings__score'))
            )
        }

        serialized_items = []
        for item in page_items:
            obj = item['object']
            item_type = item['type']
            match = matches.get(obj.match_id, obj.match)
            serialized = {
                'id': f'{item_type}-{obj.id}',
                'type': item_type,
                'created_at': obj.created_at,
                'user': serialize_feed_user(obj.user, request),
                'match': MatchSerializer(match).data,
            }
            if item_type == 'rating':
                serialized['rating'] = RatingSerializer(obj, context={'request': request}).data
            else:
                serialized['comment'] = CommentSerializer(obj, context={'request': request}).data
            serialized_items.append(serialized)

        return Response({
            'results': serialized_items,
            'offset': offset,
            'limit': limit,
            'next_offset': offset + len(serialized_items),
            'has_more': len(feed_items) > offset + limit,
        })


class UserActivityView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        pronostics_limit = request.query_params.get('pronostics_limit')
        pronostics_offset = parse_positive_int(request.query_params.get('pronostics_offset'), 0)
        pronostics_payload = get_pronostics_payload(
            user,
            request,
            offset=pronostics_offset,
            limit=parse_positive_int(pronostics_limit, PRONOSTICS_DEFAULT_LIMIT) if pronostics_limit else None,
        )
        return Response({
            'ratings': RatingSerializer(Rating.objects.filter(user=user), many=True).data,
            'comments': CommentSerializer(Comment.objects.filter(user=user), many=True).data,
            'votes': VoteSerializer(Vote.objects.filter(user=user), many=True).data,
            **pronostics_payload,
        })


class UserPronosticActivityView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        offset = parse_positive_int(request.query_params.get('offset'), 0)
        limit = parse_positive_int(request.query_params.get('limit'), PRONOSTICS_DEFAULT_LIMIT)
        return Response(get_pronostics_payload(user, request, offset=offset, limit=limit))

class UserShareProfilView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self,request,user_id):
        user = get_object_or_404(User, pk=user_id)
        title = f"Découvrez le profil de {user.username} sur MatchNote !"
        image_url = get_user_avatar_url(user, request)
        profile_path = f'/profile-redirect/{user.id}'
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        redirect_url = f'{frontend_url}{profile_path}' if frontend_url else request.build_absolute_uri(profile_path)
        context = {
            'title': title,
            'image_url': image_url,
            'redirect_url': redirect_url,
            'description': f"Consultez le profil de {user.username} sur MatchNote.",
            }
        return render(request, 'share_profil.html', context)
