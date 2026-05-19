from django.contrib import admin
from django.utils import timezone

from .models import Team, Player, Match, MatchPlayer, Rating, Comment, CommentReaction, CommentReport, Vote, Pronostic, PronosticGroup, PronosticGroupMember

admin.site.register(Team)
admin.site.register(Player)
admin.site.register(Match)
admin.site.register(MatchPlayer)
admin.site.register(Rating)
admin.site.register(CommentReaction)
admin.site.register(Vote)
admin.site.register(Pronostic)
admin.site.register(PronosticGroup)
admin.site.register(PronosticGroupMember)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'match', 'short_content', 'created_at')
    search_fields = ('content', 'user__username', 'match__home_team__name', 'match__away_team__name')
    list_filter = ('created_at',)

    def short_content(self, obj):
        return obj.content[:80]


@admin.register(CommentReport)
class CommentReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'comment_author', 'reported_by', 'status', 'comment_excerpt', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('comment__content', 'comment__user__username', 'reported_by__username')
    actions = ('mark_reviewed', 'mark_dismissed')

    def comment_author(self, obj):
        return obj.comment.user

    def comment_excerpt(self, obj):
        return obj.comment.content[:80]

    def mark_reviewed(self, request, queryset):
        queryset.update(status=CommentReport.REVIEWED, reviewed_by=request.user, reviewed_at=timezone.now())

    def mark_dismissed(self, request, queryset):
        queryset.update(status=CommentReport.DISMISSED, reviewed_by=request.user, reviewed_at=timezone.now())
