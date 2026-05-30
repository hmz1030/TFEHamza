from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import PronosticGroup, PronosticGroupMember
from ..serializers import (
    PronosticGroupCreateSerializer,
    PronosticGroupInviteSerializer,
    PronosticGroupMemberSerializer,
    PronosticGroupResponseSerializer,
    PronosticGroupSerializer,
    get_user_avatar_url,
)
from .common import User, get_group_for_member


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
            total_points=Coalesce(Sum('pronostics__points'), 0),
            pronostics_count=Count('pronostics', filter=Q(pronostics__points__isnull=False), distinct=True),
        ).order_by('-total_points', 'pronostics_count', 'username')

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
