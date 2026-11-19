import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flag,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Store,
  Trash2,
} from 'lucide-react';
import { formatINR, formatTime12, getErrorMessage, marketplaceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [reviewsData, setReviewsData] = useState({ average_rating: 0, count: 0, reviews: [] });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, revRes] = await Promise.all([
        marketplaceAPI.getProductDetail(id),
        marketplaceAPI.getProductReviews(id),
      ]);
      setProduct(prodRes.data);
      setReviewsData(revRes.data);
      setQuantity(1);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async () => {
    if (!product?.in_stock) return;
    setAdding(true);
    const res = await addToCart(product.id, quantity);
    setAdding(false);
    if (res.unauthenticated) navigate('/login');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Sign in to write a product review.');
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      await marketplaceAPI.addProductReview(product.id, { rating, comment });
      toast.success('Review submitted! Thank you for your feedback.');
      setComment('');
      const revRes = await marketplaceAPI.getProductReviews(product.id);
      setReviewsData(revRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit review.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await marketplaceAPI.deleteReview(reviewId);
      toast.info('Review deleted.');
      const revRes = await marketplaceAPI.getProductReviews(product.id);
      setReviewsData(revRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReportReview = async (reviewId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await marketplaceAPI.reportReview(reviewId, 'Flagged by campus user as inappropriate');
      toast.success('Review reported to platform administrators.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReportProduct = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      await marketplaceAPI.reportProduct(product.id, reportReason);
      toast.success('Product reported to administrators for review.');
      setReportOpen(false);
      setReportReason('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="Product Not Found"
          description="This product may have been removed or its shop is temporarily unavailable."
          action={
            <Link to="/products" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
              Browse All Products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        {isAuthenticated && (
          <button
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            Report Listing
          </button>
        )}
      </div>

      {/* Main Product Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Product Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-400 text-4xl font-extrabold">
                  {product.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {product.discount_percent > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shadow">
                  Save {product.discount_percent}%
                </span>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                {product.category_name}
              </span>
              {product.in_stock ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  In Stock ({product.stock_quantity} available)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating Summary */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(reviewsData.average_rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">
                {reviewsData.average_rating > 0 ? reviewsData.average_rating.toFixed(1) : 'No ratings yet'}
              </span>
              <span className="text-sm text-slate-400">({reviewsData.count} reviews)</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {formatINR(product.effective_price)}
              </span>
              {product.discount_percent > 0 && (
                <>
                  <span className="text-lg text-slate-400 line-through">{formatINR(product.price)}</span>
                  <span className="text-sm font-bold text-emerald-600">
                    You save {formatINR(Number(product.price) - Number(product.effective_price))}
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              {product.description || 'Quality campus product verified by CampusCart.'}
            </p>

            {/* Shop Info Card */}
            <Link
              to={`/shops/${product.shop}`}
              className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sold & Fulfilled By</p>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-indigo-600" />
                  {product.shop_name}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Pickup at: {product.shop_location}
                </p>
                {product.shop_opening_time && product.shop_closing_time && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTime12(product.shop_opening_time)} – {formatTime12(product.shop_closing_time)}
                  </p>
                )}
              </div>
              <span className="text-xs font-bold text-indigo-600 shrink-0 mt-1">Visit Shop →</span>
            </Link>

            {/* Quantity & Add to Cart */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <div className="inline-flex items-center justify-between border border-slate-200 rounded-xl bg-slate-50 px-2 py-1.5 w-full sm:w-36">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!product.in_stock || quantity <= 1}
                  className="p-2 rounded-lg hover:bg-white text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-900 text-base">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                  disabled={!product.in_stock || quantity >= product.stock_quantity}
                  className="p-2 rounded-lg hover:bg-white text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.in_stock || adding}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer ${
                  product.in_stock
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {!product.in_stock
                  ? 'Currently Out of Stock'
                  : adding
                  ? 'Adding to Cart...'
                  : `Add to Cart • ${formatINR(Number(product.effective_price) * quantity)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-extrabold text-slate-900">Write a Review</h2>
          <p className="text-xs text-slate-500 mt-0.5">Share your campus pickup experience with fellow students.</p>
          <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Your Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Comment
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the product quality and shop service?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">
            Student & Staff Reviews ({reviewsData.count})
          </h2>
          {reviewsData.reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            reviewsData.reviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{rev.customer_name || rev.customer_username}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-1.5">
                        {new Date(rev.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(user?.id === rev.customer || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAuthenticated && user?.id !== rev.customer && (
                      <button
                        onClick={() => handleReportReview(rev.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                        title="Report review"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {rev.comment && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{rev.comment}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products */}
      {product.related_products?.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold text-slate-900">Related Campus Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {product.related_products.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}

      {/* Report Product Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Report Product Listing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tell campus administrators why "{product.name}" should be reviewed.
            </p>
            <form onSubmit={handleReportProduct} className="mt-4 space-y-4">
              <textarea
                required
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="e.g., Incorrect pricing, expired item, misleading description..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
