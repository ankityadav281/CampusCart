from io import BytesIO
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from PIL import Image, ImageDraw, ImageFont

from shops.models import Shop, ShopCategory, ShopType


def _load_font(size: int, bold: bool = False):
    candidates = [
        'C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',
        'C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _make_category_image(name: str, palette: tuple) -> ContentFile:
    c1, c2, _ = palette
    img = Image.new('RGB', (800, 480), c1)
    draw = ImageDraw.Draw(img, 'RGBA')
    for y in range(480):
        t = y / 479.0
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(0, y), (800, y)], fill=(r, g, b))

    # Decorative circles
    draw.ellipse((520, -60, 880, 300), fill=(255, 255, 255, 30))
    draw.ellipse((-80, 260, 260, 600), fill=(255, 255, 255, 25))
    draw.rounded_rectangle((32, 32, 768, 448), radius=24, outline=(255, 255, 255, 45), width=2)

    font_pill = _load_font(18, bold=True)
    draw.rounded_rectangle((60, 60, 250, 98), radius=19, fill=(255, 255, 255, 230))
    draw.text((76, 68), 'CAMPUS SECTOR', fill=c1, font=font_pill)

    font_title = _load_font(42, bold=True)
    draw.text((60, 220), name, fill=(255, 255, 255, 255), font=font_title)

    font_sub = _load_font(22, bold=False)
    draw.text((60, 280), 'University Verified Shops & Services', fill=(235, 242, 255, 235), font=font_sub)

    buf = BytesIO()
    img.save(buf, format='PNG', optimize=True)
    safe = slugify(name)[:30]
    return ContentFile(buf.getvalue(), name=f'cat_{safe}.png')


CATEGORIES_DATA = [
    {
        'name': 'Food & Beverages',
        'icon': 'UtensilsCrossed',
        'description': 'Campus canteens, student cafes, quick bites, baked goods, juices, and beverages.',
        'palette': ((194, 65, 12), (249, 115, 22), (194, 65, 12)),
        'types': [
            'Canteen',
            'Restaurant',
            'Fast Food Shop',
            'Coffee Shop',
            'Bakery',
            'Juice & Shake Shop',
            'Snacks Shop',
            'Ice Cream Shop',
            'Sweet Shop',
        ],
    },
    {
        'name': 'Stationery & Educational Supplies',
        'icon': 'BookOpen',
        'description': 'Engineering supplies, notebooks, textbooks, printing, photocopying, and academic materials.',
        'palette': ((49, 46, 129), (79, 70, 229), (67, 56, 202)),
        'types': [
            'Stationery Shop',
            'Bookstore',
            'Photocopy Shop',
            'Printing Shop',
            'Project Supplies Shop',
            'Engineering Supplies Shop',
            'Laboratory Supplies Shop',
            'Art & Craft Supplies Shop',
            'Exam Preparation Books Shop',
        ],
    },
    {
        'name': 'Electronics & Technology',
        'icon': 'Laptop',
        'description': 'Laptop accessories, mobile gadgets, calculators, chargers, electronics, and repair services.',
        'palette': ((15, 23, 42), (37, 99, 235), (29, 78, 216)),
        'types': [
            'Electronics Shop',
            'Mobile Accessories Shop',
            'Computer Accessories Shop',
            'Laptop Accessories Shop',
            'Gaming Accessories Shop',
            'Electronic Gadgets Shop',
            'Mobile & Laptop Repair Shop',
        ],
    },
    {
        'name': 'Fashion & Lifestyle',
        'icon': 'Shirt',
        'description': 'Official campus merchandise, apparel, backpacks, lab coats, and lifestyle accessories.',
        'palette': ((88, 28, 135), (147, 51, 234), (107, 33, 168)),
        'types': [
            'Clothing Shop',
            'University Merchandise Shop',
            'Footwear Shop',
            'Bags & Backpacks Shop',
            'Watches Shop',
            'Fashion Accessories Shop',
            'Cosmetics Shop',
            'Gift Shop',
        ],
    },
    {
        'name': 'Grocery & Daily Essentials',
        'icon': 'ShoppingBasket',
        'description': 'Hostel provisions, dairy, snacks, toiletries, fruits, and everyday campus necessities.',
        'palette': ((6, 95, 70), (16, 185, 129), (4, 120, 87)),
        'types': [
            'Grocery Store',
            'General Store',
            'Dairy Products Shop',
            'Fruits & Vegetables Shop',
            'Packaged Food Shop',
            'Household Essentials Shop',
            'Personal Care Store',
        ],
    },
    {
        'name': 'Beauty & Personal Care',
        'icon': 'Sparkles',
        'description': 'Personal care, skincare, haircare, cosmetics, and hygiene essentials for campus living.',
        'palette': ((157, 23, 77), (244, 63, 94), (190, 18, 60)),
        'types': [
            'Beauty Products Shop',
            'Cosmetics Store',
            'Skincare Products Shop',
            'Haircare Products Shop',
            'Personal Hygiene Store',
        ],
    },
    {
        'name': 'Sports & Fitness',
        'icon': 'Dumbbell',
        'description': 'Athletic gear, tournament jerseys, sports accessories, badminton sets, and gym fitness items.',
        'palette': ((17, 94, 89), (20, 184, 166), (15, 118, 110)),
        'types': [
            'Sports Equipment Shop',
            'Fitness Accessories Shop',
            'Sportswear Shop',
            'Gym Supplements Shop',
        ],
    },
    {
        'name': 'Other Campus Services',
        'icon': 'Briefcase',
        'description': 'Campus laundry, salon grooming, photography, floral gifts, tailoring, and utility services.',
        'palette': ((30, 58, 138), (14, 165, 233), (3, 105, 161)),
        'types': [
            'Laundry Service',
            'Salon',
            'Photography Shop',
            'Gift & Flower Shop',
            'Tailoring Service',
            'Other Campus Services',
        ],
    },
]

# Mapping existing seed shops to their new category and shop type
SHOP_CATEGORY_MAP = {
    'University Stationery Shop': ('Stationery & Educational Supplies', 'Stationery Shop'),
    'Campus Canteen': ('Food & Beverages', 'Canteen'),
    'University Grocery Store': ('Grocery & Daily Essentials', 'Grocery Store'),
    'Campus Electronics Shop': ('Electronics & Technology', 'Electronics Shop'),
    'Printing and Photocopy Center': ('Stationery & Educational Supplies', 'Printing Shop'),
    'University Bakery': ('Food & Beverages', 'Bakery'),
    'Campus Clothing Store': ('Fashion & Lifestyle', 'Clothing Shop'),
    'Campus Cycle & Sports Gear': ('Sports & Fitness', 'Sports Equipment Shop'),
}


class Command(BaseCommand):
    help = 'Seeds all 8 main ShopCategories and 58 ShopTypes and links existing shops.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding shop categories and shop types...')
        created_cats = 0
        created_types = 0

        type_lookup = {}

        for cdata in CATEGORIES_DATA:
            cat, created = ShopCategory.objects.get_or_create(
                name=cdata['name'],
                defaults={
                    'slug': slugify(cdata['name']),
                    'description': cdata['description'],
                    'icon': cdata['icon'],
                    'is_active': True,
                },
            )
            if created:
                created_cats += 1
            elif not cat.icon or cat.icon != cdata['icon']:
                cat.icon = cdata['icon']
                cat.description = cdata['description']
                cat.save()

            if not cat.image:
                cat.image.save(
                    f'cat_{cat.slug}.png',
                    _make_category_image(cat.name, cdata['palette']),
                    save=True,
                )

            for t_name in cdata['types']:
                st, t_created = ShopType.objects.get_or_create(
                    category=cat,
                    name=t_name,
                    defaults={
                        'slug': slugify(t_name),
                        'description': f'{t_name} services and products on campus.',
                        'is_active': True,
                    },
                )
                if t_created:
                    created_types += 1
                type_lookup[(cat.name, t_name)] = st

        # Link existing sample shops to their category and shop type
        linked_shops = 0
        for shop_name, (cat_name, t_name) in SHOP_CATEGORY_MAP.items():
            shop = Shop.objects.filter(name=shop_name).first()
            if shop:
                cat = ShopCategory.objects.filter(name=cat_name).first()
                st = type_lookup.get((cat_name, t_name)) or ShopType.objects.filter(category=cat, name=t_name).first()
                if cat and st:
                    shop.category = cat
                    shop.shop_type = st
                    shop.save(update_fields=['category', 'shop_type'])
                    linked_shops += 1

        # Fallback for any other shops
        food_cat = ShopCategory.objects.filter(name='Food & Beverages').first()
        bakery_type = ShopType.objects.filter(category=food_cat, name='Bakery').first() if food_cat else None
        canteen_type = ShopType.objects.filter(category=food_cat, name='Canteen').first() if food_cat else None

        for shop in Shop.objects.filter(category__name='General'):
            if 'bakery' in shop.name.lower() and food_cat and bakery_type:
                shop.category = food_cat
                shop.shop_type = bakery_type
                shop.save(update_fields=['category', 'shop_type'])
            elif food_cat and canteen_type:
                shop.category = food_cat
                shop.shop_type = canteen_type
                shop.save(update_fields=['category', 'shop_type'])

        gen = ShopCategory.objects.filter(name='General').first()
        if gen and gen.shops.count() == 0:
            gen.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated Shop Categories ({ShopCategory.objects.count()}) '
                f'and Shop Types ({ShopType.objects.count()})! '
                f'Linked {linked_shops} campus shops.'
            )
        )
