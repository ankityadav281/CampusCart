export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

export function ShopCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
      <div className="h-32 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-4/5" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl" />
      ))}
    </div>
  );
}
