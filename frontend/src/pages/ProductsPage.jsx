import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { marketplaceAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [shop, setShop] = useState(searchParams.get('shop') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available_only') === 'true');
  const [onSale, setOnSale] = useState(searchParams.get('on_sale') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  const debouncedSearch = useDebounce(search, 280);
  const debouncedMin = useDebounce(minPrice, 350);
  const debouncedMax = useDebounce(maxPrice, 350);

  // Sync incoming URL changes (e.g. Navbar search)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlOnSale = searchParams.get('on_sale') === 'true';
    const urlSort = searchParams.get('sort') || 'newest';
    setSearch(urlSearch);
    setCategory(urlCategory);
    setOnSale(urlOnSale);
    setSort(urlSort);
  }, [searchParams]);

  useEffect(() => {
    marketplaceAPI
      .getCategories()
      .then((catRes) => setCategories(catRes.data))
      .catch(() => {});
  }, []);

  // Dynamically load shops matching the selected product category
  useEffect(() => {
    let active = true;
    marketplaceAPI
      .getShops(category ? { product_category: category } : undefined)
      .then((shopRes) => {
        if (!active) return;
        const list = shopRes.data || [];
        setShops(list);
        if (shop && !list.some((s) => String(s.id) === String(shop))) {
          setShop('');
        }
      })
      .catch(() => {
        if (active) setShops([]);
      });
    return () => {
      active = false;
    };
  }, [category]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketplaceAPI
      .getProducts({
        search: debouncedSearch || undefined,
        category: category || undefined,
        shop: shop || undefined,
        min_price: debouncedMin || undefined,
        max_price: debouncedMax || undefined,
        available_only: availableOnly ? 'true' : undefined,
        on_sale: onSale ? 'true' : undefined,
        sort,
      })
      .then((res) => {
        if (active) setProducts(res.data);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch, category, shop, debouncedMin, debouncedMax, availableOnly, onSale, sort]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setShop('');
    setMinPrice('');
    setMaxPrice('');
    setAvailableOnly(false);
    setOnSale(false);
    setSort('newest');
    setSearchParams({});
  };

  const FiltersPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          Filters
        </h3>
        <button
          onClick={clearFilters}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.product_count})
            </option>
          ))}
        </select>
      </div>

      {/* Shop */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Campus Shop
        </label>
        <select
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:bg-white focus:border-indigo-500"
        >
          <option value="">{category ? 'All Shops in Category' : 'All Approved Shops'}</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min ₹"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-indigo-500"
          />
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max ₹"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Availability & Offers */}
      <div className="space-y-3 pt-1">
        <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          In-stock products only
        </label>
        <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Discounted deals only
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-7">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-68 shrink-0">
          <div className="sticky top-22 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            {FiltersPanel}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-5">
          {/* Top Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, shops, or categories..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="newest">Sort: Newest</option>
                <option value="popular">Sort: Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900">{products.length}</strong> campus products
            </span>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your search keywords, price range, or category filter."
              action={
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Clear All Filters
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative ml-auto w-80 max-w-full bg-white h-full p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-900">Filter Products</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {FiltersPanel}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm"
            >
              Show {products.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
