import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isShopOwner, isCustomer, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setMobileOpen(false);
  };

  const handleLogout = () => {
    const isShop = isShopOwner;
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    if (isShop) {
      navigate('/become-shopkeeper', { replace: true });
    } else {
      navigate('/');
    }
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${
      isActive ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                Campus<span className="text-blue-600">Cart</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                University Marketplace
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campus shops, notebooks, snacks, electronics..."
                className="w-full pl-10 pr-20 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop Navigation & Actions */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5 whitespace-nowrap">
            <nav className="flex items-center gap-4 lg:gap-5 whitespace-nowrap">
              <NavLink to="/shops" className={navLinkClass}>
                Shops
              </NavLink>
              <NavLink to="/products" className={navLinkClass}>
                Products
              </NavLink>

              {/* Direct "Become a Shopkeeper" Link on Navbar - Only visible to unauthenticated guests */}
              {!isAuthenticated && (
                <NavLink
                  to="/become-shopkeeper"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 border border-blue-200'
                        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Become a Shopkeeper</span>
                </NavLink>
              )}

              {isAuthenticated && (
                <NavLink to="/my-orders" className={navLinkClass}>
                  My Orders
                </NavLink>
              )}
            </nav>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              {isShopOwner && (
                <Link
                  to="/shop-dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
                >
                  <Store className="w-4 h-4" />
                  Shop Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin-dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-blue-700 text-xs font-bold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}

              <NotificationBell />

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.total_items > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {cart.total_items}
                  </span>
                )}
              </Link>

              {/* Flipkart-Style Account / Login Trigger with Popover Dropdown */}
              <div className="relative" ref={dropdownRef}>
                {isAuthenticated ? (
                  /* Authenticated User Button */
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {(user.full_name || user.username).slice(0, 1).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 max-w-[100px] truncate">
                      {user.full_name?.split(' ')[0] || user.username}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                ) : (
                  /* Guest User "Login" Trigger (Flipkart-Style) */
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-800 font-bold text-sm bg-white transition-all cursor-pointer shadow-2xs"
                  >
                    <User className="w-4 h-4 text-slate-600" />
                    <span>Login</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}

                {/* Dropdown Menu (Flipkart-Inspired) */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {isAuthenticated ? (
                      /* Authenticated Dropdown Content */
                      <>
                        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            My Profile
                          </Link>

                          <Link
                            to="/my-orders"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          >
                            <Package className="w-4 h-4 text-slate-400" />
                            Orders
                          </Link>

                          {isShopOwner && (
                            <Link
                              to="/shop-dashboard"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-semibold"
                            >
                              <LayoutDashboard className="w-4 h-4 text-blue-500" />
                              Shop Dashboard
                            </Link>
                          )}

                          {isAdmin && (
                            <Link
                              to="/admin-dashboard"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-semibold"
                            >
                              <ShieldCheck className="w-4 h-4 text-blue-500" />
                              Admin Dashboard
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-1 mt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 cursor-pointer font-semibold transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Guest Dropdown Content (Exact Flipkart Experience) */
                      <>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                          <span className="text-xs text-slate-600 font-medium">New customer?</span>
                          <Link
                            to="/register"
                            onClick={() => setDropdownOpen(false)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            Sign Up
                          </Link>
                        </div>

                        <div className="py-1">
                          {/* Become a Shopkeeper prominently featured */}
                          <Link
                            to="/become-shopkeeper"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Store className="w-4 h-4 text-blue-600" />
                              <span>Become a Shopkeeper</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-orange-100 text-orange-800 uppercase">
                              Sell
                            </span>
                          </Link>

                          <Link
                            to="/become-shopkeeper"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4 text-slate-400" />
                            Campus 24x7 Help
                          </Link>
                        </div>

                        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                          <Link
                            to="/login"
                            onClick={() => setDropdownOpen(false)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            Sign In to Account
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <NotificationBell />
            <Link to="/cart" className="relative p-2 text-slate-700">
              <ShoppingCart className="w-5 h-5" />
              {cart.total_items > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {cart.total_items}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or shops..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm outline-none focus:bg-white focus:border-blue-500"
            />
          </form>

          <div className="flex flex-col gap-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">
              Home
            </Link>
            <Link to="/shops" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">
              All Shops
            </Link>
            <Link to="/products" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">
              All Products
            </Link>

            {/* Mobile "Become a Shopkeeper" - Only visible to unauthenticated guests */}
            {!isAuthenticated && (
              <Link
                to="/become-shopkeeper"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-blue-700 bg-blue-50/70 border border-blue-100"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Become a Shopkeeper</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-orange-100 text-orange-900 uppercase">
                  Sell
                </span>
              </Link>
            )}

            {isAuthenticated && (
              <>
                <Link to="/my-orders" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">
                  My Orders
                </Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">
                  Profile
                </Link>
              </>
            )}
            {isShopOwner && (
              <Link to="/shop-dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl font-bold text-blue-600 bg-blue-50">
                Shop Owner Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin-dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-xl font-bold text-white bg-slate-900">
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 font-semibold text-sm cursor-pointer"
              >
                Sign Out ({user.username})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center rounded-xl border border-slate-200 font-semibold text-sm text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
