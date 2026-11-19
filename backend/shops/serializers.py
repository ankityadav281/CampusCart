from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from rest_framework import serializers

from config.permissions import validate_image_file
from .models import Shop, ShopCategory, ShopType

User = get_user_model()


class ShopTypeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    shop_count = serializers.SerializerMethodField()

    class Meta:
        model = ShopType
        fields = [
            'id',
            'category',
            'category_name',
            'category_slug',
            'name',
            'slug',
            'description',
            'is_active',
            'shop_count',
            'created_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def get_shop_count(self, obj):
        if hasattr(obj, 'annotated_shop_count'):
            return obj.annotated_shop_count
        return obj.shops.filter(approval_status=Shop.ApprovalStatus.APPROVED, is_active=True).count()


class ShopCategorySerializer(serializers.ModelSerializer):
    shop_count = serializers.SerializerMethodField()
    type_count = serializers.SerializerMethodField()
    shop_types = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ShopCategory
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'image',
            'image_url',
            'icon',
            'is_active',
            'shop_count',
            'type_count',
            'shop_types',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def validate_image(self, value):
        return validate_image_file(value)

    def get_shop_count(self, obj):
        if hasattr(obj, 'annotated_shop_count'):
            return obj.annotated_shop_count
        return obj.shops.filter(approval_status=Shop.ApprovalStatus.APPROVED, is_active=True).count()

    def get_type_count(self, obj):
        if hasattr(obj, 'annotated_type_count'):
            return obj.annotated_type_count
        return obj.shop_types.filter(is_active=True).count()

    def get_shop_types(self, obj):
        types = obj.shop_types.filter(is_active=True)
        return ShopTypeSerializer(types, many=True, context=self.context).data

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class ShopSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    category_slug = serializers.CharField(source='category.slug', read_only=True, default='')
    category_icon = serializers.CharField(source='category.icon', read_only=True, default='Store')
    shop_type_name = serializers.CharField(source='shop_type.name', read_only=True, default='')
    is_open_now = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            'id',
            'owner',
            'owner_username',
            'owner_name',
            'owner_email',
            'name',
            'slug',
            'description',
            'category',
            'category_name',
            'category_slug',
            'category_icon',
            'shop_type',
            'shop_type_name',
            'logo',
            'banner',
            'logo_url',
            'banner_url',
            'location',
            'opening_time',
            'closing_time',
            'contact_number',
            'contact_email',
            'approval_status',
            'is_active',
            'is_open_now',
            'product_count',
            'average_rating',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'slug', 'approval_status', 'created_at', 'updated_at']

    def validate_logo(self, value):
        return validate_image_file(value)

    def validate_banner(self, value):
        return validate_image_file(value)

    def validate(self, attrs):
        category = attrs.get('category', getattr(self.instance, 'category', None))
        shop_type = attrs.get('shop_type', getattr(self.instance, 'shop_type', None))
        if shop_type and category and shop_type.category_id != category.id:
            raise serializers.ValidationError({
                'shop_type': f'Shop type "{shop_type.name}" does not belong to category "{category.name}".'
            })
        return attrs

    def get_is_open_now(self, obj):
        return obj.is_open_now

    def get_product_count(self, obj):
        if hasattr(obj, 'annotated_product_count'):
            return obj.annotated_product_count
        return obj.products.filter(is_available=True).count()

    def get_average_rating(self, obj):
        avg = obj.products.aggregate(avg=Avg('reviews__rating')).get('avg')
        return round(float(avg), 1) if avg is not None else 0.0

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url

    def get_banner_url(self, obj):
        if not obj.banner:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.banner.url) if request else obj.banner.url


class ShopRegistrationSerializer(serializers.ModelSerializer):
    """Allows a user to apply to open a campus shop with dynamic category and type validation."""

    class Meta:
        model = Shop
        fields = [
            'name',
            'description',
            'category',
            'shop_type',
            'logo',
            'banner',
            'location',
            'opening_time',
            'closing_time',
            'contact_number',
            'contact_email',
        ]

    def validate_logo(self, value):
        return validate_image_file(value)

    def validate_banner(self, value):
        return validate_image_file(value)

    def validate(self, attrs):
        category = attrs.get('category')
        shop_type = attrs.get('shop_type')

        if not category:
            raise serializers.ValidationError({'category': 'Please select a main shop category.'})
        if not category.is_active:
            raise serializers.ValidationError({'category': 'This shop category is currently inactive.'})

        if not shop_type:
            raise serializers.ValidationError({'shop_type': 'Please select a shop type.'})
        if not shop_type.is_active:
            raise serializers.ValidationError({'shop_type': 'This shop type is currently inactive.'})

        if shop_type.category_id != category.id:
            raise serializers.ValidationError({
                'shop_type': f'Shop type "{shop_type.name}" does not belong to category "{category.name}".'
            })
        return attrs


class AdminShopSerializer(ShopSerializer):
    owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta(ShopSerializer.Meta):
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def validate_owner(self, value):
        qs = Shop.objects.filter(owner=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This user already owns a shop.')
        return value

    def create(self, validated_data):
        owner = validated_data['owner']
        if owner.role != User.Role.SHOP_OWNER and owner.role != User.Role.ADMIN:
            owner.role = User.Role.SHOP_OWNER
            owner.save(update_fields=['role'])
        return super().create(validated_data)
