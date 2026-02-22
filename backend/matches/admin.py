from django.contrib import admin
from .models import Team, Player, Match, Rating, Vote, Pronostic

admin.site.register(Team)
admin.site.register(Player)
admin.site.register(Match)
admin.site.register(Rating)
admin.site.register(Vote)
admin.site.register(Pronostic)
