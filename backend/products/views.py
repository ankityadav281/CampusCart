from decimal import Decimal, InvalidOperation
from django.db.models import Avg, Case, Count, DecimalField, F, Q, Sum, When
from django.db.models.functions import Coalesce
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAdminRole, IsShopOwnerRole
from shops.models import Shop
from shops.utils import ensure_shop_for_user
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


def _annotate_products(queryset):
    return queryset.select_related('shop', 'category').annotate(
        annotated_avg_rating=Avg('reviews__rating'),
        annotated_review_count=Count('reviews', distinct=True),
        annotated_order_count=Coalesce(Sum('order_items__quantity'), 0),
        annotated_effective_price=Case(
            When(discount_price__isnull=False, discount_price__lt=F('price'), then=F('discount_price')),
            default=F('price'),
            output_field=DecimalField(max_digits=10, decimal_places=2),
        ),
    )


class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.annotate(
            annotated_product_count=Count(
                'products',
                filter=Q(
                    products__is_available=True,
                    products__shop__approval_status=Shop.ApprovalStatus.APPROVED,
                    products__shop__is_active=True,
                ),
            )
        ).order_by('name')


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = CategorySerializer
    queryset = Category.objects.all().order_by('name')


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = CategorySerializer
    queryset = Category.objects.all()


class PublicProductListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = _annotate_products(
            Product.objects.filter(
                shop__approval_status=Shop.ApprovalStatus.APPROVED,
                shop__is_active=True,
            )
        )
        params = self.request.query_params

        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(shop__name__icontains=search)
                | Q(category__name__icontains=search)
            )

        shop_id = params.get('shop')
        if shop_id:
            qs = qs.filter(shop_id=shop_id)

        category = params.get('category', '').strip()
        if category and category.lower() != 'all':
            if category.isdigit():
                qs = qs.filter(category_id=int(category))
            else:
                qs = qs.filter(Q(category__slug__iexact=category) | Q(category__name__iexact=category))

        min_price = params.get('min_price')
        if min_price:
            try:
                qs = qs.filter(annotated_effective_price__gte=Decimal(min_price))
            except InvalidOperation:
                pass

        max_price = params.get('max_price')
        if max_price:
            try:
                qs = qs.filter(annotated_effective_price__lte=Decimal(max_price))
            except InvalidOperation:
                pass

        available_only = params.get('available_only', '').lower()
        if available_only in ('true', '1', 'yes'):
            qs = qs.filter(is_available=True, stock_quantity__gt=0)

        on_sale = params.get('on_sale', '').lower()
        if on_sale in ('true', '1', 'yes'):
            qs = qs.filter(discount_price__isnull=False, discount_price__lt=F('price'))

        featured = params.get('featured', '').lower()
        if featured in ('true', '1', 'yes'):
            qs = qs.filter(is_featured=True)

        sort = params.get('sort', 'newest')
        if sort == 'price_asc':
            qs = qs.order_by('annotated_effective_price', '-created_at')
        elif sort == 'price_desc':
            qs = qs.order_by('-annotated_effective_price', '-created_at')
        elif sort == 'popular':
            qs = qs.order_by('-annotated_order_count', '-annotated_review_count', '-is_featured', '-created_at')
        else:
            qs = qs.order_by('-created_at')

        limit = params.get('limit')
        if limit and limit.isdigit():
            qs = qs[: int(limit)]

        return qs


class PublicProductDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        qs = _annotate_products(
            Product.objects.filter(
                shop__approval_status=Shop.ApprovalStatus.APPROVED,
                shop__is_active=True,
            )
        )
        product = qs.filter(pk=pk).first()
        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        related_qs = _annotate_products(
            Product.objects.filter(
                shop__approval_status=Shop.ApprovalStatus.APPROVED,
                shop__is_active=True,
                is_available=True,
            )
            .filter(Q(category=product.category) | Q(shop=product.shop))
            .exclude(pk=product.pk)
        ).order_by('-annotated_order_count', '-created_at')[:4]

        data = ProductSerializer(product, context={'request': request}).data
        data['related_products'] = ProductSerializer(related_qs, many=True, context={'request': request}).data
        return Response(data)


class ReportProductView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'detail': 'Please provide a reason for reporting this product.'}, status=status.HTTP_400_BAD_REQUEST)
        product.is_reported = True
        product.report_reason = reason
        product.save(update_fields=['is_reported', 'report_reason', 'updated_at'])
        return Response({'message': 'Product reported to administrators for review.'})


class ShopProductListCreateView(generics.ListCreateAPIView):
    """Shop owners can ONLY list and create products for their own shop."""
    permission_classes = [IsShopOwnerRole]
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_shop(self):
        return ensure_shop_for_user(self.request.user)

    def get_queryset(self):
        shop = self._get_shop()
        if not shop:
            return Product.objects.none()
        qs = _annotate_products(Product.objects.filter(shop=shop))
        search = self.request.query_params.get('search', '').strip()
        stock_filter = self.request.query_params.get('stock_filter', '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if stock_filter == 'low':
            qs = qs.filter(stock_quantity__gt=0, stock_quantity__lte=F('low_stock_threshold'))
        elif stock_filter == 'out':
            qs = qs.filter(stock_quantity=0)
        return qs.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        shop = self._get_shop()
        if not shop:
            return Response(
                {'detail': 'You do not have a shop associated with your account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save(shop=shop)
        return Response(
            ProductSerializer(product, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ShopProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Shop owners can ONLY inspect, update, or delete products belonging to their own shop."""
    permission_classes = [IsShopOwnerRole]
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        shop = ensure_shop_for_user(self.request.user)
        if not shop:
            return Product.objects.none()
        return _annotate_products(Product.objects.filter(shop=shop))


class AdminProductListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = _annotate_products(Product.objects.all())
        search = self.request.query_params.get('search', '').strip()
        shop_id = self.request.query_params.get('shop')
        reported = self.request.query_params.get('reported', '').lower()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(shop__name__icontains=search))
        if shop_id:
            qs = qs.filter(shop_id=shop_id)
        if reported in ('true', '1'):
            qs = qs.filter(is_reported=True)
        return qs.order_by('-created_at')


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = Product.objects.select_related('shop', 'category')
