from django.db import models

# Create your models here.
class Match(models.Model):
    pass


class Player(models.Model):
    pass

class Team(models.Model):
    name = models.CharField(max_length=100)
    league= models.CharField(max_length=100)
    ## logo ?? url ou bien image stocké 
    


