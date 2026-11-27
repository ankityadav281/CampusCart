import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ShopkeeperNavbar() {
  const { user, isAuthenticated, isAdmin, isShopOwner, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate('/become-shopkeeper', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Seller Hub Badge */}
          <Link to="/become-shopkeeper" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-950/20">
              <Store className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl text-slate-900 tracking-tight whitespace-nowrap">
                Campus<span className="text-blue-600">Cart</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wider whitespace-nowrap">
                Seller Hub
              </span>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Link
              to="/shops"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap px-2"
            >
              Campus Stores
            </Link>

            {/* Shopkeeper Auth Controls */}
            {isAuthenticated ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                    {user.username?.[0] || 'S'}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                      {user.full_name || user.username}
                    </div>
                    <div className="text-[10px] font-semibold text-blue-600 mt-0.5">
                      {isShopOwner ? 'Shopkeeper' : isAdmin ? 'Admin' : 'Campus Member'}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Authenticated Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.full_name || user.username}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                        {user.role?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="py-1">
                      {isShopOwner && (
                        <>
                          <Link
                            to="/shop-dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            Shop Owner Dashboard
                          </Link>
                          <Link
                            to="/become-shopkeeper"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          >
                            <Store className="w-4 h-4 text-slate-400" />
                            Shopkeeper Onboarding
                          </Link>
                        </>
                      )}

                      {!isShopOwner && !isAdmin && (
                        <Link
                          to="/become-shopkeeper"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Store className="w-4 h-4 text-blue-600" />
                          Apply for Campus Shop
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin-dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 cursor-pointer font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Action Buttons for Shopkeepers - Direct links without dropdown */
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/shopkeeper/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-800 font-bold text-xs sm:text-sm bg-white transition-all shadow-2xs whitespace-nowrap shrink-0"
                >
                  <Store className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="whitespace-nowrap">Shopkeeper Login</span>
                </Link>

                <Link
                  to="/shopkeeper/register"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors whitespace-nowrap inline-flex items-center justify-center shrink-0"
                >
                  Register Shop
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          <Link
            to="/shops"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
          >
            Campus Stores
          </Link>

          {isAuthenticated ? (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="px-3 py-1 text-xs text-slate-500">
                Signed in as <strong className="text-slate-800">{user.username}</strong>
              </div>
              {isShopOwner && (
                <Link
                  to="/shop-dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-xl font-bold text-blue-600 bg-blue-50"
                >
                  Shop Owner Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin-dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-xl font-bold text-white bg-slate-900"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-rose-600 font-semibold text-sm hover:bg-rose-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Link
                to="/shopkeeper/login"
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-center rounded-xl border border-slate-200 font-semibold text-xs text-slate-700"
              >
                Shopkeeper Login
              </Link>
              <Link
                to="/shopkeeper/register"
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-center rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-xs text-white"
              >
                Register Shop
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
