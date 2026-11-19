from django.contrib import admin
from .models import Shop, ShopCategory, ShopType


class ShopTypeInline(admin.TabularInline):
    model = ShopType
    extra = 1


@admin.register(ShopCategory)
class ShopCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    inlines = [ShopTypeInline]


@admin.register(ShopType)
class ShopTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_active', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'category__name')


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'category', 'shop_type', 'location', 'approval_status', 'is_active')
    list_filter = ('approval_status', 'is_active', 'category', 'shop_type')
    search_fields = ('name', 'location', 'owner__username')
