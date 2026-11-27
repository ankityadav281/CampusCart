import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { isCustomer, isAuthenticated } = useAuth();
  return (
    <footer className="bg-[#0F172A] text-slate-300 mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-display font-extrabold text-xl text-white">
                Campus<span className="text-indigo-400">Cart</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              The centralized multi-vendor e-commerce marketplace connecting students and staff with every verified shop on campus.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shops" className="hover:text-indigo-400 transition-colors">All Campus Shops</Link></li>
              <li><Link to="/products" className="hover:text-indigo-400 transition-colors">Browse Products</Link></li>
              <li><Link to="/products?on_sale=true" className="hover:text-indigo-400 transition-colors">Special Offers & Deals</Link></li>
              <li><Link to="/cart" className="hover:text-indigo-400 transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Accounts */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Account & Vendors</h4>
            <ul className="space-y-2 text-sm">
              {!isCustomer && !isAuthenticated && (
                <li>
                  <Link to="/become-shopkeeper" className="text-amber-400 font-bold hover:text-amber-300 flex items-center gap-1.5">
                    ★ Become a Shopkeeper
                  </Link>
                </li>
              )}
              <li><Link to="/my-orders" className="hover:text-indigo-400 transition-colors">Track My Orders</Link></li>
              <li><Link to="/profile" className="hover:text-indigo-400 transition-colors">Manage Profile</Link></li>
              {!isAuthenticated && (
                <>
                  <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Student Registration</Link></li>
                  <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Shop Manager / Admin Login</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Campus Contact */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Campus Helpdesk</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Student Union Building, Main University Campus</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>support@campuscart.edu</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>+91 98765 00001 (8 AM – 9 PM)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CampusCart – University Multi-Vendor Marketplace. All rights reserved.</p>
          <p>Order online • Skip campus queues • Collect directly at your shop pickup counter</p>
        </div>
      </div>
    </footer>
  );
}
