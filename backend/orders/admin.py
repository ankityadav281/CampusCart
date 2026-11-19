from django.contrib import admin
from .models import Order, OrderGroup, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(OrderGroup)
class OrderGroupAdmin(admin.ModelAdmin):
    list_display = ('group_code', 'customer', 'total_amount', 'created_at')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'shop', 'total_amount', 'order_status', 'payment_method', 'payment_status', 'created_at')
    list_filter = ('order_status', 'payment_method', 'payment_status', 'shop')
    inlines = [OrderItemInline]
