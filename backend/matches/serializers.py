from rest_framework import serializers
from .models import Team, Player, Match, Rating, Vote


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ('id', 'name', 'league')

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'name', 'team')

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ('id', 'date', 'league', 'home_team', 'away_team', 'home_score', 'away_score', 'mvp')

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ('id', 'score', 'comment', 'user', 'match', 'created_at')
        read_only_fields = ('user', 'created_at')

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ('id', 'user', 'match', 'player', 'created_at')
        read_only_fields = ('user', 'created_at')

