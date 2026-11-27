import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Package, Star } from 'lucide-react';
import { formatTime12 } from '../services/api';

export default function ShopCard({ shop }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-lg hover:shadow-indigo-950/5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 overflow-hidden">
        {shop.banner_url && (
          <img
            src={shop.banner_url}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Open / Closed Status */}
        <div className="absolute top-3 right-3">
          {shop.is_open_now === true ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Open Now
            </span>
          ) : shop.is_open_now === false ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-slate-200 shadow-xs">
              Closed
            </span>
          ) : null}
        </div>

        {/* Category & Type Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-slate-800 shadow-xs backdrop-blur-xs">
          {shop.shop_type_name || shop.category_name || (typeof shop.category === 'object' ? shop.category?.name : shop.category)}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 relative">
        {/* Logo */}
        <div className="-mt-11 mb-3 flex items-end justify-between">
          <div className="w-14 h-14 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-indigo-600 shrink-0">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                {shop.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          {shop.average_rating > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {shop.average_rating.toFixed(1)}
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {shop.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{shop.description}</p>

        <div className="mt-4 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">{shop.location}</span>
          </div>
          {shop.opening_time && shop.closing_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                {formatTime12(shop.opening_time)} – {formatTime12(shop.closing_time)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{shop.product_count} products available</span>
          </div>
        </div>

        <Link
          to={`/shops/${shop.id}`}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
        >
          Visit Shop
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
