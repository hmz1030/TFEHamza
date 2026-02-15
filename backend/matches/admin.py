from django.contrib import admin
from .models import Team, Player, Match, Rating, Vote

admin.site.register(Team)
admin.site.register(Player)
admin.site.register(Match)
admin.site.register(Rating)
admin.site.register(Vote)
