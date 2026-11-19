import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Filter, Search, Store } from 'lucide-react';
import { marketplaceAPI, shopCategoryAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import ShopCard from '../components/ShopCard';
import CategoryIcon from '../components/CategoryIcon';
import { ShopCardSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

export default function ShopsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialType = searchParams.get('shop_type') || 'All';

  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedType, setSelectedType] = useState(initialType);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [ordering, setOrdering] = useState('name');
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  // Load all active main shop categories
  useEffect(() => {
    shopCategoryAPI
      .list()
      .then((res) => {
        setCategories(res.data || []);
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  // Sync state if URL query params change
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== selectedCategory) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // When selectedCategory changes, reset selectedType to 'All' unless matching
  const handleCategoryChange = (catIdentifier) => {
    setSelectedCategory(catIdentifier);
    setSelectedType('All');
    const newParams = new URLSearchParams(searchParams);
    if (catIdentifier === 'All') {
      newParams.delete('category');
      newParams.delete('shop_type');
    } else {
      newParams.set('category', catIdentifier);
      newParams.delete('shop_type');
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleTypeChange = (typeIdentifier) => {
    setSelectedType(typeIdentifier);
    const newParams = new URLSearchParams(searchParams);
    if (typeIdentifier === 'All') {
      newParams.delete('shop_type');
    } else {
      newParams.set('shop_type', typeIdentifier);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Find active category object for sub-types
  const activeCategoryObj =
    selectedCategory !== 'All'
      ? categories.find(
          (c) =>
            String(c.id) === String(selectedCategory) ||
            c.slug === selectedCategory ||
            c.name.toLowerCase() === selectedCategory.toLowerCase()
        )
      : null;

  const currentShopTypes = activeCategoryObj?.shop_types || [];

  // Fetch shops with dynamic category, shop_type, search, and ordering
  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = {
      search: debouncedSearch || undefined,
      ordering: ordering || undefined,
    };

    if (selectedCategory !== 'All') {
      params.category = selectedCategory;
    }

    if (selectedType !== 'All') {
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
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, selectedCategory, selectedType, ordering]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">All University Shops</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified campus stores, filter by primary category and specialized shop types, or locate by block.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shops or campus locations..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort:</span>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="name">A to Z</option>
              <option value="-name">Z to A</option>
              <option value="-created_at">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Category Filter Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Main Shop Categories
          </span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => handleCategoryChange('All')}
              className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              Clear Category Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('All')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>All Categories</span>
          </button>

          {categories.map((cat) => {
            const isSelected =
              selectedCategory === String(cat.id) ||
              selectedCategory === cat.slug ||
              selectedCategory.toLowerCase() === cat.name.toLowerCase();

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(String(cat.id))}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                <CategoryIcon name={cat.name} icon={cat.icon} className="w-4 h-4" />
                <span>{cat.name}</span>
                {cat.shop_count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.shop_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sub-Category / Shop Types for Selected Main Category */}
      {selectedCategory !== 'All' && currentShopTypes.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            {activeCategoryObj?.name} Shop Types:
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTypeChange('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'All'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              All {activeCategoryObj?.name} ({currentShopTypes.length})
            </button>

            {currentShopTypes.map((st) => {
              const isSelected = selectedType === String(st.id) || selectedType === st.name;
              return (
                <button
                  key={st.id}
                  onClick={() => handleTypeChange(String(st.id))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {st.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shops Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No matching campus shops found"
          description={
            search || selectedCategory !== 'All' || selectedType !== 'All'
              ? 'No stores match your chosen filters. Try selecting a different category or resetting filters.'
              : 'There are currently no approved campus stores.'
          }
          action={
            (search || selectedCategory !== 'All' || selectedType !== 'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  handleCategoryChange('All');
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors shadow"
              >
                Reset All Filters
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>
              Showing {shops.length} {shops.length === 1 ? 'store' : 'stores'}
              {activeCategoryObj ? ` in ${activeCategoryObj.name}` : ''}
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
