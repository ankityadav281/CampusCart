from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class OrderGroup(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='order_groups',
    )
    group_code = models.CharField(max_length=32, unique=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.group_code:
            self.group_code = f'GRP-{self.created_at.strftime("%Y%m%d")}-{self.pk:04d}'
            OrderGroup.objects.filter(pk=self.pk).update(group_code=self.group_code)

    def __str__(self):
        return f'{self.group_code} ({self.customer.username})'


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'
        PREPARING = 'PREPARING', 'Preparing'
        READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Ready for Pickup'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        CASH_ON_PICKUP = 'CASH_ON_PICKUP', 'Cash on Pickup'
        UPI = 'UPI', 'UPI (Pay at Pickup / Gateway Ready)'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    VALID_TRANSITIONS = {
        OrderStatus.PENDING: {OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED},
        OrderStatus.ACCEPTED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
        OrderStatus.PREPARING: {OrderStatus.READY_FOR_PICKUP},
        OrderStatus.READY_FOR_PICKUP: {OrderStatus.COMPLETED},
        OrderStatus.REJECTED: set(),
        OrderStatus.COMPLETED: set(),
        OrderStatus.CANCELLED: set(),
    }

    SHOP_OWNER_TRANSITIONS = {
        OrderStatus.PENDING: {OrderStatus.ACCEPTED, OrderStatus.REJECTED},
        OrderStatus.ACCEPTED: {OrderStatus.PREPARING},
        OrderStatus.PREPARING: {OrderStatus.READY_FOR_PICKUP},
        OrderStatus.READY_FOR_PICKUP: {OrderStatus.COMPLETED},
        OrderStatus.REJECTED: set(),
        OrderStatus.COMPLETED: set(),
        OrderStatus.CANCELLED: set(),
    }

    CUSTOMER_CANCELLABLE_STATUSES = {OrderStatus.PENDING, OrderStatus.ACCEPTED}

    order_group = models.ForeignKey(
        OrderGroup,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    order_number = models.CharField(max_length=32, unique=True, blank=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='orders',
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    order_status = models.CharField(
        max_length=25,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )
    payment_method = models.CharField(
        max_length=25,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH_ON_PICKUP,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    pickup_time = models.CharField(max_length=120, help_text='Preferred pickup slot or time')
    customer_notes = models.TextField(blank=True)
    status_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.order_number:
            self.order_number = f'CC-{self.created_at.strftime("%Y%m%d")}-{self.pk:04d}'
            Order.objects.filter(pk=self.pk).update(order_number=self.order_number)

    @property
    def can_customer_cancel(self):
        return self.order_status in self.CUSTOMER_CANCELLABLE_STATUSES

    def __str__(self):
        return f'{self.order_number} ({self.shop.name} - {self.order_status})'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items',
    )
    product_name_snapshot = models.CharField(max_length=200)
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f'{self.product_name_snapshot} x {self.quantity}'
