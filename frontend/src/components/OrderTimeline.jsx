import { Check, Clock, Package, ShoppingBag, Sparkles, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'PENDING', label: 'Pending', icon: Clock },
  { key: 'ACCEPTED', label: 'Accepted', icon: Check },
  { key: 'PREPARING', label: 'Preparing', icon: Sparkles },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: Package },
  { key: 'COMPLETED', label: 'Completed', icon: ShoppingBag },
];

export default function OrderTimeline({ status, statusNote }) {
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold">
            Order {status === 'CANCELLED' ? 'Cancelled' : 'Rejected by Shop'}
          </span>
          {statusNote && <span className="text-rose-700"> — {statusNote}</span>}
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
          style={{
            width: currentIdx <= 0 ? '0%' : `${(currentIdx / (STEPS.length - 1)) * 92}%`,
          }}
        />
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100 shadow-sm'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`mt-1.5 text-[11px] sm:text-xs font-medium text-center leading-tight ${
                  isCurrent
                    ? 'text-blue-700 font-bold'
                    : isCompleted
                    ? 'text-slate-800 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
