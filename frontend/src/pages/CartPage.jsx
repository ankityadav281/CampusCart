import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Info, MapPin, Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { formatINR } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/EmptyState';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Sign in to view your Campus Cart"
          description="Add products from multiple university shops into a single cart and check out seamlessly."
          action={
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
            >
              Sign In Now
            </Link>
          }
        />
      </div>
    );
  }

  if (loading && cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-56" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Your Campus Cart is empty"
          description="Explore stationery, canteen snacks, electronics, groceries, bakery items, and more across campus shops."
          action={
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
            >
              Browse Campus Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cart.total_items} item(s) across {cart.shop_count} campus shop(s)
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Clear Cart
        </button>
      </div>

      {/* Multi-shop info banner */}
      {cart.shop_count > 1 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Smart Multi-Shop Order Splitting:</span> Your cart contains items from{' '}
            <strong>{cart.shop_count} different shops</strong>. At checkout, CampusCart will automatically create{' '}
            <strong>{cart.shop_count} separate shop orders</strong> under one order group so each shop prepares and updates your pickup independently.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Shop-Grouped Cart Items */}
        <div className="lg:col-span-8 space-y-5">
          {cart.shop_groups.map((group) => (
            <div key={group.shop_id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <Link
                  to={`/shops/${group.shop_id}`}
                  className="font-bold text-slate-900 hover:text-indigo-600 inline-flex items-center gap-2 text-sm"
                >
                  <Store className="w-4 h-4 text-indigo-600" />
                  {group.shop_name}
                </Link>
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {group.shop_location}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200"
                    >
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold">
                          {item.product_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product_id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-sm sm:text-base line-clamp-1"
                      >
                        {item.product_name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-indigo-600">{formatINR(item.unit_price)}</span>
                        {Number(item.price) > Number(item.unit_price) && (
                          <span className="text-xs text-slate-400 line-through">{formatINR(item.price)}</span>
                        )}
                        <span className="text-xs text-slate-400">• {item.stock_quantity} in stock</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Quantity Control */}
                      <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-slate-600 hover:text-indigo-600 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 font-bold text-sm text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_quantity}
                          className="p-2 text-slate-600 hover:text-indigo-600 disabled:opacity-35 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[76px]">
                        <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {formatINR(item.subtotal)}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Shop Order Subtotal</span>
                <span className="font-extrabold text-slate-900">{formatINR(group.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs sticky top-22 space-y-5">
          <h2 className="text-lg font-extrabold text-slate-900">Checkout Summary</h2>

          <div className="space-y-2.5 text-sm">
            {cart.shop_groups.map((g) => (
              <div key={g.shop_id} className="flex items-center justify-between text-slate-600">
                <span className="truncate pr-2">{g.shop_name}</span>
                <span className="font-semibold text-slate-900 shrink-0">{formatINR(g.subtotal)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100">
              <span>Campus Pickup Fee</span>
              <span className="font-bold text-emerald-600">FREE</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-base">Grand Total</span>
            <span className="font-extrabold text-2xl text-indigo-600">{formatINR(cart.grand_total)}</span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            to="/products"
            className="block text-center text-xs font-semibold text-slate-500 hover:text-indigo-600"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
