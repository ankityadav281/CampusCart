from django.urls import path

from .views import (
    AdminShopDetailView,
    AdminShopListCreateView,
    AdminShopStatusUpdateView,
    MyShopView,
    PublicShopDetailView,
    PublicShopListView,
    ShopCategoriesListView,
    ShopCategoryDetailView,
    ShopCategoryListView,
    ShopRegisterView,
    ShopTypeDetailView,
    ShopTypeListView,
)

urlpatterns = [
    # Shop Categories CRUD
    path('shop-categories/', ShopCategoryListView.as_view(), name='shop-category-list'),
    path('shop-categories/<int:pk>/', ShopCategoryDetailView.as_view(), name='shop-category-detail'),
    # Shop Types CRUD
    path('shop-types/', ShopTypeListView.as_view(), name='shop-type-list'),
    path('shop-types/<int:pk>/', ShopTypeDetailView.as_view(), name='shop-type-detail'),
    # Public Shops & Registration
    path('shops/', PublicShopListView.as_view(), name='shop-list'),
    path('shops/categories/', ShopCategoriesListView.as_view(), name='shop-categories'),
    path('shops/register/', ShopRegisterView.as_view(), name='shop-register'),
    path('shops/<int:pk>/', PublicShopDetailView.as_view(), name='shop-detail'),
    path('shop/my-shop/', MyShopView.as_view(), name='my-shop'),
    # Admin Shop Management
    path('admin/shops/', AdminShopListCreateView.as_view(), name='admin-shop-list'),
    path('admin/shops/<int:pk>/', AdminShopDetailView.as_view(), name='admin-shop-detail'),
    path('admin/shops/<int:pk>/status/', AdminShopStatusUpdateView.as_view(), name='admin-shop-status'),
]
