from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    shop_name = serializers.CharField(source='product.shop.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'customer',
            'customer_name',
            'customer_username',
            'product',
            'product_name',
            'shop_name',
            'rating',
            'comment',
            'is_reported',
            'report_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'customer', 'product', 'created_at', 'updated_at']
