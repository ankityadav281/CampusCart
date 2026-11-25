import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Store, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, shopCategoryAPI } from '../services/api';
import { FALLBACK_SHOP_CATEGORIES } from '../constants/shopCategories';

export default function ShopkeeperRegisterPage() {
  const [formData, setFormData] = useState({
    shop_name: '',
    category: '',
    shop_type: '',
    full_name: '',
    username: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirm_password: '',
  });
  const [categories, setCategories] = useState(FALLBACK_SHOP_CATEGORIES);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const { user, isAuthenticated, isCustomer, registerShopkeeper } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && (isCustomer || user?.role?.toUpperCase() === 'CUSTOMER')) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isCustomer, user, navigate]);

  useEffect(() => {
    let isMounted = true;
    shopCategoryAPI
      .list()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        if (list && list.length > 0) {
          setCategories(list);
        }
      })
      .catch((err) => {
        // Keeps fallback categories on connection or network issues
        console.warn('Using preloaded campus shop categories:', err?.message || err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCategoryObj = categories.find(
    (c) =>
      String(c.id) === String(formData.category) ||
      c.slug === formData.category ||
      c.name === formData.category
  );
  const availableShopTypes = selectedCategoryObj?.shop_types || [];

  const handleShopNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, shop_name: val };
      if (!usernameTouched) {
        // Automatically follows shop name without underscore
        updated.username = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
      return updated;
    });
    if (fieldErrors.shop_name) {
      setFieldErrors((prev) => ({ ...prev, shop_name: null }));
    }
    if (fieldErrors.username && !usernameTouched) {
      setFieldErrors((prev) => ({ ...prev, username: null }));
    }
    if (generalError) setGeneralError('');
  };

  const handleUsernameChange = (e) => {
    const rawVal = e.target.value;
    const cleaned = rawVal.toLowerCase().replace(/[\s_]+/g, '').replace(/[^a-z0-9.@+-]/g, '');
    if (!cleaned) {
      setUsernameTouched(false);
    } else {
      setUsernameTouched(true);
    }
    setFormData((prev) => ({ ...prev, username: cleaned }));
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: null }));
    }
    if (generalError) setGeneralError('');
  };

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

    if (!formData.shop_name.trim()) {
      const msg = 'Please enter your shop name.';
      setFieldErrors({ shop_name: msg });
      setGeneralError(msg);
      toast.error(msg);
      return;
    }
    if (!formData.username.trim()) {
      const msg = 'Please enter a username.';
      setFieldErrors({ username: msg });
      setGeneralError(msg);
      toast.error(msg);
      return;
    }
    if (!formData.category) {
      const msg = 'Please select a shop category.';
      setFieldErrors({ category: msg });
      setGeneralError(msg);
      toast.error(msg);
      return;
    }
    if (!formData.shop_type) {
      const msg = 'Please select your type of shop.';
      setFieldErrors({ shop_type: msg });
      setGeneralError(msg);
      toast.error(msg);
      return;
    }
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
      const payload = {
        ...formData,
        category_id: formData.category ? (Number(formData.category) || formData.category) : null,
        shop_type_id: formData.shop_type ? (Number(formData.shop_type) || formData.shop_type) : null,
      };
      await registerShopkeeper(payload);
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
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleShopNameChange}
                  placeholder="e.g. Lovely Bake Studio"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.shop_name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                />
                {fieldErrors.shop_name ? (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.shop_name}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Store name shown to campus students & shoppers</p>
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
                  onChange={handleUsernameChange}
                  placeholder="e.g. lovelybakestudio"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.username ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                />
                {fieldErrors.username ? (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.username}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Unique handle without spaces or underscores (auto-follows shop name)</p>
                )}
              </div>
            </div>

            {/* Shop Category & Type of Shop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Shop Category *
                </label>
                <select
                  required
                  name="category"
                  value={formData.category}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    setFormData((prev) => ({ ...prev, category: newCatId, shop_type: '' }));
                    if (fieldErrors.category) setFieldErrors((p) => ({ ...p, category: null }));
                    if (fieldErrors.shop_type) setFieldErrors((p) => ({ ...p, shop_type: null }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.category ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all`}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Type of Shop *
                </label>
                <select
                  required
                  name="shop_type"
                  value={formData.shop_type}
                  onChange={handleChange}
                  disabled={!formData.category}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                    fieldErrors.shop_type ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  } focus:bg-white outline-none text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {!formData.category ? 'Select Category First' : 'Select Type of Shop'}
                  </option>
                  {availableShopTypes.map((st) => (
                    <option key={st.id || st.slug || st.name} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.shop_type && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.shop_type}</p>
                )}
              </div>
            </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className={`w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-50 border ${
                      fieldErrors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                    } focus:bg-white outline-none text-sm transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-50 border ${
                      fieldErrors.confirm_password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                    } focus:bg-white outline-none text-sm transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
