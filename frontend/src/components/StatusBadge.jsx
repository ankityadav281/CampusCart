const ORDER_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-sky-50 text-sky-700 border-sky-200',
  PREPARING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  READY_FOR_PICKUP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-300',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const ORDER_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const PAYMENT_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
};

const APPROVAL_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  SUSPENDED: 'bg-slate-200 text-slate-700 border-slate-300',
};

export function OrderStatusBadge({ status }) {
  const style = ORDER_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = ORDER_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {label}
    </span>
  );
}

export function PaymentStatusBadge({ status }) {
  const style = PAYMENT_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {status}
    </span>
  );
}

export function ShopApprovalBadge({ status }) {
  const style = APPROVAL_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {status}
    </span>
  );
}
