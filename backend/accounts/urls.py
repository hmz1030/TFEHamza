from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, ProfileUpdateView, UserListView, UserDetailView, UserActivityView, UserFavoriteClubListView, FollowView, UnfollowView, FavoriteClubCreateView, FavoriteClubDeleteView, FavoriteClubListView, MyActivityView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('me/profile/', ProfileUpdateView.as_view(), name='profile-update'),
    path('me/activity/', MyActivityView.as_view(), name='my-activity'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/activity/', UserActivityView.as_view(), name='user-activity'),
    path('users/<int:user_id>/favorites/', UserFavoriteClubListView.as_view(), name='user-favorites'),
    path('follow/', FollowView.as_view(), name='follow'),
    path('unfollow/<int:followee_id>/', UnfollowView.as_view(), name='unfollow'),
    path('favorites/', FavoriteClubListView.as_view(), name='favorite-list'),
    path('favorites/add/', FavoriteClubCreateView.as_view(), name='favorite-create'),
    path('favorites/<int:team_id>/', FavoriteClubDeleteView.as_view(), name='favorite-delete'),
]
#lien ci dessous si j'ai besoin de doc pour simple jwt 
#https://medium.com/django-unleashed/securing-django-rest-apis-with-jwt-authentication-using-simple-jwt-a-step-by-step-guide-28efa84666fe
