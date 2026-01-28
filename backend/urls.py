
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Include all API routes under /api/
    path('api/', include('api.urls')),
]
