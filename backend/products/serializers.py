from django.db.models import Avg
from rest_framework import serializers

from config.permissions import validate_image_file
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'product_count', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']

    def get_product_count(self, obj):
        if hasattr(obj, 'annotated_product_count'):
            return obj.annotated_product_count
        return obj.products.filter(
            is_available=True,
            shop__approval_status='APPROVED',
            shop__is_active=True,
        ).count()


class ProductSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_location = serializers.CharField(source='shop.location', read_only=True)
    shop_category = serializers.CharField(source='shop.category_name', read_only=True, default='')
    shop_type = serializers.CharField(source='shop.shop_type_name', read_only=True, default='')
    shop_opening_time = serializers.TimeField(source='shop.opening_time', read_only=True)
    shop_closing_time = serializers.TimeField(source='shop.closing_time', read_only=True)
    shop_is_open = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, default='Uncategorized')
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    order_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'shop',
            'shop_name',
            'shop_location',
            'shop_category',
            'shop_type',
            'shop_opening_time',
            'shop_closing_time',
            'shop_is_open',
            'category',
            'category_name',
            'name',
            'slug',
            'description',
            'price',
            'discount_price',
            'effective_price',
            'discount_percent',
            'image',
            'image_url',
            'stock_quantity',
            'low_stock_threshold',
            'is_available',
            'in_stock',
            'is_low_stock',
            'is_featured',
            'is_reported',
            'report_reason',
            'average_rating',
            'review_count',
            'order_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'shop', 'slug', 'created_at', 'updated_at']

    def validate_image(self, value):
        return validate_image_file(value)

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Stock quantity cannot be negative.')
        return value

    def validate(self, attrs):
        price = attrs.get('price', getattr(self.instance, 'price', None))
        discount_price = attrs.get('discount_price', getattr(self.instance, 'discount_price', None))
        if discount_price is not None and price is not None and discount_price >= price:
            raise serializers.ValidationError(
                {'discount_price': 'Discount price must be lower than the regular price.'}
            )
        return attrs

    def get_shop_is_open(self, obj):
        return obj.shop.is_open_now

    def get_average_rating(self, obj):
        if hasattr(obj, 'annotated_avg_rating'):
            val = obj.annotated_avg_rating
            return round(float(val), 1) if val is not None else 0.0
        avg = obj.reviews.aggregate(avg=Avg('rating')).get('avg')
        return round(float(avg), 1) if avg is not None else 0.0

    def get_review_count(self, obj):
        if hasattr(obj, 'annotated_review_count'):
            return obj.annotated_review_count
        return obj.reviews.count()

    def get_order_count(self, obj):
        if hasattr(obj, 'annotated_order_count'):
            return obj.annotated_order_count or 0
        return 0

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url
