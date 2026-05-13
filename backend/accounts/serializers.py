import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Badge, Follow, FavoriteClub
from matches.serializers import TeamSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(validators=[])
    email = serializers.EmailField(validators=[])
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_password(self, value):
        validate_password(value)

        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                'Le mot de passe doit contenir au moins une lettre majuscule.'
            )

        if not re.search(r'[^A-Za-z0-9]', value):
            raise serializers.ValidationError(
                'Le mot de passe doit contenir au moins un caractère spécial.'
            )

        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        return user


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ('id', 'name', 'min_rated_match', 'icon')
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'badge')
        read_only_fields = fields


class PublicUserSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_followed_by = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'badge',
            'followers_count',
            'following_count',
            'is_following',
            'is_followed_by',
        )
        read_only_fields = fields

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or request.user == obj:
            return False

        return Follow.objects.filter(follower=request.user, followee=obj).exists()

    def get_is_followed_by(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or request.user == obj:
            return False

        return Follow.objects.filter(follower=obj, followee=request.user).exists()

class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ('id', 'follower', 'followee', 'created_at')
        read_only_fields = ('follower','created_at')

class FavoriteClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteClub
        fields = ('id', 'user', 'team')
        read_only_fields = ('user',)


class FavoriteClubListSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)

    class Meta:
        model = FavoriteClub
        fields = ('id', 'team')
        read_only_fields = fields
