from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Comment, CommentReaction, CommentReport
from ..serializers import CommentReportSerializer, CommentSerializer


class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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


class CommentReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, comment_id):
        comment = get_object_or_404(Comment, pk=comment_id)

        if CommentReport.objects.filter(comment=comment, reported_by=request.user).exists():
            return Response(
                {'detail': 'Tu as deja signale ce commentaire.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CommentReportSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        report = serializer.save(comment=comment, reported_by=request.user)
        return Response(CommentReportSerializer(report).data, status=status.HTTP_201_CREATED)
