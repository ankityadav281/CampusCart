from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from config.permissions import IsAdminRole, IsShopOwnerRole
from notifications.models import Notification
from products.models import Product
from products.serializers import ProductSerializer
from reviews.models import Review
from shops.models import Shop
from shops.serializers import ShopSerializer
from shops.utils import ensure_shop_for_user
from .models import Order, OrderGroup, OrderItem
from .serializers import CheckoutSerializer, OrderGroupSerializer, OrderSerializer

User = get_user_model()


def _restore_order_inventory(order):
    """Atomically restore product stock when an order is cancelled or rejected."""
    items = list(order.items.select_related('product').all())
    product_ids = [item.product_id for item in items if item.product_id]
    if not product_ids:
        return
    locked_products = {
        p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
    }
    for item in items:
        prod = locked_products.get(item.product_id)
        if prod:
            prod.stock_quantity = F('stock_quantity') + item.quantity
            prod.save(update_fields=['stock_quantity'])


class PickupSlotsView(APIView):
    """Returns realistic campus pickup slots for today and tomorrow."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = timezone.localtime()
        slots = [
            'Today, 10:00 AM - 11:00 AM',
            'Today, 11:00 AM - 12:30 PM',
            'Today, 12:30 PM - 02:00 PM (Lunch Break)',
            'Today, 02:00 PM - 04:00 PM',
            'Today, 04:00 PM - 06:00 PM (After Class)',
            'Today, 06:00 PM - 08:00 PM',
            'Tomorrow, 09:00 AM - 11:00 AM',
            'Tomorrow, 11:00 AM - 01:00 PM',
            'Tomorrow, 01:00 PM - 03:00 PM',
            'Tomorrow, 03:00 PM - 06:00 PM',
        ]
        return Response({'current_time': now.strftime('%I:%M %p'), 'slots': slots})


class CheckoutView(APIView):
    """
    Atomically converts the authenticated customer's shopping cart into
    1 parent OrderGroup + N separate shop-specific Orders (one per shop).
    Reserves stock atomically inside a DB transaction.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment_method = serializer.validated_data['payment_method']
        default_pickup_time = (serializer.validated_data.get('pickup_time') or '').strip()
        shop_pickup_times = serializer.validated_data.get('shop_pickup_times') or {}
        notes = serializer.validated_data.get('notes', '').strip()

        with transaction.atomic():
            cart = Cart.objects.filter(user=request.user).first()
            if not cart:
                return Response({'detail': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

            cart_items = list(cart.items.select_related('product__shop').all())
            if not cart_items:
                return Response({'detail': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

            # Lock all product rows in deterministic order to avoid deadlocks / overselling
            product_ids = sorted({item.product_id for item in cart_items})
            locked_products = {
                p.id: p
                for p in Product.objects.select_for_update()
                .select_related('shop')
                .filter(id__in=product_ids)
            }

            # Validate stock and availability for every item
            errors = []
            items_by_shop = defaultdict(list)
            for item in cart_items:
                product = locked_products.get(item.product_id)
                if not product:
                    errors.append('One of the products in your cart no longer exists.')
                    continue
                if product.shop.approval_status != Shop.ApprovalStatus.APPROVED or not product.shop.is_active:
                    errors.append(f'Shop "{product.shop.name}" is currently unavailable.')
                    continue
                if not product.is_available:
                    errors.append(f'"{product.name}" is currently unavailable.')
                    continue
                if product.stock_quantity < item.quantity:
                    errors.append(
                        f'Insufficient stock for "{product.name}": requested {item.quantity}, available {product.stock_quantity}.'
                    )
                    continue
                items_by_shop[product.shop_id].append((item, product))

            if errors:
                return Response({'detail': ' '.join(errors), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

            # Create parent OrderGroup
            order_group = OrderGroup.objects.create(
                customer=request.user,
                total_amount=Decimal('0.00'),
                notes=notes,
            )

            grand_total = Decimal('0.00')
            created_orders = []

            for shop_id, shop_items in items_by_shop.items():
                shop = shop_items[0][1].shop
                shop_pickup = (
                    shop_pickup_times.get(str(shop_id))
                    or shop_pickup_times.get(shop_id)
                    or default_pickup_time
                    or 'Today, Next Available Slot'
                )

                shop_total = Decimal('0.00')
                order = Order.objects.create(
                    order_group=order_group,
                    customer=request.user,
                    shop=shop,
                    total_amount=Decimal('0.00'),
                    order_status=Order.OrderStatus.PENDING,
                    payment_method=payment_method,
                    # Strictly never fake an online payment as Paid without a real gateway
                    payment_status=Order.PaymentStatus.PENDING,
                    pickup_time=shop_pickup,
                    customer_notes=notes,
                )

                for cart_item, product in shop_items:
                    unit_price = product.effective_price
                    line_subtotal = unit_price * cart_item.quantity
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        product_name_snapshot=product.name,
                        price_snapshot=unit_price,
                        quantity=cart_item.quantity,
                        subtotal=line_subtotal,
                    )
                    # Atomically reserve/deduct stock
                    product.stock_quantity -= cart_item.quantity
                    product.save(update_fields=['stock_quantity'])
                    shop_total += line_subtotal

                order.total_amount = shop_total
                order.save(update_fields=['total_amount'])
                grand_total += shop_total
                created_orders.append(order)

                # Notify shop owner
                Notification.objects.create(
                    user=shop.owner,
                    title=f'New Order {order.order_number}',
                    message=(
                        f'{request.user.full_name} placed an order worth ₹{shop_total} '
                        f'for pickup ({shop_pickup}).'
                    ),
                )

            order_group.total_amount = grand_total
            order_group.save(update_fields=['total_amount'])

            # Clear customer cart
            cart.items.all().delete()

            # Notify customer
            Notification.objects.create(
                user=request.user,
                title=f'Order Confirmed ({order_group.group_code})',
                message=(
                    f'Your checkout created {len(created_orders)} shop order(s) '
                    f'totaling ₹{grand_total}. Track live status in My Orders.'
                ),
            )

        # Reload with relations for serialization
        order_group = OrderGroup.objects.prefetch_related(
            'orders__items__product', 'orders__shop', 'orders__customer'
        ).get(pk=order_group.pk)

        return Response(
            {
                'message': f'Order placed successfully! Created {len(created_orders)} shop-specific order(s).',
                'order_group': OrderGroupSerializer(order_group, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerOrderListView(generics.ListAPIView):
    """Customer views their own order groups & individual shop orders."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        qs = (
            Order.objects.filter(customer=self.request.user)
            .select_related('order_group', 'shop', 'customer')
            .prefetch_related('items__product')
        )
        order_status = self.request.query_params.get('status')
        if order_status and order_status != 'ALL':
            qs = qs.filter(order_status=order_status)
        return qs


class CustomerOrderGroupListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderGroupSerializer

    def get_queryset(self):
        return (
            OrderGroup.objects.filter(customer=self.request.user)
            .prefetch_related('orders__items__product', 'orders__shop', 'orders__customer')
            .order_by('-created_at')
        )


class OrderDetailView(APIView):
    """Retrieve a single order with strict role-based ownership enforcement."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = (
            Order.objects.select_related('order_group', 'shop', 'customer')
            .prefetch_related('items__product')
            .filter(pk=pk)
            .first()
        )
        if not order:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_admin = user.role == 'ADMIN' or user.is_superuser
        is_customer = order.customer_id == user.id
        is_shop_owner = getattr(user, 'shop', None) is not None and order.shop_id == user.shop.id

        if not (is_admin or is_customer or is_shop_owner):
            return Response(
                {'detail': 'You do not have permission to view this order.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(OrderSerializer(order, context={'request': request}).data)


class CustomerCancelOrderView(APIView):
    """Customer cancels their own eligible order (PENDING or ACCEPTED) and restores stock."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        reason = (request.data.get('reason') or 'Cancelled by customer').strip()

        with transaction.atomic():
            order = (
                Order.objects.select_for_update()
                .select_related('shop__owner', 'customer')
                .filter(pk=pk)
                .first()
            )
            if not order:
                return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

            if order.customer_id != request.user.id:
                return Response(
                    {'detail': 'You can only cancel your own orders.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not order.can_customer_cancel:
                return Response(
                    {
                        'detail': (
                            f'Cannot cancel order while status is "{order.get_order_status_display()}". '
                            'Only Pending or Accepted orders can be cancelled.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order.order_status = Order.OrderStatus.CANCELLED
            order.status_note = reason
            if order.payment_status == Order.PaymentStatus.PAID:
                order.payment_status = Order.PaymentStatus.REFUNDED
            order.save(update_fields=['order_status', 'status_note', 'payment_status', 'updated_at'])

            _restore_order_inventory(order)

            Notification.objects.create(
                user=order.shop.owner,
                title=f'Order Cancelled: {order.order_number}',
                message=f'{request.user.full_name} cancelled order {order.order_number}. Stock has been restored.',
            )

        order = Order.objects.select_related('order_group', 'shop', 'customer').prefetch_related('items__product').get(pk=pk)
        return Response(OrderSerializer(order, context={'request': request}).data)


class ShopOrderListView(generics.ListAPIView):
    """Shop owner views ONLY orders belonging to their own shop."""
    permission_classes = [IsShopOwnerRole]
    serializer_class = OrderSerializer

    def get_queryset(self):
        shop = ensure_shop_for_user(self.request.user)
        if not shop:
            return Order.objects.none()
        qs = (
            Order.objects.filter(shop=shop)
            .select_related('order_group', 'shop', 'customer')
            .prefetch_related('items__product')
        )
        order_status = self.request.query_params.get('status')
        if order_status and order_status != 'ALL':
            qs = qs.filter(order_status=order_status)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(order_number__icontains=search)
                | Q(customer__full_name__icontains=search)
                | Q(customer__username__icontains=search)
            )
        return qs


class ShopOrderStatusUpdateView(APIView):
    """Shop owner updates status/payment_status of ONLY their own shop's order with strict transition checks."""
    permission_classes = [IsShopOwnerRole]

    def patch(self, request, pk):
        shop = ensure_shop_for_user(request.user)
        if not shop:
            return Response({'detail': 'No shop found for your account.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('order_status')
        new_payment_status = request.data.get('payment_status')
        status_note = (request.data.get('status_note') or '').strip()

        with transaction.atomic():
            order = (
                Order.objects.select_for_update()
                .select_related('customer', 'shop')
                .filter(pk=pk)
                .first()
            )
            if not order:
                return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
            if order.shop_id != shop.id:
                return Response(
                    {'detail': 'You are not authorized to manage orders for another shop.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            update_fields = ['updated_at']

            if new_status and new_status != order.order_status:
                allowed = Order.SHOP_OWNER_TRANSITIONS.get(order.order_status, set())
                if new_status not in allowed:
                    return Response(
                        {
                            'detail': (
                                f'Invalid status transition from {order.order_status} to {new_status}. '
                                f'Allowed: {", ".join(sorted(allowed)) or "None (terminal state)"}.'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                order.order_status = new_status
                update_fields.append('order_status')

                if status_note:
                    order.status_note = status_note
                    update_fields.append('status_note')

                if new_status == Order.OrderStatus.REJECTED:
                    _restore_order_inventory(order)
                    if order.payment_status == Order.PaymentStatus.PAID:
                        order.payment_status = Order.PaymentStatus.REFUNDED
                        update_fields.append('payment_status')

                if new_status == Order.OrderStatus.COMPLETED and not new_payment_status:
                    if order.payment_method == Order.PaymentMethod.CASH_ON_PICKUP:
                        order.payment_status = Order.PaymentStatus.PAID
                        update_fields.append('payment_status')

                Notification.objects.create(
                    user=order.customer,
                    title=f'Order {order.order_number}: {order.get_order_status_display()}',
                    message=(
                        f'Your order from {shop.name} is now {order.get_order_status_display()}.'
                        + (f' Note: {status_note}' if status_note else '')
                    ),
                )

            if new_payment_status:
                valid_pay = {c[0] for c in Order.PaymentStatus.choices}
                if new_payment_status not in valid_pay:
                    return Response({'detail': 'Invalid payment status.'}, status=status.HTTP_400_BAD_REQUEST)
                order.payment_status = new_payment_status
                if 'payment_status' not in update_fields:
                    update_fields.append('payment_status')

            order.save(update_fields=update_fields)

        order = Order.objects.select_related('order_group', 'shop', 'customer').prefetch_related('items__product').get(pk=pk)
        return Response(OrderSerializer(order, context={'request': request}).data)


class ShopDashboardAnalyticsView(APIView):
    """Comprehensive overview & analytics for a Shop Owner's own shop."""
    permission_classes = [IsShopOwnerRole]

    def get(self, request):
        shop = ensure_shop_for_user(request.user)
        if not shop:
            return Response({'detail': 'No shop associated with your account.'}, status=status.HTTP_404_NOT_FOUND)

        products_qs = Product.objects.filter(shop=shop)
        orders_qs = Order.objects.filter(shop=shop)

        total_products = products_qs.count()
        out_of_stock_count = products_qs.filter(stock_quantity=0).count()
        low_stock_products = products_qs.filter(
            stock_quantity__gt=0,
            stock_quantity__lte=F('low_stock_threshold'),
        ).order_by('stock_quantity')

        total_orders = orders_qs.count()
        pending_orders = orders_qs.filter(order_status=Order.OrderStatus.PENDING).count()
        active_orders = orders_qs.filter(
            order_status__in=[
                Order.OrderStatus.ACCEPTED,
                Order.OrderStatus.PREPARING,
                Order.OrderStatus.READY_FOR_PICKUP,
            ]
        ).count()
        completed_orders = orders_qs.filter(order_status=Order.OrderStatus.COMPLETED).count()
        cancelled_rejected_orders = orders_qs.filter(
            order_status__in=[Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED]
        ).count()

        valid_sales_qs = orders_qs.exclude(
            order_status__in=[Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED]
        )
        total_sales = valid_sales_qs.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        completed_sales = (
            orders_qs.filter(order_status=Order.OrderStatus.COMPLETED)
            .aggregate(total=Sum('total_amount'))['total']
            or Decimal('0.00')
        )

        # Best-selling products for this shop
        best_sellers = list(
            OrderItem.objects.filter(
                order__shop=shop,
            )
            .exclude(order__order_status__in=[Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED])
            .values('product_id', 'product_name_snapshot')
            .annotate(units_sold=Sum('quantity'), revenue=Sum('subtotal'))
            .order_by('-units_sold')[:6]
        )

        # Daily order stats (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=6)
        daily_stats_qs = (
            valid_sales_qs.filter(created_at__gte=seven_days_ago)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(order_count=Count('id'), revenue=Sum('total_amount'))
            .order_by('day')
        )
        daily_stats = [
            {
                'date': row['day'].strftime('%Y-%m-%d') if row['day'] else '',
                'order_count': row['order_count'],
                'revenue': float(row['revenue'] or 0),
            }
            for row in daily_stats_qs
        ]

        # Monthly order stats (last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_stats_qs = (
            valid_sales_qs.filter(created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(order_count=Count('id'), revenue=Sum('total_amount'))
            .order_by('month')
        )
        monthly_stats = [
            {
                'month': row['month'].strftime('%b %Y') if row['month'] else '',
                'order_count': row['order_count'],
                'revenue': float(row['revenue'] or 0),
            }
            for row in monthly_stats_qs
        ]

        recent_orders = (
            orders_qs.select_related('order_group', 'shop', 'customer')
            .prefetch_related('items__product')[:6]
        )

        return Response({
            'shop': ShopSerializer(shop, context={'request': request}).data,
            'metrics': {
                'total_products': total_products,
                'out_of_stock_count': out_of_stock_count,
                'low_stock_count': low_stock_products.count(),
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'active_orders': active_orders,
                'completed_orders': completed_orders,
                'cancelled_rejected_orders': cancelled_rejected_orders,
                'total_sales': float(total_sales),
                'completed_sales': float(completed_sales),
            },
            'low_stock_products': ProductSerializer(low_stock_products, many=True, context={'request': request}).data,
            'best_selling_products': [
                {
                    'product_id': b['product_id'],
                    'name': b['product_name_snapshot'],
                    'units_sold': b['units_sold'],
                    'revenue': float(b['revenue'] or 0),
                }
                for b in best_sellers
            ],
            'daily_stats': daily_stats,
            'monthly_stats': monthly_stats,
            'recent_orders': OrderSerializer(recent_orders, many=True, context={'request': request}).data,
        })


class AdminOrderListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = OrderSerializer

    def get_queryset(self):
        qs = (
            Order.objects.select_related('order_group', 'shop', 'customer')
            .prefetch_related('items__product')
            .order_by('-created_at')
        )
        order_status = self.request.query_params.get('status')
        payment_status = self.request.query_params.get('payment_status')
        shop_id = self.request.query_params.get('shop')
        search = self.request.query_params.get('search', '').strip()
        if order_status and order_status != 'ALL':
            qs = qs.filter(order_status=order_status)
        if payment_status and payment_status != 'ALL':
            qs = qs.filter(payment_status=payment_status)
        if shop_id:
            qs = qs.filter(shop_id=shop_id)
        if search:
            qs = qs.filter(
                Q(order_number__icontains=search)
                | Q(shop__name__icontains=search)
                | Q(customer__full_name__icontains=search)
                | Q(customer__username__icontains=search)
            )
        return qs


class AdminOrderStatusUpdateView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        new_status = request.data.get('order_status')
        new_payment_status = request.data.get('payment_status')
        status_note = (request.data.get('status_note') or '').strip()

        with transaction.atomic():
            order = Order.objects.select_for_update().select_related('customer', 'shop').filter(pk=pk).first()
            if not order:
                return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

            update_fields = ['updated_at']
            if new_status and new_status != order.order_status:
                allowed = Order.VALID_TRANSITIONS.get(order.order_status, set())
                if new_status not in allowed:
                    return Response(
                        {'detail': f'Invalid transition from {order.order_status} to {new_status}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                order.order_status = new_status
                update_fields.append('order_status')
                if status_note:
                    order.status_note = status_note
                    update_fields.append('status_note')
                if new_status in (Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED):
                    _restore_order_inventory(order)

            if new_payment_status:
                valid_pay = {c[0] for c in Order.PaymentStatus.choices}
                if new_payment_status not in valid_pay:
                    return Response({'detail': 'Invalid payment status.'}, status=status.HTTP_400_BAD_REQUEST)
                order.payment_status = new_payment_status
                update_fields.append('payment_status')

            order.save(update_fields=update_fields)

        order = Order.objects.select_related('order_group', 'shop', 'customer').prefetch_related('items__product').get(pk=pk)
        return Response(OrderSerializer(order, context={'request': request}).data)


class AdminDashboardStatsView(APIView):
    """Platform-wide statistics and analytics for the Administrator Dashboard."""
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
        total_shop_owners = User.objects.filter(role=User.Role.SHOP_OWNER).count()
        total_users = User.objects.count()
        total_shops = Shop.objects.count()
        approved_shops = Shop.objects.filter(approval_status=Shop.ApprovalStatus.APPROVED, is_active=True).count()
        pending_shops_qs = Shop.objects.filter(approval_status=Shop.ApprovalStatus.PENDING).select_related('owner')
        total_products = Product.objects.count()
        reported_products_count = Product.objects.filter(is_reported=True).count()
        reported_reviews_count = Review.objects.filter(is_reported=True).count()

        orders_qs = Order.objects.all()
        total_orders = orders_qs.count()
        valid_orders_qs = orders_qs.exclude(
            order_status__in=[Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED]
        )
        total_sales = valid_orders_qs.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        paid_revenue = (
            orders_qs.filter(payment_status=Order.PaymentStatus.PAID)
            .aggregate(total=Sum('total_amount'))['total']
            or Decimal('0.00')
        )

        # Most popular shops by order volume & revenue
        popular_shops = list(
            Shop.objects.filter(approval_status=Shop.ApprovalStatus.APPROVED)
            .annotate(
                order_count=Count(
                    'orders',
                    filter=~Q(orders__order_status__in=[Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED]),
                ),
                revenue=Sum(
                    'orders__total_amount',
                    filter=~Q(orders__order_status__in=[Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED]),
                ),
                category_name_val=F('category__name'),
            )
            .order_by('-order_count', '-revenue')[:6]
            .values('id', 'name', 'category_name_val', 'location', 'order_count', 'revenue')
        )

        # Most popular products
        popular_products = list(
            OrderItem.objects.exclude(
                order__order_status__in=[Order.OrderStatus.CANCELLED, Order.OrderStatus.REJECTED]
            )
            .values('product_id', 'product_name_snapshot', 'order__shop__name')
            .annotate(units_sold=Sum('quantity'), revenue=Sum('subtotal'))
            .order_by('-units_sold')[:6]
        )

        # Order status breakdown
        status_breakdown = list(
            orders_qs.values('order_status').annotate(count=Count('id')).order_by('order_status')
        )

        recent_orders = (
            orders_qs.select_related('order_group', 'shop', 'customer')
            .prefetch_related('items__product')[:8]
        )

        return Response({
            'metrics': {
                'total_users': total_users,
                'total_customers': total_customers,
                'total_shop_owners': total_shop_owners,
                'total_shops': total_shops,
                'approved_shops': approved_shops,
                'pending_shops_count': pending_shops_qs.count(),
                'total_products': total_products,
                'reported_products_count': reported_products_count,
                'reported_reviews_count': reported_reviews_count,
                'total_orders': total_orders,
                'total_sales': float(total_sales),
                'paid_revenue': float(paid_revenue),
            },
            'pending_shops': ShopSerializer(pending_shops_qs, many=True, context={'request': request}).data,
            'popular_shops': [
                {
                    'id': s['id'],
                    'name': s['name'],
                    'category': s['category_name_val'] or 'General',
                    'location': s['location'],
                    'order_count': s['order_count'] or 0,
                    'revenue': float(s['revenue'] or 0),
                }
                for s in popular_shops
            ],
            'popular_products': [
                {
                    'product_id': p['product_id'],
                    'name': p['product_name_snapshot'],
                    'shop_name': p['order__shop__name'],
                    'units_sold': p['units_sold'],
                    'revenue': float(p['revenue'] or 0),
                }
                for p in popular_products
            ],
            'status_breakdown': status_breakdown,
            'recent_orders': OrderSerializer(recent_orders, many=True, context={'request': request}).data,
        })
