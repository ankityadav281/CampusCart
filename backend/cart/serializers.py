from decimal import Decimal
from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image_url = serializers.SerializerMethodField()
    price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    discount_price = serializers.DecimalField(
        source='product.discount_price', max_digits=10, decimal_places=2, read_only=True
    )
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_quantity = serializers.IntegerField(source='product.stock_quantity', read_only=True)
    is_available = serializers.BooleanField(source='product.is_available', read_only=True)
    in_stock = serializers.BooleanField(source='product.in_stock', read_only=True)
    shop_id = serializers.IntegerField(source='product.shop.id', read_only=True)
    shop_name = serializers.CharField(source='product.shop.name', read_only=True)
    shop_location = serializers.CharField(source='product.shop.location', read_only=True)
    shop_opening_time = serializers.TimeField(source='product.shop.opening_time', read_only=True)
    shop_closing_time = serializers.TimeField(source='product.shop.closing_time', read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id',
            'product_id',
            'product_name',
            'product_image_url',
            'price',
            'discount_price',
            'unit_price',
            'quantity',
            'subtotal',
            'stock_quantity',
            'is_available',
            'in_stock',
            'shop_id',
            'shop_name',
            'shop_location',
            'shop_opening_time',
            'shop_closing_time',
        ]

    def get_product_image_url(self, obj):
        if not obj.product.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.product.image.url) if request else obj.product.image.url


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    shop_groups = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()
    shop_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'shop_groups', 'total_items', 'shop_count', 'grand_total', 'updated_at']

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_grand_total(self, obj):
        total = sum((item.subtotal for item in obj.items.all()), Decimal('0.00'))
        return str(total)

    def get_shop_count(self, obj):
        return len({item.product.shop_id for item in obj.items.all()})

    def get_shop_groups(self, obj):
        grouped = {}
        request = self.context.get('request')
        for item in obj.items.select_related('product__shop').all():
            shop = item.product.shop
            if shop.id not in grouped:
                grouped[shop.id] = {
                    'shop_id': shop.id,
                    'shop_name': shop.name,
                    'shop_location': shop.location,
                    'opening_time': shop.opening_time.strftime('%H:%M') if shop.opening_time else None,
                    'closing_time': shop.closing_time.strftime('%H:%M') if shop.closing_time else None,
                    'contact_number': shop.contact_number,
                    'items': [],
                    'subtotal': Decimal('0.00'),
                }
            grouped[shop.id]['items'].append(CartItemSerializer(item, context={'request': request}).data)
            grouped[shop.id]['subtotal'] += item.subtotal

        result = []
        for group in grouped.values():
            group['subtotal'] = str(group['subtotal'])
            result.append(group)
        return result
