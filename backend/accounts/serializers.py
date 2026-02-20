from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Follow, FavoriteClub

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'badge')
        read_only_fields = fields

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