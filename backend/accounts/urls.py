from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminUserDetailView,
    AdminUserListCreateView,
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    ProfileView,
    RegisterView,
    ResetPasswordView,
    ShopkeeperRegisterView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/register-shopkeeper/', ShopkeeperRegisterView.as_view(), name='auth-register-shopkeeper'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/profile/', ProfileView.as_view(), name='auth-profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    # Admin user management
    path('admin/users/', AdminUserListCreateView.as_view(), name='admin-users-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-users-detail'),
]
