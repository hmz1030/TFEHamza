from rest_framework import serializers
from .models import Team, Player, Match, Rating, Vote, Pronostic


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
    score = serializers.IntegerField(min_value=1, max_value=10)

    class Meta:
        model = Rating
        fields = ('id', 'score', 'comment', 'user', 'match', 'created_at')
        read_only_fields = ('user', 'created_at')


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ('id', 'user', 'match', 'player', 'created_at')
        read_only_fields = ('user', 'created_at')
        
    #verif si le joueur joue dans le match
    def validate(self, data):
        match = data['match']
        player = data['player']
        teams = [match.home_team, match.away_team]
        if player.team not in teams:
            raise serializers.ValidationError("Ce joueur ne joue pas ce match")
        return data


class PronosticSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pronostic
        fields = ('id', 'user', 'match', 'home_score', 'away_score', 'points', 'created_at')
        read_only_fields = ('user', 'points', 'created_at')

