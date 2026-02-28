from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, FollowView, UnfollowView, FavoriteClubCreateView, FavoriteClubDeleteView, MyActivityView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('me/activity/', MyActivityView.as_view(), name='my-activity'),
    path('follow/', FollowView.as_view(), name='follow'),
    path('unfollow/<int:followee_id>/', UnfollowView.as_view(), name='unfollow'),
    path('favorites/', FavoriteClubCreateView.as_view(), name='favorite-create'),
    path('favorites/<int:team_id>/', FavoriteClubDeleteView.as_view(), name='favorite-delete'),
]
#lien ci dessous si j'ai besoin de doc pour simple jwt 
#https://medium.com/django-unleashed/securing-django-rest-apis-with-jwt-authentication-using-simple-jwt-a-step-by-step-guide-28efa84666fe