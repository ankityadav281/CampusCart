from django.urls import path

from .views import (
    AdminCategoryDetailView,
    AdminCategoryListCreateView,
    AdminProductDetailView,
    AdminProductListView,
    CategoryListView,
    PublicProductDetailView,
    PublicProductListView,
    ReportProductView,
    ShopProductDetailView,
    ShopProductListCreateView,
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', PublicProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', PublicProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/report/', ReportProductView.as_view(), name='product-report'),
    # Shop owner product management
    path('shop/products/', ShopProductListCreateView.as_view(), name='shop-product-list'),
    path('shop/products/<int:pk>/', ShopProductDetailView.as_view(), name='shop-product-detail'),
    # Admin category & product management
    path('admin/categories/', AdminCategoryListCreateView.as_view(), name='admin-category-list'),
    path('admin/categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),
    path('admin/products/', AdminProductListView.as_view(), name='admin-product-list'),
    path('admin/products/<int:pk>/', AdminProductDetailView.as_view(), name='admin-product-detail'),
]
