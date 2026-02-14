from django.contrib.auth.models import AbstractUser
from django.db import models

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
    

