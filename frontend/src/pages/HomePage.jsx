import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Percent,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { marketplaceAPI, shopCategoryAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import ShopCategoryCard from '../components/ShopCategoryCard';
import { ProductCardSkeleton, ShopCardSkeleton } from '../components/Skeletons';

export default function HomePage() {
  const [summary, setSummary] = useState({ active_products: 0, approved_shops: 0, campus_members: 0 });
  const [categories, setCategories] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [sumRes, catRes, shopCatRes, shopRes, popRes, recRes, offRes] = await Promise.all([
          marketplaceAPI.getSummary(),
          marketplaceAPI.getCategories(),
          shopCategoryAPI.list(),
          marketplaceAPI.getShops(),
          marketplaceAPI.getProducts({ sort: 'popular', limit: 8 }),
          marketplaceAPI.getProducts({ sort: 'newest', limit: 8 }),
          marketplaceAPI.getProducts({ on_sale: 'true', limit: 4 }),
        ]);
        if (!active) return;
        setSummary(sumRes.data);
        setCategories(catRes.data);
        setShopCategories(shopCatRes.data || []);
        setShops(shopRes.data.slice(0, 6));
        setPopularProducts(popRes.data);
        setRecentProducts(recRes.data);
        setOfferProducts(offRes.data);
      } catch {
        // handled gracefully by empty states
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-14 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 text-white">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-24 right-0 w-[30rem] h-[30rem] rounded-full bg-sky-300 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Centralized Multi-Vendor Campus Marketplace
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.08]">
                Everything on Campus,{' '}
                <span className="text-amber-300">Just a Click Away.</span>
              </h1>

              <p className="text-base sm:text-lg text-indigo-100 max-w-xl leading-relaxed">
                Shop stationery, hot canteen meals, electronics, bakery treats, hostel groceries,
                and printing services across every university shop—check live stock and pick up
                without waiting in queues.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm sm:text-base shadow-lg shadow-indigo-950/20 transition-all"
                >
                  Start Shopping
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/shops"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white font-bold text-sm sm:text-base transition-all"
                >
                  <Store className="w-4 h-4" />
                  Explore Campus Shops
                </Link>
              </div>
            </div>

            {/* Right Elevated Stat Cards (inspired by modern campus marketplace reference) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-xl shadow-indigo-950/20">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {summary.active_products || '45+'}
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Active Products</p>
              </div>

              <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-xl shadow-indigo-950/20">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Store className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {summary.approved_shops || '7'}
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Verified Shops</p>
              </div>

              <div className="col-span-2 bg-white text-slate-900 rounded-2xl p-5 shadow-xl shadow-indigo-950/20 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Multi-Shop Cart & Smart Pickup</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                    Add items from multiple campus shops in one checkout—we split orders automatically so each shop prepares your pickup independently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Dedicated Shop Categories Section */}
        {shopCategories.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Campus Shop Categories</h2>
                  <p className="text-sm text-slate-500">
                    Explore verified university stores by primary category and specialized shop types
                  </p>
                </div>
              </div>
              <Link
                to="/shops"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 self-start sm:self-auto"
              >
                Browse all shops <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shopCategories.map((sc) => (
                <ShopCategoryCard key={sc.id} category={sc} />
              ))}
            </div>
          </section>
        )}

        {/* Product Categories */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Shop by Category</h2>
              <p className="text-sm text-slate-500 mt-0.5">Quick access to every campus essential</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/60 hover:text-indigo-700 text-sm font-semibold text-slate-700 shadow-xs transition-all"
              >
                <span>{cat.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-bold">
                  {cat.product_count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Products */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Popular Products</h2>
                <p className="text-sm text-slate-500">Top-ordered items across university shops</p>
              </div>
            </div>
            <Link
              to="/products?sort=popular"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : popularProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Special Offers & Discounts */}
        {offerProducts.length > 0 && (
          <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Campus Special Offers</h2>
                  <p className="text-sm text-indigo-200">Exclusive student discounts active right now</p>
                </div>
              </div>
              <Link
                to="/products?on_sale=true"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold text-white w-fit transition-colors"
              >
                View All Deals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {offerProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Featured University Shops */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Featured Campus Shops</h2>
                <p className="text-sm text-slate-500">Approved stores located across the university campus</p>
              </div>
            </div>
            <Link
              to="/shops"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              All shops <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <ShopCardSkeleton key={i} />)
              : shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
          </div>
        </section>

        {/* Recently Added Products */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Recently Added Products</h2>
              <p className="text-sm text-slate-500">Fresh arrivals and newly stocked campus items</p>
            </div>
            <Link
              to="/products?sort=newest"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : recentProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Campus Vendor CTA */}
        <section className="rounded-3xl bg-indigo-50 border border-indigo-100 p-7 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <Users className="w-4 h-4" />
              Run a Shop on Campus?
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Bring Your University Shop Online with CampusCart
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Manage inventory in real time, receive pickup orders directly from students and faculty, and track daily sales analytics from your dedicated shop dashboard.
            </p>
          </div>
          <Link
            to="/become-shopkeeper"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-colors"
          >
            Become a Shopkeeper
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
