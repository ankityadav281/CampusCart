import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ShopRegistrationWizard from '../components/ShopRegistrationWizard';

const BENEFITS = [
  {
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Zero Counter Queues',
    description: 'Students pre-order between lecture breaks. Prepare orders in advance and hand them over in seconds.',
  },
  {
    icon: Users,
    color: 'bg-indigo-50 text-indigo-600',
    title: '5,000+ Campus Reach',
    description: 'Instantly connect with every university student, hostel resident, faculty, and administrative staff member.',
  },
  {
    icon: Package,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Real-Time Inventory',
    description: 'Easily update item prices, adjust available stock, and mark products as available or sold out in one click.',
  },
  {
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-600',
    title: 'Sales & Revenue Insights',
    description: 'Track daily turnover, monitor peak order times, and identify your most popular campus products.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-purple-50 text-purple-600',
    title: 'Campus-Verified Trust',
    description: 'Every shop is formally approved by university administrators, giving customers 100% confidence.',
  },
  {
    icon: TrendingUp,
    color: 'bg-rose-50 text-rose-600',
    title: 'Student Entrepreneurs Welcome',
    description: 'Whether you run the central canteen, stationery shop, or a student project supply service, CampusCart is built for you.',
  },
];

const FAQS = [
  {
    q: 'Who can register as a shopkeeper on CampusCart?',
    a: 'Any university-approved store, cafeteria, stationery center, electronics repair stall, hostel mart, or student-led campus enterprise with a physical university campus location can apply.',
  },
  {
    q: 'How long does administrator approval take?',
    a: 'University administrators typically review and approve new campus shop submissions within 24 to 48 hours. You will receive an instant in-app notification once approved.',
  },
  {
    q: 'Can I choose my shop category and sub-types?',
    a: 'Yes! CampusCart features 8 primary categories (Food & Beverages, Stationery, Electronics, Lifestyle, etc.) with over 55 specialized shop types. You select your exact category and type during registration.',
  },
  {
    q: 'How do customers pick up their orders?',
    a: 'Customers select their preferred pickup time slot at checkout. Your shop receives the order, prepares the items, and marks it "Ready for Pickup". The customer visits your counter with their Order ID to collect.',
  },
];

export default function BecomeShopkeeperPage() {
  const { user, isAuthenticated, isCustomer, isShopOwner, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    if (isAuthenticated && (isCustomer || user?.role?.toUpperCase() === 'CUSTOMER')) {
      navigate('/', { replace: true });
    } else if (isShopOwner) {
      navigate('/shop-dashboard', { replace: true });
    }
  }, [isAuthenticated, isCustomer, user, isShopOwner, navigate]);

  const scrollToRegistration = () => {
    if (!isAuthenticated) {
      navigate('/shopkeeper/register');
      return;
    }
    const el = document.getElementById('shop-registration-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-indigo-400 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-violet-400 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-indigo-200">
                <Store className="w-4 h-4 text-amber-300" />
                CampusCart Vendor & Merchant Hub
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Become a Campus <span className="text-amber-300">Shopkeeper.</span>
              </h1>

              <p className="text-base sm:text-lg text-indigo-100 max-w-xl leading-relaxed">
                Bring your campus canteen, bookstore, printing kiosk, or store online. Receive orders before classes end, eliminate counter congestion, and grow your campus sales.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={scrollToRegistration}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
                >
                  <Store className="w-5 h-5" />
                  Register Your Shop
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/shopkeeper/login"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-sm sm:text-base transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Shopkeeper Sign In
                </Link>

                <Link
                  to="/shops"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/15 backdrop-blur-md text-slate-200 font-bold text-sm sm:text-base transition-all"
                >
                  Explore Current Campus Shops
                </Link>
              </div>
            </div>

            {/* Quick Metrics Card */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 text-white">
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-300">5,000+</div>
                <div className="text-sm font-bold text-slate-100 mt-1">Students & Faculty</div>
                <p className="text-xs text-indigo-200 mt-1">Directly reachable across campus hostels and departments</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 text-white">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-300">0%</div>
                <div className="text-sm font-bold text-slate-100 mt-1">Platform Setup Fee</div>
                <p className="text-xs text-indigo-200 mt-1">Free university digital commerce for approved campus stores</p>
              </div>

              <div className="col-span-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 text-white flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Smart Pickup Slot Management</h3>
                  <p className="text-xs sm:text-sm text-indigo-200 mt-0.5 leading-relaxed">
                    Say goodbye to chaotic 15-minute recess lines. Customers pick up their pre-packed bags when their slot arrives.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Why Partner with CampusCart */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Why Sell on CampusCart?</h2>
            <p className="text-sm sm:text-base text-slate-500">
              Designed specifically for university campus life, vendors, and student shoppers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-950/5 transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl ${b.color} flex items-center justify-center mb-4`}>
                  <b.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{b.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3 Simple Steps */}
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50/60 rounded-3xl p-8 sm:p-12 border border-indigo-100">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Simple Onboarding</span>
            <h2 className="text-3xl font-extrabold text-slate-900">How to Open Your Campus Store</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-900">Enter Details & Category</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Complete our step-by-step registration wizard. Pick your primary category (e.g. Food, Stationery, Electronics) and your specialized shop type.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-900">Admin Verification</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Campus administrators quickly review your store location and identity to maintain a safe and reliable marketplace for students.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-900">List Products & Start Selling</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Log into your dedicated Shop Dashboard to add items, upload photos, set discounts, and receive live pickup orders.
              </p>
            </div>
          </div>
        </section>

        {/* The Registration Section (Only when logged in) */}
        {isAuthenticated && (
          <section id="shop-registration-section" className="space-y-6 pt-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Application Form</span>
              <h2 className="text-3xl font-extrabold text-slate-900">Start Your Shopkeeper Application</h2>
              <p className="text-sm text-slate-500">
                Complete the guided steps below to submit your campus store for administrator approval.
              </p>
            </div>

            {isShopOwner ? (
              /* Already a Shop Owner */
              <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    You are already a registered Campus Shopkeeper!
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Your account is already linked to your campus store. You can manage inventory, view orders, and edit your profile from your Shop Dashboard.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/shop-dashboard"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Shop Dashboard
                  </Link>
                </div>
              </div>
            ) : isAdmin ? (
              /* Admin view */
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-2xl mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Platform Administrator</h3>
                <p className="text-sm text-slate-500">
                  You are currently logged in as a platform admin. You can review pending shop applications and manage existing stores directly from the Admin Dashboard.
                </p>
                <Link
                  to="/admin-dashboard"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm"
                >
                  Go to Admin Dashboard
                </Link>
              </div>
            ) : (
              /* User applying to set up their shop -> Show full 6-step Wizard! */
              <div className="max-w-4xl mx-auto">
                <ShopRegistrationWizard
                  onRegistered={async () => {
                    await refreshProfile();
                    navigate('/shop-dashboard');
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* FAQs */}
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Everything you need to know about managing a store on CampusCart.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer hover:bg-slate-50/70"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
