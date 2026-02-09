from django.db import models

# Create your models here.
class Match(models.Model):
    date = models.DateTimeField()
    league = models.CharField(max_length=100)
    home_team = models.CharField(max_length=100)
    away_team = models.CharField(max_length=100)
    home_score = models.IntegerField()
    away_score = models.IntegerField()
    mvp_id = models.IntegerField(default=None, blank=True, null=True)
    class Meta:
        db_table = 'match' ## nom de la table en db 
    


class Player(models.Model):
    name = models.CharField(max_length=100)
    team_id = models.IntegerField()
    class Meta:
        db_table = 'player' ## nom de la table en db 

class Team(models.Model):
    name = models.CharField(max_length=100)
    league= models.CharField(max_length=100)
    ## logo ?? url ou bien image stocké 
    class Meta: 
        db_table = 'team' ## nom de la table en db 
    


