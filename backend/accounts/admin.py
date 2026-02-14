from django.contrib import admin
from .models import User
from .models import Badge

admin.site.register(User)
admin.site.register(Badge)
