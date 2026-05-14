from django.contrib import admin
from .models import Team, Player, Match, MatchPlayer, Rating, Comment, CommentReaction, Vote, Pronostic, PronosticGroup, PronosticGroupMember

admin.site.register(Team)
admin.site.register(Player)
admin.site.register(Match)
admin.site.register(MatchPlayer)
admin.site.register(Rating)
admin.site.register(Comment)
admin.site.register(CommentReaction)
admin.site.register(Vote)
admin.site.register(Pronostic)
admin.site.register(PronosticGroup)
admin.site.register(PronosticGroupMember)
