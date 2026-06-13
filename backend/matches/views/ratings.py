from django.conf import settings
from django.db import IntegrityError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from accounts.models import Badge

from ..models import Rating
from ..serializers import RatingSerializer
from ..utiles.dynamic_share_image import generate_match_share_image


class RatingCreateView(generics.CreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError("Vous avez deja note ce match.")

        user = self.request.user
        total_ratings = Rating.objects.filter(user=user).count()
        best_badge = Badge.objects.filter(min_rated_match__lte=total_ratings).order_by('-min_rated_match').first()
        if best_badge and user.badge != best_badge:
            user.badge = best_badge
            user.save(update_fields=['badge'])


class RatingListView(generics.ListAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Rating.objects.filter(match_id=self.kwargs['match_id'])


class RatingShareView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, rating_id):
        rating = get_object_or_404(Rating, pk=rating_id)
        match = rating.match
        image_url = request.build_absolute_uri(f'/share/ratings/{rating_id}/image/')
        rating_path = f'/matches/{match.id}?rating={rating.id}#rating-{rating.id}'
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        redirect_url = f'{frontend_url}{rating_path}' if frontend_url else request.build_absolute_uri(rating_path)
        description = rating.comment.strip() or (
            f"{rating.user.username} a donne {rating.score}/10 a {match.home_team.name} - {match.away_team.name}."
        )
        context = {
            'title': "Regarde cette note sur MatchNote !",
            'description': description,
            'match': match,
            'rating': rating,
            'image_url': image_url,
            'redirect_url': redirect_url,
        }
        return render(request, 'share_rating.html', context)


class RatingShareImageView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, rating_id):
        rating = get_object_or_404(Rating, pk=rating_id)
        image_bytes = generate_match_share_image(rating.match)
        return HttpResponse(image_bytes, content_type="image/png")
