from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from orders.models import Order, OrderGroup
from products.models import Category, Product
from shops.models import Shop, ShopCategory, ShopType


class CampusCartWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username='testadmin',
            email='testadmin@campus.edu',
            password='password123',
            full_name='Admin User',
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.owner1 = User.objects.create_user(
            username='owner1',
            email='owner1@campus.edu',
            password='password123',
            full_name='Stationery Owner',
            role=User.Role.SHOP_OWNER,
        )
        self.owner2 = User.objects.create_user(
            username='owner2',
            email='owner2@campus.edu',
            password='password123',
            full_name='Canteen Owner',
            role=User.Role.SHOP_OWNER,
        )
        self.owner3 = User.objects.create_user(
            username='owner3',
            email='owner3@campus.edu',
            password='password123',
            full_name='Pending Shop Owner',
            role=User.Role.SHOP_OWNER,
        )
        self.customer1 = User.objects.create_user(
            username='cust1',
            email='cust1@campus.edu',
            password='password123',
            full_name='Customer One',
            role=User.Role.CUSTOMER,
        )
        self.customer2 = User.objects.create_user(
            username='cust2',
            email='cust2@campus.edu',
            password='password123',
            full_name='Customer Two',
            role=User.Role.CUSTOMER,
        )

        self.cat_stat = Category.objects.create(name='Stationery')
        self.cat_food = Category.objects.create(name='Food')

        self.shop_cat_stat = ShopCategory.objects.create(name='Stationery & Educational Supplies', slug='stationery-supplies')
        self.shop_cat_food = ShopCategory.objects.create(name='Food & Beverages', slug='food-beverages')
        self.shop_cat_sports = ShopCategory.objects.create(name='Sports & Fitness', slug='sports-fitness')

        self.shop_type_stat = ShopType.objects.create(category=self.shop_cat_stat, name='Stationery Shop')
        self.shop_type_canteen = ShopType.objects.create(category=self.shop_cat_food, name='Canteen')
        self.shop_type_sports = ShopType.objects.create(category=self.shop_cat_sports, name='Sports Equipment Shop')

        self.shop1 = Shop.objects.create(
            owner=self.owner1,
            name='Stationery Hub',
            category=self.shop_cat_stat,
            shop_type=self.shop_type_stat,
            location='Block A',
            approval_status=Shop.ApprovalStatus.APPROVED,
            is_active=True,
        )
        self.shop2 = Shop.objects.create(
            owner=self.owner2,
            name='Central Canteen',
            category=self.shop_cat_food,
            shop_type=self.shop_type_canteen,
            location='Food Court',
            approval_status=Shop.ApprovalStatus.APPROVED,
            is_active=True,
        )
        self.pending_shop = Shop.objects.create(
            owner=self.owner3,
            name='New Sports Shop',
            category=self.shop_cat_sports,
            shop_type=self.shop_type_sports,
            location='Ground Gate',
            approval_status=Shop.ApprovalStatus.PENDING,
            is_active=True,
        )

        self.p1 = Product.objects.create(
            shop=self.shop1,
            category=self.cat_stat,
            name='Spiral Notebook',
            price=Decimal('120.00'),
            discount_price=Decimal('100.00'),
            stock_quantity=10,
            is_available=True,
        )
        self.p2 = Product.objects.create(
            shop=self.shop2,
            category=self.cat_food,
            name='Veg Burger',
            price=Decimal('80.00'),
            stock_quantity=5,
            is_available=True,
        )
        self.p_pending = Product.objects.create(
            shop=self.pending_shop,
            category=self.cat_stat,
            name='Hidden Pending Item',
            price=Decimal('250.00'),
            stock_quantity=8,
            is_available=True,
        )

    def _auth_header(self, username, password='password123'):
        res = self.client.post('/api/auth/login/', {'username': username, 'password': password}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        return {'HTTP_AUTHORIZATION': f'Bearer {res.data["access"]}'}

    def test_1_registration_and_login(self):
        res = self.client.post(
            '/api/auth/register/',
            {
                'username': 'newstudent',
                'email': 'newstudent@campus.edu',
                'password': 'StrongPassword123',
                'confirm_password': 'StrongPassword123',
                'full_name': 'New Student',
                'phone': '9999988888',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        self.assertIn('access', res.data)
        self.assertEqual(res.data['user']['role'], 'CUSTOMER')

        # Login by email
        login_res = self.client.post(
            '/api/auth/login/',
            {'username': 'newstudent@campus.edu', 'password': 'StrongPassword123'},
            format='json',
        )
        self.assertEqual(login_res.status_code, 200)
        self.assertIn('access', login_res.data)

    def test_2_public_shops_only_approved_and_search_filter(self):
        shops_res = self.client.get('/api/shops/')
        self.assertEqual(shops_res.status_code, 200)
        names = [s['name'] for s in shops_res.data]
        self.assertIn('Stationery Hub', names)
        self.assertIn('Central Canteen', names)
        self.assertNotIn('New Sports Shop', names)

        # Product search & filtering
        prod_res = self.client.get('/api/products/?search=Burger&min_price=50&max_price=90&available_only=true')
        self.assertEqual(prod_res.status_code, 200)
        self.assertEqual(len(prod_res.data), 1)
        self.assertEqual(prod_res.data[0]['name'], 'Veg Burger')

        # Pending shop products must NOT appear publicly
        all_prods = self.client.get('/api/products/')
        all_names = [p['name'] for p in all_prods.data]
        self.assertNotIn('Hidden Pending Item', all_names)

    def test_3_multi_shop_cart_checkout_and_inventory_deduction(self):
        headers = self._auth_header('cust1')

        # Stock validation: cannot add more than available
        over = self.client.post(
            '/api/cart/items/',
            {'product_id': self.p2.id, 'quantity': 99},
            format='json',
            **headers,
        )
        self.assertEqual(over.status_code, 400)

        # Add products from 2 different shops
        r1 = self.client.post('/api/cart/items/', {'product_id': self.p1.id, 'quantity': 2}, format='json', **headers)
        r2 = self.client.post('/api/cart/items/', {'product_id': self.p2.id, 'quantity': 3}, format='json', **headers)
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.data['shop_count'], 2)

        # Checkout -> must create 1 OrderGroup + 2 separate Shop Orders
        checkout = self.client.post(
            '/api/orders/checkout/',
            {
                'payment_method': 'UPI',
                'pickup_time': 'Today, 02:00 PM - 04:00 PM',
                'notes': 'Multi-shop test',
            },
            format='json',
            **headers,
        )
        self.assertEqual(checkout.status_code, 201, checkout.data)
        group = checkout.data['order_group']
        self.assertEqual(len(group['orders']), 2)
        # 2 * 100 (discounted) + 3 * 80 = 440
        self.assertEqual(Decimal(group['total_amount']), Decimal('440.00'))

        # Verify UPI payment is NOT faked as PAID
        for o in group['orders']:
            self.assertEqual(o['payment_method'], 'UPI')
            self.assertEqual(o['payment_status'], 'PENDING')

        # Verify stock deducted atomically
        self.p1.refresh_from_db()
        self.p2.refresh_from_db()
        self.assertEqual(self.p1.stock_quantity, 8)
        self.assertEqual(self.p2.stock_quantity, 2)

        # Cart must be cleared
        cart_res = self.client.get('/api/cart/', **headers)
        self.assertEqual(cart_res.data['total_items'], 0)

    def test_4_shop_owner_order_management_transitions_and_rbac(self):
        c1_headers = self._auth_header('cust1')
        self.client.post('/api/cart/items/', {'product_id': self.p1.id, 'quantity': 2}, format='json', **c1_headers)
        self.client.post('/api/cart/items/', {'product_id': self.p2.id, 'quantity': 1}, format='json', **c1_headers)
        checkout = self.client.post(
            '/api/orders/checkout/',
            {'payment_method': 'CASH_ON_PICKUP', 'pickup_time': 'Today, 04:00 PM - 06:00 PM'},
            format='json',
            **c1_headers,
        )
        orders = checkout.data['order_group']['orders']
        shop1_order = next(o for o in orders if o['shop_id'] == self.shop1.id)
        shop2_order = next(o for o in orders if o['shop_id'] == self.shop2.id)

        o1_headers = self._auth_header('owner1')
        o2_headers = self._auth_header('owner2')

        # Owner 1 sees ONLY shop1's order
        o1_orders = self.client.get('/api/shop/orders/', **o1_headers)
        self.assertEqual(len(o1_orders.data), 1)
        self.assertEqual(o1_orders.data[0]['id'], shop1_order['id'])

        # Owner 1 CANNOT update shop2's order (403)
        forbidden_order = self.client.patch(
            f'/api/shop/orders/{shop2_order["id"]}/status/',
            {'order_status': 'ACCEPTED'},
            format='json',
            **o1_headers,
        )
        self.assertEqual(forbidden_order.status_code, 403)

        # Owner 1 CANNOT edit shop2's product (404 due to queryset scoping)
        forbidden_prod = self.client.patch(
            f'/api/shop/products/{self.p2.id}/',
            {'price': '999.00'},
            format='json',
            **o1_headers,
        )
        self.assertIn(forbidden_prod.status_code, (403, 404))

        # Invalid transition: PENDING -> COMPLETED directly must fail
        invalid_trans = self.client.patch(
            f'/api/shop/orders/{shop1_order["id"]}/status/',
            {'order_status': 'COMPLETED'},
            format='json',
            **o1_headers,
        )
        self.assertEqual(invalid_trans.status_code, 400)

        # Valid lifecycle: PENDING -> ACCEPTED -> PREPARING -> READY_FOR_PICKUP -> COMPLETED
        for next_status in ('ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'):
            res = self.client.patch(
                f'/api/shop/orders/{shop1_order["id"]}/status/',
                {'order_status': next_status},
                format='json',
                **o1_headers,
            )
            self.assertEqual(res.status_code, 200, res.data)
            self.assertEqual(res.data['order_status'], next_status)

        # Cash on pickup completed -> payment_status becomes PAID
        final_order = Order.objects.get(pk=shop1_order['id'])
        self.assertEqual(final_order.payment_status, Order.PaymentStatus.PAID)

        # Owner 2 rejects shop2's order -> stock restored!
        self.p2.refresh_from_db()
        self.assertEqual(self.p2.stock_quantity, 4)
        rej = self.client.patch(
            f'/api/shop/orders/{shop2_order["id"]}/status/',
            {'order_status': 'REJECTED', 'status_note': 'Kitchen closed'},
            format='json',
            **o2_headers,
        )
        self.assertEqual(rej.status_code, 200)
        self.p2.refresh_from_db()
        self.assertEqual(self.p2.stock_quantity, 5)

    def test_5_customer_cancellation_restores_stock_and_prevents_cross_customer_cancel(self):
        c1_headers = self._auth_header('cust1')
        c2_headers = self._auth_header('cust2')

        self.client.post('/api/cart/items/', {'product_id': self.p1.id, 'quantity': 3}, format='json', **c1_headers)
        checkout = self.client.post(
            '/api/orders/checkout/',
            {'payment_method': 'CASH_ON_PICKUP', 'pickup_time': 'Today, 12:30 PM - 02:00 PM'},
            format='json',
            **c1_headers,
        )
        order_id = checkout.data['order_group']['orders'][0]['id']
        self.p1.refresh_from_db()
        self.assertEqual(self.p1.stock_quantity, 7)

        # Customer 2 cannot cancel Customer 1's order
        bad_cancel = self.client.post(f'/api/orders/{order_id}/cancel/', {}, format='json', **c2_headers)
        self.assertEqual(bad_cancel.status_code, 403)

        # Customer 1 cancels -> stock restored to 10
        ok_cancel = self.client.post(f'/api/orders/{order_id}/cancel/', {'reason': 'Changed mind'}, format='json', **c1_headers)
        self.assertEqual(ok_cancel.status_code, 200)
        self.assertEqual(ok_cancel.data['order_status'], 'CANCELLED')
        self.p1.refresh_from_db()
        self.assertEqual(self.p1.stock_quantity, 10)

    def test_6_admin_shop_approval_and_rbac(self):
        c1_headers = self._auth_header('cust1')
        admin_headers = self._auth_header('testadmin')

        # Customer cannot access admin dashboard
        denied = self.client.get('/api/admin/dashboard/', **c1_headers)
        self.assertEqual(denied.status_code, 403)

        # Admin approves pending shop
        approve = self.client.post(
            f'/api/admin/shops/{self.pending_shop.id}/status/',
            {'approval_status': 'APPROVED'},
            format='json',
            **admin_headers,
        )
        self.assertEqual(approve.status_code, 200)
        self.assertEqual(approve.data['approval_status'], 'APPROVED')

        # Now pending shop & its product appear publicly
        shops_res = self.client.get('/api/shops/')
        self.assertIn('New Sports Shop', [s['name'] for s in shops_res.data])
        prods_res = self.client.get('/api/products/')
        self.assertIn('Hidden Pending Item', [p['name'] for p in prods_res.data])

    def test_7_shop_categories_and_types_system(self):
        admin_headers = self._auth_header('testadmin')
        cust_headers = self._auth_header('cust1')

        # 1. List shop categories publicly
        cat_res = self.client.get('/api/shop-categories/')
        self.assertEqual(cat_res.status_code, 200)
        cat_names = [c['name'] for c in cat_res.data]
        self.assertIn('Stationery & Educational Supplies', cat_names)
        self.assertIn('Food & Beverages', cat_names)

        # 2. List shop types filtered by category
        type_res = self.client.get(f'/api/shop-types/?category={self.shop_cat_food.id}')
        self.assertEqual(type_res.status_code, 200)
        self.assertEqual(len(type_res.data), 1)
        self.assertEqual(type_res.data[0]['name'], 'Canteen')

        # 3. Filter shops by category and shop_type
        filtered_shops = self.client.get(f'/api/shops/?category={self.shop_cat_food.id}&shop_type={self.shop_type_canteen.id}')
        self.assertEqual(filtered_shops.status_code, 200)
        self.assertEqual(len(filtered_shops.data), 1)
        self.assertEqual(filtered_shops.data[0]['name'], 'Central Canteen')

        # 4. Non-admin cannot create category or shop type
        denied_cat = self.client.post('/api/shop-categories/', {'name': 'Unauthorized Cat'}, format='json', **cust_headers)
        self.assertEqual(denied_cat.status_code, 403)

        # 5. Admin can create new category and type
        new_cat = self.client.post('/api/shop-categories/', {'name': 'Campus Services & Utility', 'icon': 'Briefcase'}, format='json', **admin_headers)
        self.assertEqual(new_cat.status_code, 201)
        cat_id = new_cat.data['id']

        new_type = self.client.post('/api/shop-types/', {'category': cat_id, 'name': 'Key Duplication & Locks'}, format='json', **admin_headers)
        self.assertEqual(new_type.status_code, 201)

        # 6. Prevent accidental deletion of category with assigned shops
        del_attempt = self.client.delete(f'/api/shop-categories/{self.shop_cat_food.id}/', **admin_headers)
        self.assertEqual(del_attempt.status_code, 400)
        self.assertIn('Cannot delete category', del_attempt.data['detail'])

        # 7. Unassigned category can be safely deleted
        del_empty = self.client.delete(f'/api/shop-categories/{cat_id}/', **admin_headers)
        self.assertIn(del_empty.status_code, (200, 204))
