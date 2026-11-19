import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Store, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

export default function ShopkeeperLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const loggedUser = await login({ username: identifier, password });
      toast.success(`Welcome back, ${loggedUser.full_name || loggedUser.username}!`);

      if (redirectPath) {
        navigate(redirectPath);
      } else if (loggedUser.role === 'SHOP_OWNER') {
        if (loggedUser.shop_approval_status === 'APPROVED') {
          navigate('/shop-dashboard');
        } else {
          navigate('/become-shopkeeper');
        }
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else {
        navigate('/become-shopkeeper');
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Sign in failed. Check your shopkeeper credentials.');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5 text-indigo-600" />
            CampusCart Vendor Portal
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Shopkeeper Sign In
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Manage your campus shop, live inventory, incoming pickup orders, and counter pickup slots.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Username or Store Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. lovelybakestudio or store@campus.edu"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your store manager password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In as Shopkeeper'}
            </button>
          </form>

          {/* Registration link for shopkeepers */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Want to open a campus shop?{' '}
              <Link to="/shopkeeper/register" className="font-bold text-indigo-600 hover:underline">
                Register as a Shopkeeper
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
