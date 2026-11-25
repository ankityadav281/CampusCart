from datetime import time, timedelta
from decimal import Decimal
from io import BytesIO
import textwrap

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from accounts.models import User
from notifications.models import Notification
from orders.models import Order, OrderGroup, OrderItem
from products.models import Category, Product
from reviews.models import Review
from shops.models import Shop, ShopCategory, ShopType
from django.core.management import call_command


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


def _gradient_image(width: int, height: int, c1: tuple, c2: tuple) -> Image.Image:
    img = Image.new('RGB', (width, height), c1)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return img


def _make_product_image(title: str, subtitle: str, tag: str, palette: tuple) -> ContentFile:
    c1, c2, accent = palette
    img = _gradient_image(640, 480, c1, c2)
    draw = ImageDraw.Draw(img, 'RGBA')

    # Soft decorative circles
    draw.ellipse((420, -80, 720, 220), fill=(255, 255, 255, 32))
    draw.ellipse((-90, 290, 220, 600), fill=(255, 255, 255, 24))
    draw.rounded_rectangle((36, 36, 604, 444), radius=28, outline=(255, 255, 255, 55), width=2)

    # Category pill
    font_tag = _load_font(20, bold=True)
    pill_w = min(max(len(tag) * 13 + 40, 120), 340)
    draw.rounded_rectangle((62, 62, 62 + pill_w, 102), radius=20, fill=(255, 255, 255, 230))
    draw.text((82, 71), tag.upper(), fill=accent, font=font_tag)

    # Center card icon badge
    draw.rounded_rectangle((62, 134, 152, 224), radius=22, fill=(255, 255, 255, 45))
    initials = ''.join([w[0] for w in title.split()[:2]]).upper()
    font_init = _load_font(40, bold=True)
    draw.text((82, 154), initials, fill=(255, 255, 255, 255), font=font_init)

    # Product Title (wrapped)
    font_title = _load_font(36, bold=True)
    lines = textwrap.wrap(title, width=22)[:3]
    y = 250
    for line in lines:
        draw.text((62, y), line, fill=(255, 255, 255, 255), font=font_title)
        y += 44

    # Subtitle (shop name)
    font_sub = _load_font(22, bold=False)
    draw.text((62, 392), subtitle, fill=(235, 240, 255, 230), font=font_sub)

    buf = BytesIO()
    img.save(buf, format='PNG', optimize=True)
    safe_name = ''.join(ch if ch.isalnum() else '_' for ch in title.lower())[:40]
    return ContentFile(buf.getvalue(), name=f'{safe_name}.png')


def _make_shop_logo(name: str, palette: tuple) -> ContentFile:
    c1, c2, _ = palette
    img = _gradient_image(300, 300, c1, c2)
    draw = ImageDraw.Draw(img, 'RGBA')
    draw.ellipse((24, 24, 276, 276), outline=(255, 255, 255, 80), width=4)
    initials = ''.join(w[0] for w in name.split()[:2]).upper()
    font_lg = _load_font(96, bold=True)
    bbox = draw.textbbox((0, 0), initials, font=font_lg)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((300 - tw) / 2, (300 - th) / 2 - 12), initials, fill=(255, 255, 255, 255), font=font_lg)

    buf = BytesIO()
    img.save(buf, format='PNG', optimize=True)
    safe = ''.join(ch if ch.isalnum() else '_' for ch in name.lower())[:30]
    return ContentFile(buf.getvalue(), name=f'logo_{safe}.png')


def _make_shop_banner(name: str, location: str, palette: tuple) -> ContentFile:
    c1, c2, _ = palette
    img = _gradient_image(1200, 400, c1, c2)
    draw = ImageDraw.Draw(img, 'RGBA')
    draw.ellipse((860, -120, 1280, 300), fill=(255, 255, 255, 30))
    draw.ellipse((-120, 160, 280, 560), fill=(255, 255, 255, 24))
    font_title = _load_font(54, bold=True)
    font_sub = _load_font(28, bold=False)
    draw.text((72, 130), name, fill=(255, 255, 255, 255), font=font_title)
    draw.text((72, 210), f'Campus Location: {location}', fill=(235, 242, 255, 235), font=font_sub)

    buf = BytesIO()
    img.save(buf, format='PNG', optimize=True)
    safe = ''.join(ch if ch.isalnum() else '_' for ch in name.lower())[:30]
    return ContentFile(buf.getvalue(), name=f'banner_{safe}.png')


PALETTES = {
    'Stationery & Books': ((49, 46, 129), (79, 70, 229), (67, 56, 202)),
    'Food & Canteen': ((194, 65, 12), (249, 115, 22), (194, 65, 12)),
    'Groceries & Daily Needs': ((6, 95, 70), (16, 185, 129), (4, 120, 87)),
    'Electronics & Accessories': ((15, 23, 42), (37, 99, 235), (29, 78, 216)),
    'Printing & Services': ((30, 58, 138), (14, 165, 233), (3, 105, 161)),
    'Bakery & Cafes': ((157, 23, 77), (244, 63, 94), (190, 18, 60)),
    'Apparel & Merchandise': ((88, 28, 135), (147, 51, 234), (107, 33, 168)),
    'Sports & Fitness': ((17, 94, 89), (20, 184, 166), (15, 118, 110)),
}


class Command(BaseCommand):
    help = 'Seeds CampusCart with realistic university shops, products, accounts, orders, and reviews.'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Clear existing demo data before seeding.')
        parser.add_argument('--demo-shops', action='store_true', help='Seed dummy demo shops and sample products/orders.')

    def handle(self, *args, **options):
        if options.get('reset'):
            self.stdout.write('Clearing existing records...')
            OrderGroup.objects.all().delete()
            Review.objects.all().delete()
            Notification.objects.all().delete()
            Product.objects.all().delete()
            Shop.objects.all().delete()
            ShopType.objects.all().delete()
            ShopCategory.objects.all().delete()
            Category.objects.all().delete()
            User.objects.all().delete()

        # 1. Create Admin & Customer demo accounts
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@campuscart.edu',
                'full_name': 'Dr. Rajesh Verma (Campus Admin)',
                'phone': '+91 98765 00001',
                'student_id': 'ADMIN-001',
                'department': 'University Administration',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin_user.set_password('admin123')
        admin_user.save()

        student1, _ = User.objects.get_or_create(
            username='student1',
            defaults={
                'email': 'aarav.sharma@campuscart.edu',
                'full_name': 'Aarav Sharma',
                'phone': '+91 98765 11101',
                'student_id': 'CS2024018',
                'department': 'Computer Science & Engineering',
                'role': User.Role.CUSTOMER,
            },
        )
        student1.set_password('student123')
        student1.save()

        student2, _ = User.objects.get_or_create(
            username='student2',
            defaults={
                'email': 'priya.patel@campuscart.edu',
                'full_name': 'Priya Patel',
                'phone': '+91 98765 11102',
                'student_id': 'EC2024042',
                'department': 'Electronics & Communication',
                'role': User.Role.CUSTOMER,
            },
        )
        student2.set_password('student123')
        student2.save()

        # 2. Categories
        category_specs = [
            ('Stationery & Books', 'Notebooks, pens, lab manuals, drafting kits, and academic supplies.'),
            ('Food & Canteen', 'Fresh hot meals, snacks, sandwiches, and campus canteen beverages.'),
            ('Groceries & Daily Needs', 'Hostel essentials, instant noodles, toiletries, and packaged snacks.'),
            ('Electronics & Accessories', 'Earphones, calculators, USB drives, chargers, and laptop accessories.'),
            ('Printing & Services', 'Photocopying, spiral binding, project report printing, and lamination.'),
            ('Bakery & Cafes', 'Fresh puffs, muffins, pastries, cold coffee, and campus bakery treats.'),
            ('Apparel & Merchandise', 'Official university hoodies, lab coats, t-shirts, and tote bags.'),
            ('Sports & Fitness', 'Badminton racquets, shuttlecocks, yoga mats, and campus sports gear.'),
        ]
        categories = {}
        for name, desc in category_specs:
            cat, _ = Category.objects.get_or_create(name=name, defaults={'description': desc})
            categories[name] = cat

        # 2.5 Seed ShopCategories and ShopTypes
        call_command('seed_shop_categories')

        # If --demo-shops is not explicitly provided, skip dummy demo shops
        if not options.get('demo_shops'):
            self.stdout.write(
                self.style.SUCCESS(
                    'CampusCart database initialized with admin account, categories, shop categories, and types. '
                    'Demo dummy shops skipped (use --demo-shops if dummy shops are desired).'
                )
            )
            return

        # 3. Shops + Owners + Products
        shops_data = [
            {
                'owner_username': 'owner_stationery',
                'owner_name': 'Ramesh Gupta',
                'owner_email': 'stationery@campuscart.edu',
                'name': 'University Stationery Shop',
                'category': 'Stationery & Books',
                'location': 'Academic Block A, Ground Floor',
                'opening_time': time(8, 30),
                'closing_time': time(20, 0),
                'contact_number': '+91 98765 20001',
                'description': 'Your one-stop campus destination for engineering notebooks, scientific calculators, lab records, art supplies, and exam stationery.',
                'approval_status': Shop.ApprovalStatus.APPROVED,
                'products': [
                    ('Classmate Spiral Notebook (300 Pages)', 120, 100, 45, True, 'Premium ruled spiral notebook ideal for semester lecture notes.'),
                    ('Casio FX-991CW Scientific Calculator', 1495, 1349, 14, True, 'University exam approved scientific calculator with 540+ functions.'),
                    ('Engineering Drawing Instrument Box', 380, 320, 18, False, 'Complete precision compass, divider, and set-square geometry kit.'),
                    ('Pilot V7 Hi-Tecpoint Pen Pack (Set of 4)', 240, None, 32, False, 'Smooth liquid ink rollerball pens in blue and black.'),
                    ('A4 Practical Lab Record Book (Hardbound)', 95, 80, 4, False, 'Sturdy university-format practical record with graph and ruled pages.'),
                    ('Highlighter & Sticky Notes Study Combo', 165, 140, 25, False, '5 pastel highlighters plus 400 neon sticky tabs for exam revision.'),
                    ('A3 Sketching & Drafting Pad (40 Sheets)', 210, None, 0, False, 'Heavyweight 160 GSM cartridge sheets for architecture and design studios.'),
                ],
            },
            {
                'owner_username': 'owner_canteen',
                'owner_name': 'Suresh Nair',
                'owner_email': 'canteen@campuscart.edu',
                'name': 'Campus Canteen',
                'category': 'Food & Canteen',
                'location': 'Central Student Food Court',
                'opening_time': time(7, 30),
                'closing_time': time(21, 30),
                'contact_number': '+91 98765 20002',
                'description': 'Hot, hygienic, student-friendly meals, crispy burgers, masala dosa, samosas, and refreshing beverages served all day.',
                'approval_status': Shop.ApprovalStatus.APPROVED,
                'products': [
                    ('Crispy Veg Cheese Burger', 95, 80, 40, True, 'Toasted brioche bun with spiced vegetable patty, cheddar slice, and mint mayo.'),
                    ('Paneer Tikka Grilled Sandwich', 110, 95, 30, True, 'Char-grilled cottage cheese cubes stuffed in butter-toasted jumbo bread.'),
                    ('South Indian Masala Dosa', 75, None, 35, False, 'Golden crisp dosa filled with spiced potato masala, served with sambar and coconut chutney.'),
                    ('Veg Hakka Noodles Bowl', 120, 105, 22, False, 'Wok-tossed noodles with crunchy bell peppers, cabbage, and soy-chilli glaze.'),
                    ('Chole Bhature Student Thali', 130, None, 18, False, 'Two fluffy bhature with Punjabi chole, pickled onions, and green chutney.'),
                    ('Cold Coffee with Vanilla Ice Cream', 85, 70, 28, True, 'Rich blended iced coffee topped with creamy vanilla scoop and cocoa dust.'),
                    ('Masala Chai & 2 Samosa Combo', 55, 45, 50, False, 'Piping hot ginger cardamom tea paired with two crispy potato samosas.'),
                ],
            },
            {
                'owner_username': 'owner_grocery',
                'owner_name': 'Meena Joshi',
                'owner_email': 'grocery@campuscart.edu',
                'name': 'University Grocery Store',
                'category': 'Groceries & Daily Needs',
                'location': 'Hostel Complex Market, Shop 2',
                'opening_time': time(8, 0),
                'closing_time': time(22, 30),
                'contact_number': '+91 98765 20003',
                'description': 'Everyday hostel essentials, midnight study snacks, dairy, beverages, personal care, and laundry supplies.',
                'approval_status': Shop.ApprovalStatus.APPROVED,
                'products': [
                    ('Maggi 2-Minute Masala Noodles (Pack of 6)', 90, 82, 60, True, 'Classic hostel midnight staple — 6-pack value bundle.'),
                    ('Nescafe Classic Instant Coffee Jar (100g)', 340, 310, 20, False, '100% pure roasted coffee beans for late-night assignment sprints.'),
                    ('Amul Taaza Toned Milk Tetra Pack (1L)', 74, None, 35, False, 'UHT-treated fresh milk requiring no refrigeration before opening.'),
                    ('Peanut Butter Creamy Protein Jar (500g)', 260, 225, 16, True, 'High-protein unsweetened roasted peanut butter for quick hostel breakfasts.'),
                    ('Dettol Liquid Handwash & Sanitizer Combo', 195, 169, 24, False, 'Everyday hygiene pack for dorm rooms and backpacks.'),
                    ('Quaker Rolled Oats Hostel Pack (1kg)', 210, 185, 3, False, 'Wholegrain quick-cooking oats rich in dietary fiber.'),
                    ('Lay’s & Kurkure Study Night Snack Box', 140, 120, 30, False, 'Assorted pack of 6 crispy chips and namkeen pouches.'),
                ],
            },
            {
                'owner_username': 'owner_electronics',
                'owner_name': 'Vikram Malhotra',
                'owner_email': 'electronics@campuscart.edu',
                'name': 'Campus Electronics Shop',
                'category': 'Electronics & Accessories',
                'location': 'Innovation Hub, Shop 4',
                'opening_time': time(9, 30),
                'closing_time': time(20, 30),
                'contact_number': '+91 98765 20004',
                'description': 'Verified tech accessories, earphones, USB-C hubs, wireless mice, flash drives, and Arduino/lab components for students.',
                'approval_status': Shop.ApprovalStatus.APPROVED,
                'products': [
                    ('boAt BassHeads Wired Earphones', 599, 499, 26, True, 'Tangle-free braided cable earphones with inline mic and rich bass.'),
                    ('Logitech M221 Silent Wireless Mouse', 895, 749, 15, True, 'Ultra-quiet optical mouse ideal for library and lecture hall use.'),
                    ('SanDisk Ultra Dual Drive 64GB USB-C', 699, 599, 22, False, 'High-speed dual USB-A and USB-C flash drive for laptops and phones.'),
                    ('65W GaN Fast USB-C Multi-Port Charger', 1899, 1599, 9, True, 'Compact fast charger for laptops, tablets, and smartphones.'),
                    ('Arduino Uno R3 Project Starter Kit', 1450, 1299, 4, False, 'Includes Uno board, breadboard, jumper wires, LEDs, and sensor modules.'),
                    ('6-in-1 Aluminum USB-C Laptop Hub', 1299, 1099, 12, False, '4K HDMI, 3x USB 3.0, SD card reader, and 100W PD pass-through.'),
                    ('15.6-inch Water-Resistant Laptop Sleeve', 549, 449, 19, False, 'Padded microfiber interior sleeve with front charger pocket.'),
                ],
            },
            {
                'owner_username': 'owner_printing',
                'owner_name': 'Anil Deshmukh',
                'owner_email': 'printing@campuscart.edu',
                'name': 'Printing and Photocopy Center',
                'category': 'Printing & Services',
                'location': 'Central Library Annex, Room 102',
                'opening_time': time(8, 0),
                'closing_time': time(21, 0),
                'contact_number': '+91 98765 20005',
                'description': 'Fast laser printing, thesis hard-binding, spiral binding, bulk photocopy bundles, and ID card lamination.',
                'approval_status': Shop.ApprovalStatus.APPROVED,
                'products': [
                    ('50-Page B&W Laser Print Bundle', 100, 85, 100, True, 'Crisp 75 GSM double-sided or single-sided assignment printing voucher.'),
                    ('20-Page Vivid Color Print Bundle', 180, 150, 80, False, 'High-resolution color printing for charts, diagrams, and posters.'),
                    ('Project Report Spiral Binding + Clear Cover', 60, 50, 120, True, 'Neat spiral binding with transparent front sheet and thick matte backing.'),
                    ('Final-Year Thesis Golden Embossed Hard Binding', 350, 299, 40, True, 'University-approved rexine hardcover binding with gold foil lettering.'),
                    ('A4 Glossy Poster Print (300 GSM)', 90, None, 60, False, 'Thick glossy prints for club events, hackathons, and technical presentations.'),
                    ('Document Lamination Pack (5 Sheets)', 100, 80, 75, False, 'Waterproof thermal pouch lamination for certificates and IDs.'),
                ],
            },
            {
                'owner_username': 'owner_bakery',
                'owner_name': 'Farah Khan',
                'owner_email': 'bakery@campuscart.edu',
                'name': 'University Bakery',
                'category': 'Bakery & Cafes',
                'location': 'Student Union Plaza, Kiosk 1',
                'opening_time': time(8, 0),
                'closing_time': time(21, 0),
                'contact_number': '+91 98765 20006',
                'description': 'Oven-fresh artisan puffs, Belgian chocolate brownies, birthday cakes, croissants, and freshly brewed espresso.',
                'approval_status': Shop.ApprovalStatus.APPROVED,
                'products': [
                    ('Belgian Dark Chocolate Fudge Brownie', 90, 75, 25, True, 'Warm gooey walnut-free dark chocolate brownie baked every morning.'),
                    ('Crispy Paneer & Corn Puff Pastry', 55, 45, 36, True, 'Flaky golden puff pastry filled with spiced paneer and sweet corn.'),
                    ('Double Chocolate Chip Muffin (Pack of 2)', 110, 95, 20, False, 'Soft bakery muffins loaded with dark and milk chocolate chunks.'),
                    ('Butter Garlic Breadsticks with Dip', 120, None, 18, False, 'Freshly baked herb-butter sticks served with cheesy jalapeño dip.'),
                    ('Half-Kg Dutch Truffle Celebration Cake', 550, 480, 3, False, 'Rich layered chocolate ganache cake for hostel birthdays and club milestones.'),
                    ('Iced Hazelnut Latte (350ml)', 135, 115, 30, False, 'Fresh espresso shot shaken with chilled milk and roasted hazelnut syrup.'),
                ],
            },
            {
                'owner_username': 'owner_clothing',
                'owner_name': 'Karan Kapoor',
                'owner_email': 'clothing@campuscart.edu',
                'name': 'Campus Clothing Store',
                'category': 'Apparel & Merchandise',
                'location': 'Sports Complex Arcade, Shop 7',
                'opening_time': time(10, 0),
                'closing_time': time(20, 0),
                'contact_number': '+91 98765 20007',
                'description': 'Official university hoodies, department t-shirts, engineering lab coats, sports jerseys, and canvas campus totes.',
                'approval_status': Shop.ApprovalStatus.APPROVED,
                'products': [
                    ('Official University Embroidered Hoodie (Navy)', 1199, 999, 24, True, '340 GSM super-combed cotton fleece hoodie with stitched campus crest.'),
                    ('White Cotton Chemistry & Workshop Lab Coat', 450, 399, 30, True, 'Breathable full-sleeve knee-length lab apron with 3 utility pockets.'),
                    ('Campus Classic Crew-Neck T-Shirt', 499, 399, 40, False, '100% ring-spun cotton unisex tee in Indigo, White, and Charcoal.'),
                    ('University Varsity Zip Jacket', 1499, 1299, 10, True, 'Athletic collegiate jacket with ribbed cuffs and inner pocket.'),
                    ('Heavy Canvas Campus Tote Bag', 299, 249, 28, False, 'Eco-friendly zippered tote spacious enough for a 15-inch laptop and books.'),
                    ('Dry-Fit Campus Sports Jersey', 599, None, 15, False, 'Moisture-wicking breathable jersey for inter-college tournaments.'),
                ],
            },
            {
                'owner_username': 'owner_sports',
                'owner_name': 'Devendra Singh',
                'owner_email': 'sports@campuscart.edu',
                'name': 'Campus Cycle & Sports Gear',
                'category': 'Sports & Fitness',
                'location': 'Sports Ground North Gate',
                'opening_time': time(7, 0),
                'closing_time': time(19, 30),
                'contact_number': '+91 98765 20008',
                'description': 'Badminton racquets, feather shuttlecocks, footballs, bicycle locks, and gym accessories. (Pending Admin Approval demo shop)',
                'approval_status': Shop.ApprovalStatus.PENDING,
                'products': [
                    ('Yonex Graphite Badminton Racquet', 1650, 1490, 12, False, 'Lightweight isometric head badminton racquet with full cover.'),
                    ('Nylon Shuttlecock Tube (Pack of 6)', 480, 420, 20, False, 'Durable medium-speed yellow nylon shuttles for indoor and outdoor courts.'),
                ],
            },
        ]

        created_products_by_shop = {}
        created_shops = {}

        for sdata in shops_data:
            owner, _ = User.objects.get_or_create(
                username=sdata['owner_username'],
                defaults={
                    'email': sdata['owner_email'],
                    'full_name': sdata['owner_name'],
                    'phone': sdata['contact_number'],
                    'role': User.Role.SHOP_OWNER,
                },
            )
            owner.set_password('shop123')
            owner.save()

            palette = PALETTES.get(sdata['category'], PALETTES['Stationery & Books'])
            shop_cat_map = {
                'University Stationery Shop': ('Stationery & Educational Supplies', 'Stationery Shop'),
                'Campus Canteen': ('Food & Beverages', 'Canteen'),
                'University Grocery Store': ('Grocery & Daily Essentials', 'Grocery Store'),
                'Campus Electronics Shop': ('Electronics & Technology', 'Electronics Shop'),
                'Printing and Photocopy Center': ('Stationery & Educational Supplies', 'Printing Shop'),
                'University Bakery': ('Food & Beverages', 'Bakery'),
                'Campus Clothing Store': ('Fashion & Lifestyle', 'Clothing Shop'),
                'Campus Cycle & Sports Gear': ('Sports & Fitness', 'Sports Equipment Shop'),
            }
            c_name, t_name = shop_cat_map.get(sdata['name'], ('Food & Beverages', 'Canteen'))
            cat_obj = ShopCategory.objects.filter(name=c_name).first()
            type_obj = ShopType.objects.filter(category=cat_obj, name=t_name).first() if cat_obj else None

            shop, shop_created = Shop.objects.get_or_create(
                owner=owner,
                defaults={
                    'name': sdata['name'],
                    'description': sdata['description'],
                    'category': cat_obj,
                    'shop_type': type_obj,
                    'location': sdata['location'],
                    'opening_time': sdata['opening_time'],
                    'closing_time': sdata['closing_time'],
                    'contact_number': sdata['contact_number'],
                    'contact_email': sdata['owner_email'],
                    'approval_status': sdata['approval_status'],
                    'is_active': True,
                },
            )
            if not shop_created and (shop.category != cat_obj or shop.shop_type != type_obj):
                shop.category = cat_obj
                shop.shop_type = type_obj
                shop.save(update_fields=['category', 'shop_type'])
            if not shop.logo:
                shop.logo.save(f'logo_{shop.slug}.png', _make_shop_logo(shop.name, palette), save=False)
            if not shop.banner:
                shop.banner.save(
                    f'banner_{shop.slug}.png',
                    _make_shop_banner(shop.name, shop.location, palette),
                    save=False,
                )
            shop.save()
            created_shops[shop.name] = shop

            cat = categories[sdata['category']]
            created_products_by_shop[shop.name] = []

            for p_name, price, discount_price, stock, featured, desc in sdata['products']:
                prod, _ = Product.objects.get_or_create(
                    shop=shop,
                    name=p_name,
                    defaults={
                        'category': cat,
                        'description': desc,
                        'price': Decimal(str(price)),
                        'discount_price': Decimal(str(discount_price)) if discount_price else None,
                        'stock_quantity': stock,
                        'low_stock_threshold': 5,
                        'is_available': True,
                        'is_featured': featured,
                    },
                )
                if not prod.image:
                    prod.image.save(
                        f'prod_{prod.pk}.png',
                        _make_product_image(p_name, shop.name, sdata['category'].split('&')[0].strip(), palette),
                        save=True,
                    )
                created_products_by_shop[shop.name].append(prod)

        # 4. Seed sample Reviews (if none exist yet)
        if Review.objects.count() == 0:
            sample_reviews = [
                (student1, 'University Stationery Shop', 0, 5, 'Super crisp pages and pickup took less than 2 minutes between classes!'),
                (student2, 'University Stationery Shop', 1, 5, 'Genuine Casio calculator at a better price than outside campus.'),
                (student1, 'Campus Canteen', 0, 4, 'Hot and crispy burger! Ordering ahead skips the lunch queue.'),
                (student2, 'Campus Canteen', 5, 5, 'Best cold coffee on campus, perfectly chilled for pickup.'),
                (student1, 'Campus Electronics Shop', 0, 4, 'Great sound quality for the price and super helpful shop staff.'),
                (student2, 'University Bakery', 0, 5, 'The warm fudge brownie is unbeatable. Always fresh!'),
                (student1, 'Campus Clothing Store', 0, 5, 'Thick fleece and clean embroidery. Fits true to size.'),
            ]
            for reviewer, shop_name, idx, rating, comment in sample_reviews:
                prods = created_products_by_shop.get(shop_name, [])
                if idx < len(prods):
                    Review.objects.get_or_create(
                        customer=reviewer,
                        product=prods[idx],
                        defaults={'rating': rating, 'comment': comment},
                    )

        # 5. Seed realistic Multi-Shop Sample Orders (if none exist yet)
        if OrderGroup.objects.count() == 0:
            now = timezone.now()

            # Group 1: Multi-shop completed checkout by student1 (Stationery + Canteen + Electronics)
            p_notebook = created_products_by_shop['University Stationery Shop'][0]
            p_burger = created_products_by_shop['Campus Canteen'][0]
            p_earphones = created_products_by_shop['Campus Electronics Shop'][0]

            g1 = OrderGroup.objects.create(
                customer=student1,
                total_amount=p_notebook.effective_price + p_burger.effective_price + p_earphones.effective_price,
                notes='Will pick up after 2 PM lab session.',
            )
            OrderGroup.objects.filter(pk=g1.pk).update(created_at=now - timedelta(days=2))

            for prod, qty, status_val, pay_status in [
                (p_notebook, 1, Order.OrderStatus.COMPLETED, Order.PaymentStatus.PAID),
                (p_burger, 1, Order.OrderStatus.COMPLETED, Order.PaymentStatus.PAID),
                (p_earphones, 1, Order.OrderStatus.READY_FOR_PICKUP, Order.PaymentStatus.PENDING),
            ]:
                sub = prod.effective_price * qty
                o = Order.objects.create(
                    order_group=g1,
                    customer=student1,
                    shop=prod.shop,
                    total_amount=sub,
                    order_status=status_val,
                    payment_method=Order.PaymentMethod.CASH_ON_PICKUP,
                    payment_status=pay_status,
                    pickup_time='Today, 02:00 PM - 04:00 PM',
                )
                Order.objects.filter(pk=o.pk).update(created_at=now - timedelta(days=2))
                OrderItem.objects.create(
                    order=o,
                    product=prod,
                    product_name_snapshot=prod.name,
                    price_snapshot=prod.effective_price,
                    quantity=qty,
                    subtotal=sub,
                )

            # Group 2: Active multi-shop order by student2 (Bakery + Printing + Grocery)
            p_brownie = created_products_by_shop['University Bakery'][0]
            p_print = created_products_by_shop['Printing and Photocopy Center'][0]
            p_maggi = created_products_by_shop['University Grocery Store'][0]

            g2 = OrderGroup.objects.create(
                customer=student2,
                total_amount=(p_brownie.effective_price * 2) + p_print.effective_price + p_maggi.effective_price,
                notes='Quick lunch break pickup.',
            )
            OrderGroup.objects.filter(pk=g2.pk).update(created_at=now - timedelta(hours=5))

            for prod, qty, status_val, pay_method in [
                (p_brownie, 2, Order.OrderStatus.PREPARING, Order.PaymentMethod.CASH_ON_PICKUP),
                (p_print, 1, Order.OrderStatus.ACCEPTED, Order.PaymentMethod.UPI),
                (p_maggi, 1, Order.OrderStatus.PENDING, Order.PaymentMethod.CASH_ON_PICKUP),
            ]:
                sub = prod.effective_price * qty
                o = Order.objects.create(
                    order_group=g2,
                    customer=student2,
                    shop=prod.shop,
                    total_amount=sub,
                    order_status=status_val,
                    payment_method=pay_method,
                    payment_status=Order.PaymentStatus.PENDING,
                    pickup_time='Today, 04:00 PM - 06:00 PM (After Class)',
                )
                Order.objects.filter(pk=o.pk).update(created_at=now - timedelta(hours=5))
                OrderItem.objects.create(
                    order=o,
                    product=prod,
                    product_name_snapshot=prod.name,
                    price_snapshot=prod.effective_price,
                    quantity=qty,
                    subtotal=sub,
                )

            # Group 3: Completed clothing + canteen order 4 days ago for analytics richness
            p_hoodie = created_products_by_shop['Campus Clothing Store'][0]
            p_coffee = created_products_by_shop['Campus Canteen'][5]
            g3 = OrderGroup.objects.create(
                customer=student2,
                total_amount=p_hoodie.effective_price + p_coffee.effective_price,
            )
            OrderGroup.objects.filter(pk=g3.pk).update(created_at=now - timedelta(days=4))
            for prod in (p_hoodie, p_coffee):
                o = Order.objects.create(
                    order_group=g3,
                    customer=student2,
                    shop=prod.shop,
                    total_amount=prod.effective_price,
                    order_status=Order.OrderStatus.COMPLETED,
                    payment_method=Order.PaymentMethod.CASH_ON_PICKUP,
                    payment_status=Order.PaymentStatus.PAID,
                    pickup_time='Today, 12:30 PM - 02:00 PM (Lunch Break)',
                )
                Order.objects.filter(pk=o.pk).update(created_at=now - timedelta(days=4))
                OrderItem.objects.create(
                    order=o,
                    product=prod,
                    product_name_snapshot=prod.name,
                    price_snapshot=prod.effective_price,
                    quantity=1,
                    subtotal=prod.effective_price,
                )

        # 6. Seed welcome notifications
        if Notification.objects.count() == 0:
            Notification.objects.create(
                user=student1,
                title='Order Ready for Pickup!',
                message='Your boAt BassHeads Wired Earphones order at Campus Electronics Shop is ready for pickup.',
            )
            Notification.objects.create(
                user=admin_user,
                title='Pending Shop Approval Request',
                message='"Campus Cycle & Sports Gear" is awaiting your review and approval.',
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'CampusCart demo data seeded successfully! '
                f'Users: {User.objects.count()}, Shops: {Shop.objects.count()}, '
                f'Categories: {Category.objects.count()}, Products: {Product.objects.count()}, '
                f'Orders: {Order.objects.count()}'
            )
        )
