from django.contrib.auth.models import AbstractUser
from django.db import models
from matches.models import Team

# Create your models here.
class Badge(models.Model):
    name = models.CharField(max_length=100)
    min_rated_match = models.IntegerField()
    icon = models.URLField(blank=True, default='')

    class Meta:
        db_table = 'badge'

    def __str__(self):
        return self.name


class User(AbstractUser):
    badge = models.ForeignKey(Badge, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'user'

    def __str__(self):
        return self.username
    

class Follow(models.Model):
    follower = models.ForeignKey(User,on_delete=models.CASCADE, related_name='following')
    followee = models.ForeignKey(User, on_delete=models.CASCADE,  related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'follow'
         # contrainte unique, pas sur de name, a verifier !!
        constraints = [
            models.UniqueConstraint(name='unique_follow', fields=['follower', 'followee']),
            # le ~ veut dire non, donc je veux pas me  suivre moi meme 
            models.CheckConstraint(name='no_self_follow', condition=~models.Q(follower=models.F('followee'))),
        ]

    def __str__(self):
        return f"{self.follower.username} follows {self.followee.username}"

class FavoriteClub(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    team = models.ForeignKey(Team,on_delete=models.CASCADE)

    class Meta:
        db_table = 'favorite_club'
        # contrainte unique, pas sur de name, a verifier !!
        constraints = [
            models.UniqueConstraint(name='unique_favorite_club', fields=['user', 'team']),
        ]
                                    
    def __str__(self):
        return f"{self.user.username} likes {self.team.name}"