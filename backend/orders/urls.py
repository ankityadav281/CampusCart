from django.urls import path

from .views import (
    AdminDashboardStatsView,
    AdminOrderListView,
    AdminOrderStatusUpdateView,
    CheckoutView,
    CustomerCancelOrderView,
    CustomerOrderGroupListView,
    CustomerOrderListView,
    OrderDetailView,
    PickupSlotsView,
    ShopDashboardAnalyticsView,
    ShopOrderListView,
    ShopOrderStatusUpdateView,
)

urlpatterns = [
    path('orders/pickup-slots/', PickupSlotsView.as_view(), name='pickup-slots'),
    path('orders/checkout/', CheckoutView.as_view(), name='orders-checkout'),
    path('orders/my-orders/', CustomerOrderListView.as_view(), name='customer-orders'),
    path('orders/my-groups/', CustomerOrderGroupListView.as_view(), name='customer-order-groups'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/cancel/', CustomerCancelOrderView.as_view(), name='order-cancel'),
    # Shop owner order & dashboard endpoints
    path('shop/orders/', ShopOrderListView.as_view(), name='shop-orders'),
    path('shop/orders/<int:pk>/status/', ShopOrderStatusUpdateView.as_view(), name='shop-order-status'),
    path('shop/dashboard/', ShopDashboardAnalyticsView.as_view(), name='shop-dashboard'),
    # Admin order & dashboard endpoints
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-orders'),
    path('admin/orders/<int:pk>/status/', AdminOrderStatusUpdateView.as_view(), name='admin-order-status'),
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
]
