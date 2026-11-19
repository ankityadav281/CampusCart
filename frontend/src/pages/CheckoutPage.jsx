import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Store,
  User,
} from 'lucide-react';
import { formatINR, getErrorMessage, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, fetchCart, resetCartLocal } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [pickupSlot, setPickupSlot] = useState('');
  const [shopPickupSlots, setShopPickupSlots] = useState({});
  const [customPerShop, setCustomPerShop] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_PICKUP');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    orderAPI
      .getPickupSlots()
      .then((res) => {
        const list = res.data.slots || [];
        setSlots(list);
        if (list.length > 0) setPickupSlot(list[0]);
      })
      .catch(() => {
        const fallback = ['Today, 12:30 PM - 02:00 PM', 'Today, 04:00 PM - 06:00 PM', 'Tomorrow, 10:00 AM - 12:00 PM'];
        setSlots(fallback);
        setPickupSlot(fallback[0]);
      });
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="No items ready for checkout"
          description="Add products from campus shops to your cart before checking out."
          action={
            <Link to="/products" className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">
              Browse Products
            </Link>
          }
        />
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!pickupSlot && !customPerShop) {
      toast.error('Please select a pickup time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        payment_method: paymentMethod,
        pickup_time: pickupSlot,
        notes,
      };
      if (customPerShop) {
        const mapped = {};
        cart.shop_groups.forEach((g) => {
          mapped[String(g.shop_id)] = shopPickupSlots[g.shop_id] || pickupSlot;
        });
        payload.shop_pickup_times = mapped;
      }

      const { data } = await orderAPI.checkout(payload);
      resetCartLocal();
      toast.success(data.message || 'Order placed successfully!');
      navigate('/my-orders', { state: { newOrderGroup: data.order_group } });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Checkout failed. Please check stock availability.'));
      fetchCart();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Campus Pickup Checkout</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your customer info, select pickup slots, and confirm your order across {cart.shop_count} shop(s).
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Steps */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Customer Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-indigo-600" />
              1. Student / Staff Pickup Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase">Full Name</p>
                <p className="font-bold text-slate-900 mt-0.5">{user?.full_name}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase">Email</p>
                <p className="font-bold text-slate-900 mt-0.5">{user?.email}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase">Phone Number</p>
                <p className="font-bold text-slate-900 mt-0.5">{user?.phone || 'Not provided (update in Profile)'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase">University ID</p>
                <p className="font-bold text-slate-900 mt-0.5">{user?.student_id || 'Standard Campus Account'}</p>
              </div>
            </div>
          </div>

          {/* 2. Pickup Slot Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-indigo-600" />
                2. Preferred Campus Pickup Slot
              </h2>
              {cart.shop_count > 1 && (
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customPerShop}
                    onChange={(e) => setCustomPerShop(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  Choose different slot per shop
                </label>
              )}
            </div>

            {!customPerShop ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Pickup Window
                </label>
                <select
                  required
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm font-semibold"
                >
                  {slots.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.shop_groups.map((g) => (
                  <div key={g.shop_id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <p className="text-sm font-bold text-slate-900">{g.shop_name}</p>
                    <select
                      value={shopPickupSlots[g.shop_id] || pickupSlot}
                      onChange={(e) =>
                        setShopPickupSlots((prev) => ({ ...prev, [g.shop_id]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium outline-none focus:border-indigo-500"
                    >
                      {slots.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Pickup Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Less spicy, spiral bind with blue cover, call when ready..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              3. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === 'CASH_ON_PICKUP'
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="CASH_ON_PICKUP"
                  checked={paymentMethod === 'CASH_ON_PICKUP'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 text-indigo-600"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Cash on Pickup
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pay directly at each campus shop counter when collecting your order.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === 'UPI'
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 text-indigo-600"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    UPI Payment
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Scan shop UPI QR at pickup (online gateway integration ready).
                  </p>
                </div>
              </label>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>UPI Gateway Integration Point:</strong> Live online payment processing is not connected in this academic version. Your order will be recorded with <strong>Payment Status: Pending</strong> until confirmed by the shop owner via UPI QR at pickup.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Multi-Shop Order Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs sticky top-22 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Order Summary ({cart.shop_count} Shop {cart.shop_count === 1 ? 'Order' : 'Orders'})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each shop below receives an independent order for pickup fulfillment.
            </p>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {cart.shop_groups.map((group, idx) => (
              <div key={group.shop_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Shop Order #{idx + 1}
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">{formatINR(group.subtotal)}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-indigo-600" />
                  {group.shop_name}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {group.shop_location}
                </div>
                <div className="border-t border-slate-200 pt-2 space-y-1">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-slate-700">
                      <span className="truncate pr-2">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="font-semibold shrink-0">{formatINR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <span className="font-bold text-slate-900">Grand Total</span>
            <span className="text-2xl font-extrabold text-indigo-600">{formatINR(cart.grand_total)}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-5 h-5" />
            {submitting ? 'Placing Multi-Shop Order...' : 'Confirm & Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
