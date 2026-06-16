from django.db.models import Count
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Comment, CommentReaction, CommentReport
from ..serializers import CommentReportSerializer, CommentSerializer
from ..utiles.dynamic_share_image import generate_match_share_image


INITIAL_REPLY_LIMIT = 2
DEFAULT_REPLY_LIMIT = 3
MAX_REPLY_LIMIT = 25


class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CommentListView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        base_queryset = (
            Comment.objects
            .filter(match_id=self.kwargs['match_id'])
            .select_related('user', 'match', 'parent')
        )

        parents = list(
            base_queryset
            .filter(parent__isnull=True)
            .annotate(replies_count=Count('replies'))
            .order_by('created_at')
        )

        replies = []
        for parent in parents:
            replies.extend(
                base_queryset
                .filter(parent_id=parent.id)
                .order_by('created_at')[:INITIAL_REPLY_LIMIT]
            )

        return parents + replies


def parse_positive_int(value, default, maximum=None):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default

    parsed = max(parsed, 0)
    if maximum is not None:
        parsed = min(parsed, maximum)
    return parsed


class CommentReplyListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, comment_id):
        get_object_or_404(Comment, pk=comment_id)

        limit = parse_positive_int(request.query_params.get('limit'), DEFAULT_REPLY_LIMIT, MAX_REPLY_LIMIT)
        offset = parse_positive_int(request.query_params.get('offset'), 0)

        replies = list(
            Comment.objects
            .filter(parent_id=comment_id)
            .select_related('user', 'match', 'parent')
            .order_by('created_at')[offset:offset + limit + 1]
        )

        serializer = CommentSerializer(replies[:limit], many=True, context={'request': request})
        return Response({
            'results': serializer.data,
            'has_more': len(replies) > limit,
        })


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
class CommentShareView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, comment_id):
        comment = get_object_or_404(Comment, pk=comment_id)
        match = comment.match
        home_team = match.home_team
        away_team = match.away_team
        title = "Regarde le commentaire de " + comment.user.username
        image_url = request.build_absolute_uri(f'/share/comments/{comment.id}/image/')
        comment_path = f'/matches/{match.id}?comment={comment.id}#comment-{comment.id}'
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        redirect_url = f'{frontend_url}{comment_path}' if frontend_url else request.build_absolute_uri(comment_path)
        #render va directement chercher le html dans le dossier /templates
        #context c le dictionnaire de variable qu'on envoie au templatr html
        context = {"match" : match,
                   "title" : title,
                   "comment" : comment,
                   "image_url" : image_url,
                   "redirect_url" : redirect_url
                   }
        return render(request,"share_comment.html", context)

class CommentShareImageView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, comment_id):
        comment = get_object_or_404(Comment, pk=comment_id)
        image_bytes = generate_match_share_image(comment.match)
        return HttpResponse(image_bytes, content_type="image/png")
