from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'category', 'price', 'discount_price', 'stock_quantity', 'is_available', 'is_reported')
    list_filter = ('shop', 'category', 'is_available', 'is_reported')
    search_fields = ('name', 'shop__name')
