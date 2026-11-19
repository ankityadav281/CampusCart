from django.db.models import Avg
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAdminRole
from products.models import Product
from .models import Review
from .serializers import ReviewSerializer


class ProductReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, product_id):
        reviews = Review.objects.filter(product_id=product_id).select_related('customer', 'product__shop')
        avg = reviews.aggregate(avg=Avg('rating'))['avg']
        return Response({
            'average_rating': round(float(avg), 1) if avg is not None else 0.0,
            'count': reviews.count(),
            'reviews': ReviewSerializer(reviews, many=True).data,
        })

    def post(self, request, product_id):
        product = Product.objects.filter(pk=product_id).first()
        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        rating = request.data.get('rating')
        comment = (request.data.get('comment') or '').strip()
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return Response({'detail': 'Rating must be an integer between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)
        if rating < 1 or rating > 5:
            return Response({'detail': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        review, created = Review.objects.update_or_create(
            customer=request.user,
            product=product,
            defaults={'rating': rating, 'comment': comment},
        )
        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ReportReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = Review.objects.filter(pk=pk).first()
        if not review:
            return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)
        reason = (request.data.get('reason') or 'Inappropriate content').strip()
        review.is_reported = True
        review.report_reason = reason
        review.save(update_fields=['is_reported', 'report_reason', 'updated_at'])
        return Response({'message': 'Review has been reported to administrators.'})


class ReviewDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        review = Review.objects.filter(pk=pk).first()
        if not review:
            return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)
        is_admin = request.user.role == 'ADMIN' or request.user.is_superuser
        if review.customer_id != request.user.id and not is_admin:
            return Response({'detail': 'You can only delete your own reviews.'}, status=status.HTTP_403_FORBIDDEN)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminReviewListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.select_related('customer', 'product__shop').order_by('-created_at')
        reported = self.request.query_params.get('reported', '').lower()
        if reported in ('true', '1'):
            qs = qs.filter(is_reported=True)
        return qs


class AdminReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ReviewSerializer
    queryset = Review.objects.select_related('customer', 'product__shop')
