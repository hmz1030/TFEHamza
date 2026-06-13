"""
URL configuration for matchnote project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from accounts.views import UserShareProfilView
from matches.views.comments import CommentShareImageView, CommentShareView
from matches.views.ratings import RatingShareImageView, RatingShareView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/', include('matches.urls')),
    path('share/comments/<int:comment_id>/', CommentShareView.as_view(), name='comment_share'),
    path('share/comments/<int:comment_id>/image/', CommentShareImageView.as_view(), name='comment_share_image'),
    path('share/profil/<int:user_id>/', UserShareProfilView.as_view(), name='profile-share'),
    path('share/ratings/<int:rating_id>/', RatingShareView.as_view(), name='rating_share'),
    path('share/ratings/<int:rating_id>/image/', RatingShareImageView.as_view(), name='rating_share_image'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
