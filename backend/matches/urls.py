from django.urls import path
from .views import TeamListView, TeamDetailView, PlayerListView, MatchListView, MatchDetailView

urlpatterns = [
    path('teams/', TeamListView.as_view(), name='team-list'),
    path('teams/<int:pk>/', TeamDetailView.as_view(), name='team-detail'),
    path('players/', PlayerListView.as_view(), name='player-list'),
    path('matches/', MatchListView.as_view(), name='match-list'),
    path('matches/<int:pk>/', MatchDetailView.as_view(), name='match-detail'),
]