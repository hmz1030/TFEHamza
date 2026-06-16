from django.contrib import admin, messages
from django.shortcuts import get_object_or_404, redirect
from django.urls import path
from django.utils import timezone

from .models import (
    Comment,
    CommentReaction,
    CommentReport,
    Match,
    MatchPlayer,
    Player,
    Pronostic,
    PronosticGroup,
    PronosticGroupMember,
    Rating,
    Team,
    Vote,
)

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
    change_form_template = 'admin/custom_delete_comment_button.html'
    list_display = ('id', 'author', 'reported_by', 'status', 'excerpt', 'type', 'created_at')
    list_filter = ('status', 'created_at')
    readonly_fields = ('contenu_signale',)
    search_fields = (
        'comment__content',
        'comment__user__username',
        'rating__comment',
        'rating__user__username',
        'reported_by__username',
    )
    actions = ('mark_reviewed', 'mark_dismissed')

    def author(self, obj):
        if obj.comment:
            return obj.comment.user
        if obj.rating:
            return obj.rating.user
        return '-'

    def excerpt(self, obj):
        if obj.comment:
            return obj.comment.content[:80]
        if obj.rating:
            return obj.rating.comment[:80]
        return '-'

    def type(self, obj):
        if obj.comment:
            return 'Commentaire'
        if obj.rating:
            return 'Note'
        return '-'

    def contenu_signale(self, obj):
        if obj.comment:
            return obj.comment.content
        if obj.rating:
            return obj.rating.comment or '[Aucun commentaire dans cette note]'
        return '-'

    def mark_reviewed(self, request, queryset):
        queryset.update(status=CommentReport.REVIEWED, reviewed_by=request.user, reviewed_at=timezone.now())

    def mark_dismissed(self, request, queryset):
        queryset.update(status=CommentReport.DISMISSED, reviewed_by=request.user, reviewed_at=timezone.now())

    def mask_reported_content(self, request, report_id):
        report = get_object_or_404(CommentReport, pk=report_id)

        if request.method != 'POST':
            return redirect('admin:matches_commentreport_change', report.pk)

        if report.comment:
            report.comment.content = '[Contenu masque par un moderateur]'
            report.comment.save(update_fields=['content'])
        elif report.rating:
            report.rating.comment = '[Contenu masque par un moderateur]'
            report.rating.save(update_fields=['comment'])

        report.status = CommentReport.REVIEWED
        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()
        report.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])

        self.message_user(request, 'Contenu signale masque.', messages.SUCCESS)
        return redirect('admin:matches_commentreport_change', report.pk)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:report_id>/mask-content/',
                self.admin_site.admin_view(self.mask_reported_content),
                name='matches_commentreport_mask_content',
            ),
        ]
        return custom_urls + urls
