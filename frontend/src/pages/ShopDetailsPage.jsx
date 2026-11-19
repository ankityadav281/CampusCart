import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Mail, MapPin, Phone, Search, Star, Store } from 'lucide-react';
import { formatTime12, marketplaceAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

export default function ShopDetailsPage() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [loadingShop, setLoadingShop] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    setLoadingShop(true);
    marketplaceAPI
      .getShopDetail(id)
      .then((res) => setShop(res.data))
      .catch(() => setShop(null))
      .finally(() => setLoadingShop(false));
  }, [id]);

  useEffect(() => {
    setLoadingProducts(true);
    marketplaceAPI
      .getProducts({
        shop: id,
        search: debouncedSearch || undefined,
        available_only: availableOnly ? 'true' : undefined,
        sort,
      })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [id, debouncedSearch, availableOnly, sort]);

  if (loadingShop) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-56 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={Store}
          title="Shop Not Found"
          description="This shop may not be approved yet or is no longer active."
          action={
            <Link to="/shops" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
              Back to All Shops
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/shops"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Shops
      </Link>

      {/* Shop Banner & Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="relative h-44 sm:h-56 bg-gradient-to-r from-indigo-700 to-blue-600">
          {shop.banner_url && (
            <img src={shop.banner_url} alt={shop.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {shop.is_open_now === true && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Open Now
              </span>
            )}
            {shop.is_open_now === false && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/85 text-slate-200">
                Closed Right Now
              </span>
            )}
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-7">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 relative z-10">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-indigo-600 shrink-0">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-extrabold">
                  {shop.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {shop.category_name || (typeof shop.category === 'object' ? shop.category?.name : shop.category)}
                </span>
                {shop.shop_type_name && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">
                    {shop.shop_type_name}
                  </span>
                )}
                {shop.average_rating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {shop.average_rating.toFixed(1)} rating
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{shop.name}</h1>
              <p className="text-sm text-slate-600 mt-1.5 max-w-3xl">{shop.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Campus Location</p>
                <p className="font-semibold text-slate-800">{shop.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Opening Hours</p>
                <p className="font-semibold text-slate-800">
                  {shop.opening_time && shop.closing_time
                    ? `${formatTime12(shop.opening_time)} – ${formatTime12(shop.closing_time)}`
                    : 'Campus Working Hours'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Contact</p>
                <p className="font-semibold text-slate-800">{shop.contact_number || 'Available at counter'}</p>
                {shop.contact_email && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {shop.contact_email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Controls Within Shop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search products in ${shop.name}...`}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            In stock only
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Shop Products */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">
          Shop Catalog ({products.length})
        </h2>
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products match your search"
            description="Try a different keyword or turn off the in-stock filter."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
