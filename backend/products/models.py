from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='products',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_reported = models.BooleanField(default=False)
    report_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=Q(stock_quantity__gte=0),
                name='product_stock_non_negative',
            ),
            models.CheckConstraint(
                condition=Q(price__gt=0),
                name='product_price_positive',
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:220]
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        if self.discount_price is not None and self.discount_price < self.price:
            return self.discount_price
        return self.price

    @property
    def discount_percent(self):
        if self.discount_price is not None and self.discount_price < self.price and self.price > 0:
            pct = ((self.price - self.discount_price) / self.price) * 100
            return int(round(pct))
        return 0

    @property
    def in_stock(self):
        return self.is_available and self.stock_quantity > 0

    @property
    def is_low_stock(self):
        return 0 < self.stock_quantity <= self.low_stock_threshold

    def __str__(self):
        return f'{self.name} - {self.shop.name}'
