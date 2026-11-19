from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'customer', 'rating', 'is_reported', 'created_at')
    list_filter = ('rating', 'is_reported')
