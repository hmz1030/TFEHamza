from django.urls import path
from .views import TeamListView, TeamDetailView, PlayerListView, MatchListView, MatchDetailView, TodayMatchListView, RatingCreateView, VoteCreateView, PronosticCreateView, PronosticListView

urlpatterns = [
    path('teams/', TeamListView.as_view(), name='team-list'),
    path('teams/<int:pk>/', TeamDetailView.as_view(), name='team-detail'),
    path('players/', PlayerListView.as_view(), name='player-list'),
    path('matches/', MatchListView.as_view(), name='match-list'),
    path('matches/today/', TodayMatchListView.as_view(), name='match-today'),
    path('matches/<int:pk>/', MatchDetailView.as_view(), name='match-detail'),
    path('matches/<int:match_id>/pronostics/', PronosticListView.as_view(), name='pronostic-list'),
    path('ratings/', RatingCreateView.as_view(), name='rating-create'),
    path('votes/', VoteCreateView.as_view(), name='vote-create'),
    path('pronostics/', PronosticCreateView.as_view(), name='pronostic-create'),
]