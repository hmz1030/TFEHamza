from rest_framework import serializers
from .models import Team, Player, Match, MatchPlayer, Rating, Comment, CommentReaction, Vote, Pronostic


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ('id', 'name', 'league', 'country', 'logo')


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'name', 'team', 'image', 'position', 'number', 'age')


class MatchPlayerSerializer(serializers.ModelSerializer):
    player = PlayerSerializer(read_only=True)

    class Meta:
        model = MatchPlayer
        fields = ('id', 'player', 'is_starter', 'goals', 'assists', 'subbed_in', 'subbed_out')


class MatchSerializer(serializers.ModelSerializer):
    home_team = TeamSerializer(read_only=True)
    away_team = TeamSerializer(read_only=True)
    average_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = Match
        fields = ('id', 'date', 'league', 'home_team', 'away_team', 'home_score', 'away_score', 'status', 'mvp', 'average_rating')


class RatingSerializer(serializers.ModelSerializer):
    score = serializers.IntegerField(min_value=1, max_value=10)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Rating
        fields = ('id', 'score', 'comment', 'user', 'user_username', 'match', 'created_at')
        read_only_fields = ('user', 'created_at')


class CommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    my_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            'id',
            'user',
            'user_username',
            'match',
            'parent',
            'content',
            'likes_count',
            'dislikes_count',
            'my_reaction',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('user', 'created_at', 'updated_at')

    def get_likes_count(self, obj):
        return obj.reactions.filter(value=CommentReaction.LIKE).count()

    def get_dislikes_count(self, obj):
        return obj.reactions.filter(value=CommentReaction.DISLIKE).count()

    def get_my_reaction(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        reaction = obj.reactions.filter(user=request.user).first()
        return reaction.value if reaction else None

    def validate(self, data):
        parent = data.get('parent')
        match = data.get('match')
        if parent and parent.match_id != match.id:
            raise serializers.ValidationError("La réponse doit viser un commentaire du même match.")
        return data


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ('id', 'user', 'match', 'player', 'created_at')
        read_only_fields = ('user', 'created_at')

    def validate(self, data):
        match = data['match']
        player = data['player']
        teams = [match.home_team, match.away_team]
        if player.team not in teams:
            raise serializers.ValidationError("Ce joueur ne joue pas ce match")
        return data


class PronosticSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Pronostic
        fields = ('id', 'user', 'user_username', 'match', 'home_score', 'away_score', 'points', 'created_at')
        read_only_fields = ('user', 'points', 'created_at')
