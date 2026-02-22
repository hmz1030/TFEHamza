from django.db import models


class Team(models.Model):
    api_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
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
    home_score = models.IntegerField(default=0)
    away_score = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='scheduled')
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
