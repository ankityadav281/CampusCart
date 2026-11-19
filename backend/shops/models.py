from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class ShopCategory(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=150, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='shop_categories/', blank=True, null=True)
    icon = models.CharField(max_length=60, blank=True, default='Store')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Shop Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or 'category'
            slug = base_slug
            counter = 1
            while ShopCategory.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ShopType(models.Model):
    category = models.ForeignKey(
        ShopCategory,
        on_delete=models.CASCADE,
        related_name='shop_types',
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category__name', 'name']
        unique_together = ('category', 'name')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.category.name})'


class Shop(models.Model):
    class ApprovalStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shop',
    )
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        ShopCategory,
        on_delete=models.PROTECT,
        related_name='shops',
        null=True,
        blank=True,
    )
    shop_type = models.ForeignKey(
        ShopType,
        on_delete=models.SET_NULL,
        related_name='shops',
        null=True,
        blank=True,
    )
    logo = models.ImageField(upload_to='shops/logos/', blank=True, null=True)
    banner = models.ImageField(upload_to='shops/banners/', blank=True, null=True)
    location = models.CharField(max_length=200, help_text='Location inside the university campus')
    opening_time = models.TimeField(blank=True, null=True)
    closing_time = models.TimeField(blank=True, null=True)
    contact_number = models.CharField(max_length=25, blank=True)
    contact_email = models.EmailField(blank=True)
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def clean(self):
        super().clean()
        if self.shop_type and self.category and self.shop_type.category_id != self.category_id:
            raise ValidationError(
                {'shop_type': 'The selected shop type does not belong to the selected shop category.'}
            )

    def save(self, *args, **kwargs):
        self.clean()
        if not self.slug:
            base_slug = slugify(self.name) or 'shop'
            slug = base_slug
            counter = 1
            while Shop.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def category_name(self):
        return self.category.name if self.category else ''

    @property
    def shop_type_name(self):
        return self.shop_type.name if self.shop_type else ''

    @property
    def is_open_now(self):
        if not self.is_active or self.approval_status != self.ApprovalStatus.APPROVED:
            return False
        if not self.opening_time or not self.closing_time:
            return None
        now_time = timezone.localtime().time()
        if self.opening_time <= self.closing_time:
            return self.opening_time <= now_time <= self.closing_time
        # Overnight hours (e.g. 20:00 to 02:00)
        return now_time >= self.opening_time or now_time <= self.closing_time

    def __str__(self):
        return f'{self.name} ({self.approval_status})'
