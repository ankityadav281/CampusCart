import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Store,
} from 'lucide-react';
import { marketplaceAPI, shopCategoryAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import ShopCard from '../components/ShopCard';
import CategoryIcon from '../components/CategoryIcon';
import { ShopCardSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

export default function ShopCategoryDetailsPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('name'); // Alphabetical by default as requested
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingShops, setLoadingShops] = useState(true);

  const debouncedSearch = useDebounce(search, 250);

  // Load category information
  useEffect(() => {
    let active = true;
    setLoadingCategory(true);
    shopCategoryAPI
      .get(id)
      .then((res) => {
        if (active) setCategory(res.data);
      })
      .catch(() => {
        if (active) setCategory(null);
      })
      .finally(() => {
        if (active) setLoadingCategory(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Load shops filtered dynamically by this category and optional shop_type
  useEffect(() => {
    let active = true;
    setLoadingShops(true);

    const params = {
      category: id,
      search: debouncedSearch || undefined,
      ordering: ordering || undefined,
    };

    if (selectedType !== 'ALL') {
      params.shop_type = selectedType;
    }

    marketplaceAPI
      .getShops(params)
      .then((res) => {
        if (active) setShops(res.data);
      })
      .catch(() => {
        if (active) setShops([]);
      })
      .finally(() => {
        if (active) setLoadingShops(false);
      });

    return () => {
      active = false;
    };
  }, [id, selectedType, debouncedSearch, ordering]);

  if (loadingCategory) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={Store}
          title="Category Not Found"
          description="The shop category you are looking for may have been deactivated or does not exist."
          action={
            <Link
              to="/shops"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Shops
            </Link>
          }
        />
      </div>
    );
  }

  const shopTypes = category.shop_types || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/shops" className="hover:text-indigo-600 transition-colors">
          Campus Shops
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">{category.name}</span>
      </nav>

      {/* Category Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
              <CategoryIcon name={category.name} icon={category.icon} className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-300" />
            </div>
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                University Campus Category
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {category.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {category.description || 'Explore all verified university vendors and service providers in this category.'}
              </p>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div className="text-left md:text-right">
              <div className="text-3xl font-extrabold text-amber-300">
                {category.shop_count ?? shops.length}
              </div>
              <div className="text-xs text-slate-400 font-medium">Approved Campus Stores</div>
            </div>
            <Link
              to="/shops"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Categories
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Controls Bar: Shop Types, Search & Sorting */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        {/* Row 1: Search & Alphabetical Sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search within ${category.name} (name, location)...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="name">Alphabetical (A to Z)</option>
                <option value="-name">Alphabetical (Z to A)</option>
                <option value="-created_at">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Sub-category / Shop Types Pill Filter */}
        {shopTypes.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              Filter by Shop Type:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedType === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Shop Types ({shopTypes.length})
              </button>
              {shopTypes.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedType(String(st.id))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedType === String(st.id)
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shops Grid */}
      {loadingShops ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <EmptyState
          icon={Store}
          title={`No ${category.name} shops found`}
          description={
            search || selectedType !== 'ALL'
              ? 'Try resetting the search or selecting a different shop type.'
              : 'There are currently no active approved stores in this category.'
          }
          action={
            (search || selectedType !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedType('ALL');
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow transition-colors cursor-pointer"
              >
                Reset Category Filters
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>
              Showing {shops.length} {shops.length === 1 ? 'store' : 'stores'} in {category.name}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
