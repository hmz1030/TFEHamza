from django.db import models


class Team(models.Model):
    name = models.CharField(max_length=100)
    league = models.CharField(max_length=100)

    class Meta:
        db_table = 'team'

    def __str__(self):
        return self.name


class Player(models.Model):
    name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players')

    class Meta:
        db_table = 'player'

    def __str__(self):
        return self.name


class Match(models.Model):
    date = models.DateTimeField()
    league = models.CharField(max_length=100)
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches')
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches')
    home_score = models.IntegerField(default=0)
    away_score = models.IntegerField(default=0)
    mvp = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='mvp_matches')

    class Meta:
        db_table = 'match'

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} - {self.date}"


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
