from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from products.models import Product
from shops.models import Shop
from accounts.models import User


@api_view(['GET'])
@permission_classes([AllowAny])
def platform_summary(request):
    """Public marketplace stats for the Home Page hero banner."""
    return Response({
        'active_products': Product.objects.filter(
            is_available=True,
            shop__approval_status=Shop.ApprovalStatus.APPROVED,
            shop__is_active=True,
        ).count(),
        'approved_shops': Shop.objects.filter(
            approval_status=Shop.ApprovalStatus.APPROVED,
            is_active=True,
        ).count(),
        'campus_members': User.objects.filter(is_active=True).count(),
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/summary/', platform_summary, name='platform-summary'),
    path('api/', include('accounts.urls')),
    path('api/', include('shops.urls')),
    path('api/', include('products.urls')),
    path('api/', include('cart.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('notifications.urls')),
]

# Serve media files in both development and production (Render)
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
