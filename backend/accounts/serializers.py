from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class UserSerializer(serializers.ModelSerializer):
    shop_id = serializers.SerializerMethodField()
    shop_name = serializers.SerializerMethodField()
    shop_approval_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'phone',
            'student_id',
            'department',
            'role',
            'is_active',
            'created_at',
            'shop_id',
            'shop_name',
            'shop_approval_status',
        ]
        read_only_fields = ['id', 'role', 'is_active', 'created_at']

    def get_shop_id(self, obj):
        shop = getattr(obj, 'shop', None)
        return shop.id if shop else None

    def get_shop_name(self, obj):
        shop = getattr(obj, 'shop', None)
        return shop.name if shop else None

    def get_shop_approval_status(self, obj):
        shop = getattr(obj, 'shop', None)
        return shop.approval_status if shop else None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'confirm_password',
            'full_name',
            'phone',
            'student_id',
            'department',
        ]

    def to_internal_value(self, data):
        if isinstance(data, dict) and 'username' in data:
            import re
            data = data.copy()
            cleaned = re.sub(r'\s+', '_', str(data.get('username', '')).strip())
            cleaned = re.sub(r'[^\w.@+-]', '', cleaned)
            data['username'] = cleaned.lower()
            if 'email' in data and data['email']:
                data['email'] = str(data['email']).strip().lower()
            if 'phone' in data and data['phone']:
                data['phone'] = str(data['phone']).strip()
        return super().to_internal_value(data)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate(self, attrs):
        confirm = attrs.pop('confirm_password', None)
        if confirm is not None and attrs['password'] != confirm:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data, role=User.Role.CUSTOMER)
        user.set_password(password)
        user.save()
        return user


class ShopkeeperRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=False)
    shop_name = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'confirm_password',
            'full_name',
            'phone',
            'department',
            'shop_name',
        ]

    def to_internal_value(self, data):
        if isinstance(data, dict):
            import re
            data = data.copy()
            shop_name = str(data.get('shop_name', '')).strip()
            username_input = str(data.get('username', '')).strip()

            # If username is empty but shop_name is provided, auto-follow shop_name without underscores
            if not username_input and shop_name:
                username_input = shop_name

            # Strip spaces, underscores, and invalid symbols -> lowercase alphanumeric username
            cleaned = re.sub(r'[\s_]+', '', username_input)
            cleaned = re.sub(r'[^\w.@+-]', '', cleaned).replace('_', '')
            data['username'] = cleaned.lower()

            if 'email' in data and data['email']:
                data['email'] = str(data['email']).strip().lower()
            if 'phone' in data and data['phone']:
                data['phone'] = str(data['phone']).strip()
            if shop_name:
                data['shop_name'] = shop_name
        return super().to_internal_value(data)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate(self, attrs):
        confirm = attrs.pop('confirm_password', None)
        if confirm is not None and attrs['password'] != confirm:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        raw_shop_name = validated_data.pop('shop_name', '').strip()
        full_name = validated_data.get('full_name', '')
        phone = validated_data.get('phone', '')
        email = validated_data.get('email', '')
        department = validated_data.get('department', '')
        username = validated_data.get('username', '')

        user = User(**validated_data, role=User.Role.SHOP_OWNER)
        user.set_password(password)
        user.save()

        # Provision the shop immediately so the shop owner dashboard is ready
        from shops.models import Shop
        shop_name = raw_shop_name or full_name or username.title()
        if not raw_shop_name and not any(shop_name.lower().endswith(suf) for suf in ['shop', 'store', 'canteen', 'mart', 'kiosk', 'center', 'studio']):
            shop_name = f"{shop_name}'s Campus Store"

        base_name = shop_name
        counter = 1
        while Shop.objects.filter(name__iexact=shop_name).exists():
            shop_name = f"{base_name} ({counter})"
            counter += 1

        Shop.objects.create(
            owner=user,
            name=shop_name,
            location=department or 'Main University Campus',
            contact_number=phone or '',
            contact_email=email or '',
            approval_status=Shop.ApprovalStatus.APPROVED,
            is_active=True,
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(help_text='Username or email address')
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs.get('username', '').strip()
        password = attrs.get('password', '')

        # Allow login with email or username
        lookup_username = identifier
        if '@' in identifier:
            try:
                user_obj = User.objects.get(email__iexact=identifier)
                lookup_username = user_obj.username
            except User.DoesNotExist:
                pass

        user = authenticate(username=lookup_username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid username/email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been suspended. Contact the administrator.')

        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'email', 'phone', 'student_id', 'department']

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Email is already in use by another account.')
        return value.lower()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context['request'].user)
        return value


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'full_name',
            'phone',
            'student_id',
            'department',
            'role',
            'is_active',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'phone',
            'student_id',
            'department',
            'role',
            'is_active',
            'password',
        ]
        read_only_fields = ['id', 'username']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
