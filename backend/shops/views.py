from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAdminRole, IsShopOwnerRole
from notifications.models import Notification
from .models import Shop, ShopCategory, ShopType
from .utils import ensure_shop_for_user
from .serializers import (
    AdminShopSerializer,
    ShopCategorySerializer,
    ShopRegistrationSerializer,
    ShopSerializer,
    ShopTypeSerializer,
)

User = get_user_model()


class ShopCategoryListView(generics.ListCreateAPIView):
    """
    Public users see active categories with counts.
    Administrators can see all categories and create new ones.
    """
    serializer_class = ShopCategorySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = ShopCategory.objects.annotate(
            annotated_shop_count=Count(
                'shops',
                filter=Q(shops__approval_status=Shop.ApprovalStatus.APPROVED, shops__is_active=True),
            ),
            annotated_type_count=Count('shop_types', filter=Q(shop_types__is_active=True)),
        ).prefetch_related('shop_types')

        user = self.request.user
        is_admin = bool(user and user.is_authenticated and (user.role == 'ADMIN' or user.is_superuser))
        show_all = self.request.query_params.get('all', '').lower() in ('true', '1')

        if not (is_admin and show_all):
            qs = qs.filter(is_active=True)

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        return qs.order_by('name')


class ShopCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Public detail view; Admin can update or delete.
    Accidental deletion is prevented if shops are assigned to the category.
    """
    serializer_class = ShopCategorySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = ShopCategory.objects.prefetch_related('shop_types', 'shops')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminRole()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        shop_count = instance.shops.count()
        if shop_count > 0:
            return Response(
                {
                    'detail': (
                        f'Cannot delete category "{instance.name}" because it is currently assigned to '
                        f'{shop_count} shop(s). Please deactivate it instead.'
                    ),
                    'shops_assigned': shop_count,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class ShopTypeListView(generics.ListCreateAPIView):
    """
    Public lists active shop types (optionally filtered by ?category={id_or_slug}).
    Administrators can create new shop types.
    """
    serializer_class = ShopTypeSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = ShopType.objects.select_related('category').annotate(
            annotated_shop_count=Count(
                'shops',
                filter=Q(shops__approval_status=Shop.ApprovalStatus.APPROVED, shops__is_active=True),
            )
        )

        user = self.request.user
        is_admin = bool(user and user.is_authenticated and (user.role == 'ADMIN' or user.is_superuser))
        show_all = self.request.query_params.get('all', '').lower() in ('true', '1')

        if not (is_admin and show_all):
            qs = qs.filter(is_active=True, category__is_active=True)

        category_param = self.request.query_params.get('category', '').strip()
        if category_param and category_param.lower() != 'all':
            if category_param.isdigit():
                qs = qs.filter(category_id=int(category_param))
            else:
                qs = qs.filter(
                    Q(category__slug__iexact=category_param) | Q(category__name__iexact=category_param)
                )

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        return qs.order_by('category__name', 'name')


class ShopTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Public detail view; Admin can update or delete.
    Accidental deletion is prevented if shops are assigned to the type.
    """
    serializer_class = ShopTypeSerializer
    queryset = ShopType.objects.select_related('category').prefetch_related('shops')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminRole()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        shop_count = instance.shops.count()
        if shop_count > 0:
            return Response(
                {
                    'detail': (
                        f'Cannot delete shop type "{instance.name}" because it is currently assigned to '
                        f'{shop_count} shop(s). Please deactivate it instead.'
                    ),
                    'shops_assigned': shop_count,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class PublicShopListView(generics.ListAPIView):
    """Lists all approved and active university shops with advanced category & type filtering."""
    permission_classes = [permissions.AllowAny]
    serializer_class = ShopSerializer

    def get_queryset(self):
        qs = (
            Shop.objects.filter(
                approval_status=Shop.ApprovalStatus.APPROVED,
                is_active=True,
            )
            .select_related('owner', 'category', 'shop_type')
            .annotate(
                annotated_product_count=Count('products', filter=Q(products__is_available=True))
            )
        )

        params = self.request.query_params

        # 1. Main Category filter (by ID, slug, or name)
        category_param = params.get('category', '').strip()
        if category_param and category_param.lower() != 'all':
            if category_param.isdigit():
                qs = qs.filter(category_id=int(category_param))
            else:
                qs = qs.filter(
                    Q(category__slug__iexact=category_param) | Q(category__name__iexact=category_param)
                )

        # 2. Shop Type filter (by ID or name)
        shop_type_param = params.get('shop_type', '').strip()
        if shop_type_param and shop_type_param.lower() != 'all':
            if shop_type_param.isdigit():
                qs = qs.filter(shop_type_id=int(shop_type_param))
            else:
                qs = qs.filter(
                    Q(shop_type__slug__iexact=shop_type_param) | Q(shop_type__name__iexact=shop_type_param)
                )

        # 3. Product Category filter (for product-to-shop relationship)
        product_category = params.get('product_category', '').strip()
        if product_category and product_category.lower() != 'all':
            if product_category.isdigit():
                qs = qs.filter(
                    Q(products__category_id=int(product_category))
                    | Q(category_id=int(product_category))
                ).distinct()
            else:
                qs = qs.filter(
                    Q(products__category__slug__iexact=product_category)
                    | Q(products__category__name__iexact=product_category)
                    | Q(category__slug__iexact=product_category)
                    | Q(category__name__iexact=product_category)
                ).distinct()

        # 4. Search query
        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(location__icontains=search)
                | Q(category__name__icontains=search)
                | Q(shop_type__name__icontains=search)
            )

        # 5. Location filter
        location = params.get('location', '').strip()
        if location:
            qs = qs.filter(location__icontains=location)

        # 6. Ordering (alphabetical, newest, etc.)
        ordering = params.get('ordering', '').strip()
        if ordering == 'name_asc':
            qs = qs.order_by('name')
        elif ordering == 'name_desc':
            qs = qs.order_by('-name')
        elif ordering == 'newest':
            qs = qs.order_by('-created_at')
        else:
            qs = qs.order_by('name')

        return qs


class ShopCategoriesListView(APIView):
    """Backward-compatible endpoint returning list of active shop category names."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = (
            ShopCategory.objects.filter(is_active=True)
            .values_list('name', flat=True)
            .order_by('name')
        )
        return Response(list(categories))


class PublicShopDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ShopSerializer

    def get_queryset(self):
        user = self.request.user
        base = Shop.objects.select_related('owner', 'category', 'shop_type')
        if user and user.is_authenticated and (user.role == 'ADMIN' or user.is_superuser):
            return base
        if user and user.is_authenticated and user.role == 'SHOP_OWNER':
            return base.filter(
                Q(approval_status=Shop.ApprovalStatus.APPROVED, is_active=True) | Q(owner=user)
            )
        return base.filter(approval_status=Shop.ApprovalStatus.APPROVED, is_active=True)


class ShopRegisterView(APIView):
    """Authenticated user submits a new shop registration for admin approval."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        if hasattr(request.user, 'shop'):
            return Response(
                {'detail': 'You already have a shop registered to your account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ShopRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shop = serializer.save(
            owner=request.user,
            approval_status=Shop.ApprovalStatus.PENDING,
            is_active=True,
        )
        if request.user.role == User.Role.CUSTOMER:
            request.user.role = User.Role.SHOP_OWNER
            request.user.save(update_fields=['role'])

        # Notify admins about the new shop approval request
        admins = User.objects.filter(Q(role=User.Role.ADMIN) | Q(is_superuser=True))
        Notification.objects.bulk_create([
            Notification(
                user=admin_user,
                title='New Shop Approval Request',
                message=f'"{shop.name}" ({shop.category_name} - {shop.shop_type_name}) registered by {request.user.full_name} is pending approval.',
            )
            for admin_user in admins
        ])

        return Response(
            {
                'message': 'Shop registration submitted! An administrator will review and approve it shortly.',
                'shop': ShopSerializer(shop, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MyShopView(APIView):
    """Shop owner views and updates ONLY their own shop profile."""
    permission_classes = [IsShopOwnerRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        shop = ensure_shop_for_user(request.user)
        if not shop:
            return Response(
                {'detail': 'No shop is associated with your account yet.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ShopSerializer(shop, context={'request': request}).data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial=True):
        shop = ensure_shop_for_user(request.user)
        if not shop:
            return Response(
                {'detail': 'No shop is associated with your account.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ShopSerializer(shop, data=request.data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminShopListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = AdminShopSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = (
            Shop.objects.select_related('owner', 'category', 'shop_type')
            .annotate(annotated_product_count=Count('products'))
            .order_by('-created_at')
        )
        approval_status = self.request.query_params.get('approval_status')
        category = self.request.query_params.get('category')
        shop_type = self.request.query_params.get('shop_type')
        search = self.request.query_params.get('search')
        if approval_status:
            qs = qs.filter(approval_status=approval_status)
        if category:
            qs = qs.filter(category_id=category) if category.isdigit() else qs.filter(category__slug=category)
        if shop_type:
            qs = qs.filter(shop_type_id=shop_type)
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(location__icontains=search)
                | Q(owner__username__icontains=search)
                | Q(category__name__icontains=search)
                | Q(shop_type__name__icontains=search)
            )
        return qs


class AdminShopDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = AdminShopSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = Shop.objects.select_related('owner', 'category', 'shop_type')


class AdminShopStatusUpdateView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        shop = Shop.objects.select_related('owner', 'category', 'shop_type').filter(pk=pk).first()
        if not shop:
            return Response({'detail': 'Shop not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('approval_status')
        valid_statuses = {c[0] for c in Shop.ApprovalStatus.choices}
        if new_status not in valid_statuses:
            return Response(
                {'detail': f'Invalid status. Must be one of: {", ".join(sorted(valid_statuses))}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shop.approval_status = new_status
        if new_status == Shop.ApprovalStatus.SUSPENDED:
            shop.is_active = False
        elif new_status == Shop.ApprovalStatus.APPROVED:
            shop.is_active = True
        shop.save(update_fields=['approval_status', 'is_active', 'updated_at'])

        Notification.objects.create(
            user=shop.owner,
            title=f'Shop Status Updated: {shop.get_approval_status_display()}',
            message=f'Your shop "{shop.name}" status has been updated to {shop.get_approval_status_display()} by the administrator.',
        )

        return Response(ShopSerializer(shop, context={'request': request}).data)
