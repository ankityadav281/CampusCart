import secrets
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer (Student / Staff)'
        SHOP_OWNER = 'SHOP_OWNER', 'Shop Owner / Manager'
        ADMIN = 'ADMIN', 'Administrator'

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    student_id = models.CharField(max_length=50, blank=True, help_text='University ID / Roll Number')
    department = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.is_superuser and self.role != self.Role.ADMIN:
            self.role = self.Role.ADMIN
        if not self.full_name:
            combined = f'{self.first_name} {self.last_name}'.strip()
            self.full_name = combined or self.username
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.username} ({self.role})'


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    @classmethod
    def create_for_user(cls, user):
        token_value = secrets.token_hex(4).upper()  # 8-char readable code
        return cls.objects.create(
            user=user,
            token=token_value,
            expires_at=timezone.now() + timedelta(minutes=30),
        )

    @property
    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
