from django.db import IntegrityError
from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Pronostic
from ..pronostics import update_pronostic_points
from ..serializers import PronosticSerializer, get_user_avatar_url
from .common import User


class PronosticCreateView(generics.CreateAPIView):
    serializer_class = PronosticSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError("Vous avez deja pronostique ce match.")


class PronosticListView(generics.ListAPIView):
    serializer_class = PronosticSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Pronostic.objects.filter(match_id=self.kwargs['match_id'])


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


class LeaderboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        users = User.objects.filter(pronostics__isnull=False).select_related('badge').annotate(
            total_points=Coalesce(Sum('pronostics__points'), 0),
            pronostics_count=Count('pronostics', filter=Q(pronostics__points__isnull=False), distinct=True),
        ).order_by('-total_points', 'pronostics_count', 'username').distinct()

        data = [{
            'user': {
                'id': user.id,
                'username': user.username,
                'avatar_url': get_user_avatar_url(user, request),
                'badge': None if not user.badge else {
                    'id': user.badge.id,
                    'name': user.badge.name,
                    'icon': user.badge.icon,
                },
            },
            'total_points': user.total_points,
            'pronostics_count': user.pronostics_count,
            'points_ratio': round(user.total_points / user.pronostics_count, 2) if user.pronostics_count else None,
        } for user in users]

        return Response(data)
