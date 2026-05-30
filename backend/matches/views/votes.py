from django.db import IntegrityError
from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError

from ..models import Vote
from ..mvp import update_match_mvp
from ..serializers import VoteSerializer


class VoteCreateView(generics.CreateAPIView):
    serializer_class = VoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            vote = serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError("Vous avez deja vote pour ce match.")

        update_match_mvp(vote.match)


class VoteListView(generics.ListAPIView):
    serializer_class = VoteSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Vote.objects.filter(match_id=self.kwargs['match_id'])
