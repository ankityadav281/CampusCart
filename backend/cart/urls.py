from django.urls import path
from .views import CartAddItemView, CartClearView, CartItemDetailView, CartView

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartAddItemView.as_view(), name='cart-add-item'),
    path('cart/items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
    path('cart/clear/', CartClearView.as_view(), name='cart-clear'),
]
