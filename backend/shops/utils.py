from django.utils.text import slugify
from .models import Shop


def ensure_shop_for_user(user):
    """
    Ensures that a user with SHOP_OWNER role has a corresponding Shop instance.
    If none exists, auto-provisions one so the shop dashboard functions immediately.
    """
    if not user or not user.is_authenticated:
        return None

    shop = getattr(user, 'shop', None)
    if shop:
        return shop

    # Check database directly in case user.shop cache is stale
    existing = Shop.objects.filter(owner=user).first()
    if existing:
        return existing

    # Auto-provision shop for shop owners or staff
    role = getattr(user, 'role', None)
    if role != 'SHOP_OWNER' and not user.is_staff:
        return None

    shop_name = user.full_name or user.username.replace('_', ' ').title()
    if not any(shop_name.lower().endswith(suf) for suf in ['shop', 'store', 'canteen', 'mart', 'kiosk', 'center', 'studio']):
        shop_name = f"{shop_name}'s Campus Store"

    base_name = shop_name
    counter = 1
    while Shop.objects.filter(name__iexact=shop_name).exists():
        shop_name = f"{base_name} ({counter})"
        counter += 1

    slug = slugify(shop_name) or f"shop-{user.id}"
    base_slug = slug
    c = 1
    while Shop.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{c}"
        c += 1

    created_shop = Shop.objects.create(
        owner=user,
        name=shop_name,
        slug=slug,
        location=getattr(user, 'department', '') or 'Main University Campus',
        contact_number=getattr(user, 'phone', '') or '',
        contact_email=getattr(user, 'email', '') or '',
        approval_status=Shop.ApprovalStatus.APPROVED,
        is_active=True,
        description=f"Official campus store managed by {user.full_name or user.username}.",
    )
    return created_shop
