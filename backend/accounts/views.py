from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from config.permissions import IsAdminRole
from .models import PasswordResetToken, User
from .serializers import (
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ShopkeeperRegisterSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'message': 'Registration successful.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ShopkeeperRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ShopkeeperRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'message': 'Shopkeeper account created successfully! You can now set up your campus shop.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password updated successfully.'})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'Please provide your email address.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        response_data = {
            'message': 'If an account exists with this email, a password reset code has been generated.',
        }
        if user:
            reset_obj = PasswordResetToken.create_for_user(user)
            if settings.DEBUG:
                # Exposed only in local DEBUG mode for academic demo convenience
                response_data['dev_reset_code'] = reset_obj.token
        return Response(response_data, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code = (request.data.get('code') or '').strip().upper()
        new_password = request.data.get('new_password') or ''

        if not email or not code or not new_password:
            return Response(
                {'detail': 'Email, reset code, and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reset_obj = (
            PasswordResetToken.objects.select_related('user')
            .filter(user__email__iexact=email, token=code, is_used=False)
            .order_by('-created_at')
            .first()
        )
        if not reset_obj or not reset_obj.is_valid:
            return Response(
                {'detail': 'Invalid or expired reset code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, reset_obj.user)
        except Exception as exc:
            return Response({'detail': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        reset_obj.user.set_password(new_password)
        reset_obj.user.save()
        reset_obj.is_used = True
        reset_obj.save(update_fields=['is_used'])
        return Response({'message': 'Password has been reset successfully. You can now sign in.'})


class AdminUserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminUserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = User.objects.all().select_related('shop')
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(full_name__icontains=search)
                | Q(student_id__icontains=search)
            )
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminUserUpdateSerializer
        return UserSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.pk == request.user.pk:
            return Response(
                {'detail': 'You cannot delete your own administrator account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)
