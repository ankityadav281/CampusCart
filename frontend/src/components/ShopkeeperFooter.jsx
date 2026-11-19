import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Store, ArrowLeft, ShieldCheck, Clock, Percent } from 'lucide-react';

export default function ShopkeeperFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/become-shopkeeper" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-display font-extrabold text-xl text-white">
                Campus<span className="text-indigo-400">Cart</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700 uppercase">
                Seller Hub
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering campus merchants, cafeterias, bookstores, and kiosks with digital pre-orders, scheduled slot pickups, and live inventory.
            </p>
          </div>

          {/* Merchant Features */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Merchant Benefits</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                <span>0% Commission & Setup Fees</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Scheduled Counter Slot Pickups</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Verified Campus Administration</span>
              </li>
              <li className="pt-1">
                <Link to="/become-shopkeeper#faq" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                  Read Seller Guidelines &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Vendor Portals</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shopkeeper/login" className="hover:text-indigo-400 transition-colors">
                  Shopkeeper Sign In
                </Link>
              </li>
              <li>
                <Link to="/shopkeeper/register" className="hover:text-indigo-400 transition-colors">
                  Register as a Shopkeeper
                </Link>
              </li>
              <li>
                <Link to="/shop-dashboard" className="hover:text-indigo-400 transition-colors">
                  Shop Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/shops" className="hover:text-indigo-400 transition-colors">
                  Approved Campus Stores
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Merchant Helpdesk */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Seller Helpdesk</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Campus Commercial Office, Room 104, Admin Complex</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>vendors@campuscart.edu</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>+91 98765 00002 (Vendor Support)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} CampusCart Seller Hub. University multi-vendor e-commerce platform.</div>
          <div className="flex items-center gap-4">
            <Link to="/become-shopkeeper#faq" className="hover:text-slate-400">Merchant Terms</Link>
            <span>•</span>
            <Link to="/shops" className="hover:text-slate-400">Campus Stores</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
