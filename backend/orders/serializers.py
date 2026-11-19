from rest_framework import serializers

from .models import Order, OrderGroup, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id', read_only=True, allow_null=True)
    product_image_url = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product_id',
            'product_name_snapshot',
            'price_snapshot',
            'quantity',
            'subtotal',
            'product_image_url',
        ]

    def get_product_image_url(self, obj):
        if not obj.product or not obj.product.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.product.image.url) if request else obj.product.image.url


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    order_group_code = serializers.CharField(source='order_group.group_code', read_only=True)
    shop_id = serializers.IntegerField(source='shop.id', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_location = serializers.CharField(source='shop.location', read_only=True)
    shop_contact = serializers.CharField(source='shop.contact_number', read_only=True)
    shop_opening_time = serializers.TimeField(source='shop.opening_time', read_only=True)
    shop_closing_time = serializers.TimeField(source='shop.closing_time', read_only=True)
    customer_id = serializers.IntegerField(source='customer.id', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_student_id = serializers.CharField(source='customer.student_id', read_only=True)
    order_status_display = serializers.CharField(source='get_order_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    can_customer_cancel = serializers.BooleanField(read_only=True)
    allowed_shop_transitions = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'order_group',
            'order_group_code',
            'customer_id',
            'customer_name',
            'customer_username',
            'customer_email',
            'customer_phone',
            'customer_student_id',
            'shop_id',
            'shop_name',
            'shop_location',
            'shop_contact',
            'shop_opening_time',
            'shop_closing_time',
            'total_amount',
            'order_status',
            'order_status_display',
            'payment_method',
            'payment_method_display',
            'payment_status',
            'payment_status_display',
            'pickup_time',
            'customer_notes',
            'status_note',
            'can_customer_cancel',
            'allowed_shop_transitions',
            'items',
            'created_at',
            'updated_at',
        ]

    def get_allowed_shop_transitions(self, obj):
        return sorted(Order.SHOP_OWNER_TRANSITIONS.get(obj.order_status, set()))


class OrderGroupSerializer(serializers.ModelSerializer):
    orders = OrderSerializer(many=True, read_only=True)
    shop_count = serializers.SerializerMethodField()

    class Meta:
        model = OrderGroup
        fields = ['id', 'group_code', 'total_amount', 'notes', 'shop_count', 'orders', 'created_at']

    def get_shop_count(self, obj):
        return obj.orders.count()


class CheckoutSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        default=Order.PaymentMethod.CASH_ON_PICKUP,
    )
    pickup_time = serializers.CharField(max_length=120, required=False, allow_blank=True)
    shop_pickup_times = serializers.DictField(
        child=serializers.CharField(max_length=120),
        required=False,
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        pickup_time = (attrs.get('pickup_time') or '').strip()
        shop_pickup_times = attrs.get('shop_pickup_times') or {}
        if not pickup_time and not shop_pickup_times:
            raise serializers.ValidationError({'pickup_time': 'Please select a preferred pickup slot.'})
        return attrs
