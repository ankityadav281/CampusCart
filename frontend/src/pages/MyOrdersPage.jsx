import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Package, Store, XCircle } from 'lucide-react';
import { formatINR, getErrorMessage, orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadge';
import OrderTimeline from '../components/OrderTimeline';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeletons';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function MyOrdersPage() {
  const location = useLocation();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const newGroup = location.state?.newOrderGroup;

  const loadOrders = async (statusKey = statusFilter) => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getMyOrders(statusKey !== 'ALL' ? { status: statusKey } : {});
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(statusFilter);
  }, [statusFilter]);

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Reason for cancelling this shop order (optional):', 'Changed my mind');
    if (reason === null) return;
    setCancellingId(orderId);
    try {
      await orderAPI.cancelOrder(orderId, reason || 'Cancelled by customer');
      toast.success('Order cancelled and product stock restored.');
      loadOrders(statusFilter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel order.'));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Campus Orders</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track live order preparation status across every campus shop and collect when ready.
        </p>
      </div>

      {/* Fresh Checkout Banner */}
      {newGroup && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-950">
            <p className="font-extrabold text-base">
              Checkout Confirmed! ({newGroup.group_code})
            </p>
            <p className="mt-0.5 text-emerald-800">
              Your cart was automatically split into <strong>{newGroup.shop_count} shop order(s)</strong> totaling{' '}
              <strong>{formatINR(newGroup.total_amount)}</strong>. Each shop owner has been notified.
            </p>
          </div>
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description="Place your first campus pickup order and track every step live right here."
          action={
            <Link to="/products" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Top Meta Row */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-extrabold text-slate-900 text-sm">{order.order_number}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold">
                    Group: {order.order_group_code}
                  </span>
                  <OrderStatusBadge status={order.order_status} />
                  <PaymentStatusBadge status={order.payment_status} />
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(order.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Shop & Pickup Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Campus Shop</p>
                    <Link
                      to={`/shops/${order.shop_id}`}
                      className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1.5 mt-0.5"
                    >
                      <Store className="w-4 h-4" />
                      {order.shop_name}
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {order.shop_location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pickup Slot</p>
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      {order.pickup_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{order.payment_method_display}</p>
                    <p className="text-lg font-extrabold text-slate-900">{formatINR(order.total_amount)}</p>
                  </div>
                </div>

                {/* Visual Order Progress Timeline */}
                <OrderTimeline status={order.order_status} statusNote={order.status_note} />

                {/* Ordered Items */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-200/70">
                  {order.items.map((item) => (
                    <div key={item.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-semibold text-slate-800 truncate">{item.product_name_snapshot}</span>
                        <span className="text-xs text-slate-500 shrink-0">
                          {formatINR(item.price_snapshot)} × {item.quantity}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">{formatINR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {order.can_customer_cancel && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {cancellingId === order.id ? 'Cancelling...' : 'Cancel Shop Order'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
