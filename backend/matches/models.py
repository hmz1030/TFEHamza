from django.db import models
from django.db.models import Q


class Team(models.Model):
    api_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    canonical_key = models.CharField(max_length=140, unique=True, null=True, blank=True, db_index=True)
    name = models.CharField(max_length=100)
    league = models.CharField(max_length=100)
    country = models.CharField(max_length=100, blank=True, default='')
    logo = models.URLField(blank=True, default='')

    class Meta:
        db_table = 'team'

    def __str__(self):
        return self.name


class Player(models.Model):
    api_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players')
    position = models.CharField(max_length=50, blank=True, default='')
    image = models.URLField(blank=True, default='')
    number = models.PositiveIntegerField(null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'player'

    def __str__(self):
        return self.name


class Match(models.Model):
    api_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    date = models.DateTimeField()
    league = models.CharField(max_length=100)
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches')
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches')
    minute = models.PositiveIntegerField(null=True, blank=True)
    home_score = models.IntegerField(default=0)
    away_score = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='scheduled')
    status_display = models.CharField(max_length=20, blank=True, default='')
    mvp = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='mvp_matches')
    lineup_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'match'

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} - {self.date}"


class MatchPlayer(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='match_players')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='match_players')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='match_players', null=True, blank=True)
    is_starter = models.BooleanField(default=False)
    goals = models.PositiveSmallIntegerField(default=0)
    assists = models.PositiveSmallIntegerField(default=0)
    subbed_in = models.BooleanField(default=False)
    subbed_out = models.BooleanField(default=False)

    class Meta:
        db_table = 'match_player'
        unique_together = ('match', 'player')

    def __str__(self):
        return f"{self.player.name} a joue {self.match}"


class Rating(models.Model):
    score = models.IntegerField()
    comment = models.TextField(blank=True, default='')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='ratings')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='ratings')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rating'
        #autre facon de faire la contrainte unique, voir model User
        #pour l'autre facon 
        unique_together = ('user', 'match')

    def __str__(self):
        return f"{self.user.username} - {self.match} : {self.score}/10"


class Comment(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='comments')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comment'
        ordering = ('created_at',)

    def __str__(self):
        return f"{self.user} - {self.match} : {self.content[:40]}"


class CommentReaction(models.Model):
    LIKE = 'like'
    DISLIKE = 'dislike'

    REACTION_CHOICES = (
        (LIKE, 'Like'),
        (DISLIKE, 'Dislike'),
    )

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='comment_reactions')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='reactions')
    value = models.CharField(max_length=10, choices=REACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comment_reaction'
        unique_together = ('user', 'comment')

    def __str__(self):
        return f"{self.user} {self.value} {self.comment_id}"


class CommentReport(models.Model):
    PENDING = 'pending'
    REVIEWED = 'reviewed'
    DISMISSED = 'dismissed'

    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (REVIEWED, 'Reviewed'),
        (DISMISSED, 'Dismissed'),
    )

    comment = models.ForeignKey(Comment, null=True, blank=True, on_delete=models.CASCADE, related_name='reports')
    rating = models.ForeignKey(Rating, null=True, blank=True, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='comment_reports')
    reason = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_comment_reports',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'comment_report'
        constraints = [
            # un report doit concerner soit un commentaire, soit une note, mais pas les deux
            models.CheckConstraint(
                name='report_comment_or_rating',
                condition=(
                    Q(comment__isnull=False, rating__isnull=True)
                    | Q(comment__isnull=True, rating__isnull=False)
                ),
            ),
            models.UniqueConstraint(
                fields=['comment', 'reported_by'],
                name='unique_comment_report_by_user',
            ),
            models.UniqueConstraint(
                fields=['rating', 'reported_by'],
                name='unique_rating_report_by_user',
            ),
        ]
        ordering = ('-created_at',)

    def __str__(self):
        if self.comment_id:
            target = f"comment {self.comment_id}"
        else:
            target = f"rating {self.rating_id}"
        return f"Report {target} by {self.reported_by}"


class Vote(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='votes')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='votes')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='votes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vote'
        unique_together = ('user', 'match')

    def __str__(self):
        return f"{self.user.username} voted {self.player.name} for {self.match}"


class Pronostic(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='pronostics')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='pronostics')
    home_score = models.IntegerField()
    away_score = models.IntegerField()
    points = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pronostic'
        unique_together = ('user', 'match')

    def __str__(self):
        return f"{self.user.username} : {self.home_score}-{self.away_score} pour {self.match}"


class PronosticGroup(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='owned_pronostic_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pronostic_group'
        ordering = ('-created_at',)

    def __str__(self):
        return self.name


class PronosticGroupMember(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REFUSED = 'refused'
    LEFT = 'left'

    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
        (REFUSED, 'Refused'),
        (LEFT, 'Left'),
    )

    group = models.ForeignKey(PronosticGroup, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='pronostic_group_memberships')
    invited_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_pronostic_group_invites')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'pronostic_group_member'
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user} - {self.group} ({self.status})"
