from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from shops.models import Shop
from .models import Cart, CartItem
from .serializers import CartSerializer


def _get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = _get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)


class CartAddItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({'detail': 'Quantity must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity < 1:
            return Response({'detail': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

        product = (
            Product.objects.select_related('shop')
            .filter(
                pk=product_id,
                shop__approval_status=Shop.ApprovalStatus.APPROVED,
                shop__is_active=True,
            )
            .first()
        )
        if not product:
            return Response({'detail': 'Product not found or shop is unavailable.'}, status=status.HTTP_404_NOT_FOUND)

        if not product.is_available or product.stock_quantity <= 0:
            return Response({'detail': 'This product is currently out of stock.'}, status=status.HTTP_400_BAD_REQUEST)

        cart = _get_or_create_cart(request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': 0},
        )
        new_quantity = cart_item.quantity + quantity
        if new_quantity > product.stock_quantity:
            if created:
                cart_item.delete()
            return Response(
                {
                    'detail': f'Only {product.stock_quantity} unit(s) of "{product.name}" available in stock.',
                    'available_stock': product.stock_quantity,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_item.quantity = new_quantity
        cart_item.save()
        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_200_OK)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        cart = _get_or_create_cart(request.user)
        cart_item = CartItem.objects.select_related('product').filter(pk=pk, cart=cart).first()
        if not cart_item:
            return Response({'detail': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            quantity = int(request.data.get('quantity'))
        except (TypeError, ValueError):
            return Response({'detail': 'Quantity must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            cart_item.delete()
            return Response(CartSerializer(cart, context={'request': request}).data)

        if not cart_item.product.is_available or cart_item.product.stock_quantity <= 0:
            return Response({'detail': 'This product is no longer in stock.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity > cart_item.product.stock_quantity:
            return Response(
                {
                    'detail': f'Only {cart_item.product.stock_quantity} unit(s) available in stock.',
                    'available_stock': cart_item.product.stock_quantity,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_item.quantity = quantity
        cart_item.save(update_fields=['quantity'])
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, pk):
        cart = _get_or_create_cart(request.user)
        cart_item = CartItem.objects.filter(pk=pk, cart=cart).first()
        if not cart_item:
            return Response({'detail': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)
        cart_item.delete()
        return Response(CartSerializer(cart, context={'request': request}).data)


class CartClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        cart = _get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart, context={'request': request}).data)
