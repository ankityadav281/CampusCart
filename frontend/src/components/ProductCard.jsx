import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Store, Check } from 'lucide-react';
import { formatINR } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.in_stock || adding) return;
    setAdding(true);
    const res = await addToCart(product.id, 1);
    setAdding(false);
    if (res.unauthenticated) {
      navigate('/login');
      return;
    }
    if (res.ok) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-xl hover:shadow-indigo-950/5 transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-400 font-bold text-2xl">
            {product.name?.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Top Left Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-sm w-fit">
              Featured
            </span>
          )}
          {product.discount_percent > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-sm w-fit">
              -{product.discount_percent}%
            </span>
          )}
        </div>

        {/* Stock Badge Bottom Right */}
        <div className="absolute bottom-2.5 right-2.5">
          {!product.in_stock ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/85 text-white backdrop-blur-sm">
              Out of Stock
            </span>
          ) : product.is_low_stock ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/95 text-white backdrop-blur-sm">
              Only {product.stock_quantity} left
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-slate-700 backdrop-blur-sm shadow-sm">
              In Stock ({product.stock_quantity})
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          <span className="inline-flex items-center gap-1 truncate font-medium text-indigo-600">
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{product.shop_name}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium shrink-0">
            {product.category_name}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5 text-xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-slate-800">
            {product.average_rating > 0 ? product.average_rating.toFixed(1) : 'New'}
          </span>
          {product.review_count > 0 && (
            <span className="text-slate-400">({product.review_count})</span>
          )}
        </div>

        {/* Price + Action */}
        <div className="mt-auto pt-3.5 flex items-center justify-between gap-2 border-t border-slate-100">
          <div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 leading-none">
              {formatINR(product.effective_price)}
            </div>
            {product.discount_percent > 0 && (
              <div className="text-xs text-slate-400 line-through mt-0.5">
                {formatINR(product.price)}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.in_stock || adding}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !product.in_stock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                {adding ? 'Adding...' : 'Add'}
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
