import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

export default function ShopkeeperRegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const { registerShopkeeper } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (formData.password !== formData.confirm_password) {
      const msg = 'Passwords do not match.';
      setFieldErrors({ confirm_password: msg });
      setGeneralError(msg);
      toast.error(msg);
      return;
    }
    if (formData.password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setFieldErrors({ password: msg });
      setGeneralError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await registerShopkeeper(formData);
      toast.success('Shopkeeper account registered successfully! Welcome to your Shop Dashboard.');
      navigate('/shop-dashboard');
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const errors = {};
        Object.keys(data).forEach((k) => {
          errors[k] = Array.isArray(data[k]) ? data[k].join(' ') : String(data[k]);
        });
        setFieldErrors(errors);
      }
      const msg = getErrorMessage(err, 'Shopkeeper registration failed. Please check the form.');
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5 text-indigo-600" />
            Vendor Onboarding
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Register as a Campus Shopkeeper
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Create your campus merchant account to list your store, upload products, and start receiving orders.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xs">
            <div className="text-xs font-bold text-indigo-600">0% Commission</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Free campus platform</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xs">
            <div className="text-xs font-bold text-emerald-600">Zero Recess Queues</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Scheduled slot pickups</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-xs">
            <div className="text-xs font-bold text-blue-600">5,000+ Community</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Direct campus reach</div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50">
          {generalError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name / Contact Person *
                </label>
                <input
                  type="text"
                  required
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Gupta"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.full_name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                />
                {fieldErrors.full_name && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. lovely_bake_studio"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.username ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                />
                {fieldErrors.username ? (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.username}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Unique handle (spaces automatically converted to underscores)</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Store / Contact Email *
                </label>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. store@campus.edu"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Campus Location or Building Affiliation
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Canteen Complex, Main Academic Arcade, or North Stall 4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.confirm_password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                />
                {fieldErrors.confirm_password && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.confirm_password}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating Shopkeeper Account...' : 'Register as Shopkeeper'}
            </button>

            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-sm text-slate-600">
                Already registered as a shopkeeper?{' '}
                <Link to="/shopkeeper/login" className="font-bold text-indigo-600 hover:underline">
                  Shopkeeper Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
