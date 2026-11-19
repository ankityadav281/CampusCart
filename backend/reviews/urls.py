from django.urls import path

from .views import (
    AdminReviewDetailView,
    AdminReviewListView,
    ProductReviewListCreateView,
    ReportReviewView,
    ReviewDeleteView,
)

urlpatterns = [
    path('products/<int:product_id>/reviews/', ProductReviewListCreateView.as_view(), name='product-reviews'),
    path('reviews/<int:pk>/report/', ReportReviewView.as_view(), name='review-report'),
    path('reviews/<int:pk>/', ReviewDeleteView.as_view(), name='review-delete'),
    path('admin/reviews/', AdminReviewListView.as_view(), name='admin-reviews'),
    path('admin/reviews/<int:pk>/', AdminReviewDetailView.as_view(), name='admin-review-detail'),
]
