from django.urls import path
from .views import TeamListView, TeamDetailView, PlayerListView, MatchListView, MatchDetailView, MatchPlayerListView, TodayMatchListView, DevSyncMatchesView, DevSyncPlayersView, DevSyncLiveScoresView, DevSyncLineupsView, RatingCreateView, RatingListView, VoteCreateView, VoteListView, PronosticCreateView, PronosticListView, LeaderboardView

urlpatterns = [
    path('teams/', TeamListView.as_view(), name='team-list'),
    path('teams/<int:pk>/', TeamDetailView.as_view(), name='team-detail'),
    path('players/', PlayerListView.as_view(), name='player-list'),
    path('matches/', MatchListView.as_view(), name='match-list'),
    path('matches/today/', TodayMatchListView.as_view(), name='match-today'),
    path('dev/sync-matches/', DevSyncMatchesView.as_view(), name='dev-sync-matches'),
    path('dev/sync-players/', DevSyncPlayersView.as_view(), name='dev-sync-players'),
    path('dev/sync-live-scores/', DevSyncLiveScoresView.as_view(), name='dev-sync-live-scores'),
    path('dev/sync-lineups/', DevSyncLineupsView.as_view(), name='dev-sync-lineups'),
    path('matches/<int:pk>/', MatchDetailView.as_view(), name='match-detail'),
    path('matches/<int:match_id>/players/', MatchPlayerListView.as_view(), name='match-players'),
    path('matches/<int:match_id>/pronostics/', PronosticListView.as_view(), name='pronostic-list'),
    path('matches/<int:match_id>/ratings/', RatingListView.as_view(), name='rating-list'),
    path('matches/<int:match_id>/votes/', VoteListView.as_view(), name='vote-list'),
    path('pronostics/leaderboard/', LeaderboardView.as_view(), name='pronostic-leaderboard'),
    path('ratings/', RatingCreateView.as_view(), name='rating-create'),
    path('votes/', VoteCreateView.as_view(), name='vote-create'),
    path('pronostics/', PronosticCreateView.as_view(), name='pronostic-create'),
]
