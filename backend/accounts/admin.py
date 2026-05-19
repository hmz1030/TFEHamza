from django.contrib import admin
from .models import User, Badge, Follow, FavoriteClub

admin.site.register(User)
admin.site.register(Badge)
admin.site.register(Follow)
admin.site.register(FavoriteClub)
