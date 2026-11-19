from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """Allows access only to authenticated ADMIN users (or superusers)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role == 'ADMIN' or user.is_superuser)
        )


class IsShopOwnerRole(BasePermission):
    """Allows access only to authenticated SHOP_OWNER users."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'SHOP_OWNER')


class IsCustomerRole(BasePermission):
    """Allows access only to authenticated CUSTOMER users."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'CUSTOMER')


class IsShopOwnerOrAdmin(BasePermission):
    """Allows access to shop owners or administrators."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role in ('SHOP_OWNER', 'ADMIN') or user.is_superuser)
        )


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role == 'ADMIN' or user.is_superuser)
        )


def validate_image_file(file_obj, max_size_mb: int = 5):
    """Shared validator for uploaded images."""
    if not file_obj:
        return file_obj
    max_bytes = max_size_mb * 1024 * 1024
    if getattr(file_obj, 'size', 0) > max_bytes:
        from rest_framework.serializers import ValidationError
        raise ValidationError(f'Image file size must not exceed {max_size_mb} MB.')
    content_type = getattr(file_obj, 'content_type', '')
    valid_types = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
    if content_type and content_type not in valid_types:
        from rest_framework.serializers import ValidationError
        raise ValidationError('Unsupported image format. Allowed: JPEG, PNG, WEBP, GIF.')
    return file_obj
