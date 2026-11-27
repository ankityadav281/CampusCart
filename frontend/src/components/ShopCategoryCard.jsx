import { Link } from 'react-router-dom';
import { ArrowRight, Store } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

export default function ShopCategoryCard({ category }) {
  const shopCount = category.shop_count ?? category.shops?.length ?? 0;
  const types = category.shop_types || [];

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-950/5 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Category Header / Banner */}
      <div className="relative h-36 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 overflow-hidden">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <CategoryIcon name={category.name} icon={category.icon} className="w-20 h-20 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/30 to-transparent" />

        {/* Icon Floating Badge */}
        <div className="absolute bottom-3 left-4 w-12 h-12 rounded-xl bg-white text-blue-600 shadow-md flex items-center justify-center border-2 border-white/80">
          <CategoryIcon name={category.name} icon={category.icon} className="w-6 h-6 text-blue-600" />
        </div>

        {/* Available Shops Count Pill */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-xs">
            <Store className="w-3.5 h-3.5 text-blue-600" />
            {shopCount} {shopCount === 1 ? 'Shop' : 'Shops'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {category.name}
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 line-clamp-2 flex-1 leading-relaxed">
          {category.description || 'Discover verified university campus stores in this category.'}
        </p>

        {/* Shop Types Pills Preview */}
        {types.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
            {types.slice(0, 3).map((st) => (
              <span
                key={st.id || st.slug}
                className="px-2 py-0.5 rounded-md bg-blue-50/70 text-blue-800 text-[11px] font-medium border border-blue-100/60"
              >
                {st.name}
              </span>
            ))}
            {types.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold">
                +{types.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Action Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <Link
            to={`/shop-categories/${category.id}`}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform"
          >
            Explore Category Shops
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
