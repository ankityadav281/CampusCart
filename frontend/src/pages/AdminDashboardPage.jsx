import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  FolderKanban,
  FolderTree,
  IndianRupee,
  LayoutDashboard,
  Package,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Store,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { adminAPI, formatINR, getErrorMessage, shopCategoryAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { OrderStatusBadge, PaymentStatusBadge, ShopApprovalBadge } from '../components/StatusBadge';
import AdminShopCategoriesSection from '../components/AdminShopCategoriesSection';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [shopFilter, setShopFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [reportedOnlyProducts, setReportedOnlyProducts] = useState(false);
  const [reportedOnlyReviews, setReportedOnlyReviews] = useState(false);

  // Forms/Modals
  const [userModal, setUserModal] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    password: '',
    role: 'SHOP_OWNER',
  });

  const [shopModal, setShopModal] = useState(false);
  const [newShop, setNewShop] = useState({
    owner: '',
    name: '',
    category: '',
    shop_type: '',
    location: '',
    contact_number: '',
    description: '',
    approval_status: 'APPROVED',
  });

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dRes, sRes, uRes, cRes, pRes, oRes, rRes, scRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getShops(),
        adminAPI.getUsers(),
        adminAPI.getCategories(),
        adminAPI.getProducts(),
        adminAPI.getOrders(),
        adminAPI.getReviews(),
        shopCategoryAPI.list({ all: 'true' }),
      ]);
      setDashboard(dRes.data);
      setShops(sRes.data);
      setUsers(uRes.data);
      setCategories(cRes.data);
      setProducts(pRes.data);
      setOrders(oRes.data);
      setReviews(rRes.data);
      setShopCategories(scRes.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load admin dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleShopStatus = async (shopId, status) => {
    try {
      await adminAPI.updateShopStatus(shopId, status);
      toast.success(`Shop status updated to ${status}.`);
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteShop = async (shop) => {
    if (!window.confirm(`Delete shop "${shop.name}" and all its products?`)) return;
    try {
      await adminAPI.deleteShop(shop.id);
      toast.info('Shop removed.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(newUser);
      toast.success('Account created successfully!');
      setUserModal(false);
      setNewUser({ username: '', email: '', full_name: '', phone: '', password: '', role: 'SHOP_OWNER' });
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleUserActive = async (u) => {
    try {
      await adminAPI.updateUser(u.id, { is_active: !u.is_active });
      toast.success(`User ${u.is_active ? 'suspended' : 'reactivated'}.`);
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Delete user "${u.username}" permanently?`)) return;
    try {
      await adminAPI.deleteUser(u.id);
      toast.info('User deleted.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createShop(newShop);
      toast.success('Shop created successfully!');
      setShopModal(false);
      setNewShop({ owner: '', name: '', category: 'General', location: '', contact_number: '', description: '', approval_status: 'APPROVED' });
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await adminAPI.createCategory({ name: catName.trim(), description: catDesc.trim() });
      toast.success('Category added!');
      setCatName('');
      setCatDesc('');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteCategory = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await adminAPI.deleteCategory(c.id);
      toast.info('Category removed.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleClearProductReport = async (p) => {
    try {
      await adminAPI.updateProduct(p.id, { is_reported: false, report_reason: '' });
      toast.success('Product report dismissed.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteProduct = async (p) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    try {
      await adminAPI.deleteProduct(p.id);
      toast.info('Product deleted.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteReview = async (r) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await adminAPI.deleteReview(r.id);
      toast.info('Review deleted.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDismissReviewReport = async (r) => {
    try {
      await adminAPI.updateReview(r.id, { is_reported: false, report_reason: '' });
      toast.success('Review report dismissed.');
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const metrics = dashboard?.metrics || {};
  const eligibleShopOwners = users.filter((u) => !u.shop_id && u.role !== 'ADMIN');

  const tabs = [
    { key: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { key: 'shops', label: 'Shops & Approvals', icon: Store, badge: metrics.pending_shops_count || 0 },
    { key: 'shop-categories', label: 'Shop Categories & Types', icon: FolderTree },
    { key: 'users', label: 'Users & Accounts', icon: Users },
    { key: 'categories', label: 'Product Categories', icon: FolderKanban },
    { key: 'products', label: 'All Products', icon: Package, badge: metrics.reported_products_count || 0 },
    { key: 'orders', label: 'Orders & Payments', icon: ShoppingBag },
    { key: 'reviews', label: 'Reviews Moderation', icon: Flag, badge: metrics.reported_reviews_count || 0 },
  ];

  const filteredShops = shopFilter === 'ALL' ? shops : shops.filter((s) => s.approval_status === shopFilter);
  const filteredUsers = roleFilter === 'ALL' ? users : users.filter((u) => u.role === roleFilter);
  const filteredProducts = reportedOnlyProducts ? products.filter((p) => p.is_reported) : products;
  const filteredReviews = reportedOnlyReviews ? reviews.filter((r) => r.is_reported) : reviews;

  return (
    <DashboardLayout
      title="Administrator Control Panel"
      subtitle="Platform governance, shop approvals, user management & revenue monitoring"
      badgeText="Platform Admin"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {loading && !dashboard ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Customers', value: metrics.total_customers, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
                  { label: 'Total Shops', value: metrics.total_shops, icon: Store, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Pending Shops', value: metrics.pending_shops_count, icon: ShieldAlert, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Products', value: metrics.total_products, icon: Package, color: 'bg-sky-50 text-sky-600' },
                  { label: 'Total Orders', value: metrics.total_orders, icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Platform Sales', value: formatINR(metrics.total_sales), icon: IndianRupee, color: 'bg-violet-50 text-violet-600' },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Pending Shop Approval Requests */}
              {dashboard.pending_shops?.length > 0 && (
                <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 space-y-3">
                  <h2 className="font-extrabold text-amber-950 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    Shop Approval Requests ({dashboard.pending_shops.length})
                  </h2>
                  <div className="space-y-2.5">
                    {dashboard.pending_shops.map((s) => (
                      <div key={s.id} className="bg-white rounded-xl border border-amber-200 p-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">
                            {s.category} • {s.location} • Owner: {s.owner_name} ({s.owner_username})
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShopStatus(s.id, 'APPROVED')}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleShopStatus(s.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Shops & Popular Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  <h2 className="font-extrabold text-slate-900">Most Popular Shops</h2>
                  {dashboard.popular_shops.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                      <div>
                        <p className="font-bold text-slate-900">#{idx + 1} {s.name}</p>
                        <p className="text-xs text-slate-500">{s.location} • {s.order_count} order(s)</p>
                      </div>
                      <span className="font-extrabold text-indigo-600">{formatINR(s.revenue)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                  <h2 className="font-extrabold text-slate-900">Most Popular Products</h2>
                  {dashboard.popular_products.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                      <div>
                        <p className="font-bold text-slate-900">#{idx + 1} {p.name}</p>
                        <p className="text-xs text-slate-500">{p.shop_name} • {p.units_sold} sold</p>
                      </div>
                      <span className="font-extrabold text-emerald-600">{formatINR(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Platform Activity */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h2 className="font-extrabold text-slate-900">Recent Platform Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 pr-4">Order #</th>
                        <th className="py-2.5 px-4">Customer</th>
                        <th className="py-2.5 px-4">Shop</th>
                        <th className="py-2.5 px-4">Total</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 pl-4">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dashboard.recent_orders.map((o) => (
                        <tr key={o.id}>
                          <td className="py-3 pr-4 font-bold text-slate-900">{o.order_number}</td>
                          <td className="py-3 px-4 text-slate-700">{o.customer_name}</td>
                          <td className="py-3 px-4 text-slate-700">{o.shop_name}</td>
                          <td className="py-3 px-4 font-bold">{formatINR(o.total_amount)}</td>
                          <td className="py-3 px-4"><OrderStatusBadge status={o.order_status} /></td>
                          <td className="py-3 pl-4"><PaymentStatusBadge status={o.payment_status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHOPS */}
          {activeTab === 'shops' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setShopFilter(st)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        shopFilter === st ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShopModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Campus Shop
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Shop</th>
                      <th className="px-4 py-3.5">Owner</th>
                      <th className="px-4 py-3.5">Location</th>
                      <th className="px-4 py-3.5">Products</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShops.map((s) => (
                      <tr key={s.id}>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">
                            {s.category_name || (typeof s.category === 'object' ? s.category?.name : s.category)}
                            {s.shop_type_name ? ` • ${s.shop_type_name}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-800">{s.owner_name}</p>
                          <p className="text-xs text-slate-400">@{s.owner_username}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{s.location}</td>
                        <td className="px-4 py-3.5 font-bold">{s.product_count}</td>
                        <td className="px-4 py-3.5"><ShopApprovalBadge status={s.approval_status} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {s.approval_status !== 'APPROVED' && (
                              <button
                                onClick={() => handleShopStatus(s.id, 'APPROVED')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {s.approval_status === 'PENDING' && (
                              <button
                                onClick={() => handleShopStatus(s.id, 'REJECTED')}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                            {s.approval_status === 'APPROVED' && (
                              <button
                                onClick={() => handleShopStatus(s.id, 'SUSPENDED')}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer"
                              >
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteShop(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'CUSTOMER', 'SHOP_OWNER', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        roleFilter === r ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setUserModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Shop Owner / User
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Shop / ID</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-500">@{u.username} • {u.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {u.shop_name || u.student_id || '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {u.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {u.role !== 'ADMIN' && (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleToggleUserActive(u)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                              >
                                {u.is_active ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SHOP CATEGORIES & TYPES */}
          {activeTab === 'shop-categories' && <AdminShopCategoriesSection />}

          {/* TAB 4: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form onSubmit={handleCreateCategory} className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
                <h2 className="font-extrabold text-slate-900">Add Product Category</h2>
                <input
                  required
                  placeholder="Category Name *"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Short description"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer"
                >
                  Create Category
                </button>
              </form>

              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {categories.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.description || 'No description'} • {c.product_count} active products</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportedOnlyProducts}
                  onChange={(e) => setReportedOnlyProducts(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Show reported products only
              </label>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-4 py-3.5">Shop</th>
                      <th className="px-4 py-3.5">Price</th>
                      <th className="px-4 py-3.5">Stock</th>
                      <th className="px-4 py-3.5">Flagged</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-5 py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600">{p.shop_name}</td>
                        <td className="px-4 py-3 font-semibold">{formatINR(p.effective_price)}</td>
                        <td className="px-4 py-3">{p.stock_quantity}</td>
                        <td className="px-4 py-3">
                          {p.is_reported ? (
                            <span className="text-xs font-bold text-rose-600">Reported: {p.report_reason}</span>
                          ) : (
                            <span className="text-xs text-slate-400">Clean</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {p.is_reported && (
                              <button
                                onClick={() => handleClearProductReport(p)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold cursor-pointer"
                              >
                                Dismiss Flag
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: ORDERS & TRANSACTIONS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Order #</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Shop</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Order Status</th>
                    <th className="px-4 py-3.5">Payment Method</th>
                    <th className="px-5 py-3.5">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{o.order_number}</p>
                        <p className="text-[11px] text-slate-400">{o.order_group_code}</p>
                      </td>
                      <td className="px-4 py-3.5">{o.customer_name}</td>
                      <td className="px-4 py-3.5 font-medium text-indigo-700">{o.shop_name}</td>
                      <td className="px-4 py-3.5 font-extrabold">{formatINR(o.total_amount)}</td>
                      <td className="px-4 py-3.5"><OrderStatusBadge status={o.order_status} /></td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{o.payment_method_display}</td>
                      <td className="px-5 py-3.5"><PaymentStatusBadge status={o.payment_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportedOnlyReviews}
                  onChange={(e) => setReportedOnlyReviews(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Show reported reviews only
              </label>

              <div className="space-y-3">
                {filteredReviews.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {r.product_name} <span className="text-slate-400 font-normal">({r.shop_name})</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        By {r.customer_name} • Rating: {r.rating}/5
                      </p>
                      <p className="text-sm text-slate-700 mt-2">{r.comment}</p>
                      {r.is_reported && (
                        <p className="text-xs font-bold text-rose-600 mt-1.5">Flagged: {r.report_reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.is_reported && (
                        <button
                          onClick={() => handleDismissReviewReport(r)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold cursor-pointer"
                        >
                          Dismiss Flag
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReview(r)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        Remove Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Create User / Shop Owner</h3>
              <button onClick={() => setUserModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <input
                required
                placeholder="Full Name *"
                value={newUser.full_name}
                onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
              <input
                required
                placeholder="Username *"
                value={newUser.username}
                onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
              <input
                placeholder="Phone"
                value={newUser.phone}
                onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
              >
                <option value="SHOP_OWNER">Shop Owner / Manager</option>
                <option value="CUSTOMER">Customer (Student/Staff)</option>
                <option value="ADMIN">Administrator</option>
              </select>
              <div className="relative">
                <input
                  required
                  type={showNewUserPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="Initial Password *"
                  value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewUserPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  tabIndex={-1}
                  aria-label={showNewUserPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Shop Modal */}
      {shopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Add New Campus Shop</h3>
              <button onClick={() => setShopModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateShop} className="space-y-3.5">
              <select
                required
                value={newShop.owner}
                onChange={(e) => setNewShop((p) => ({ ...p, owner: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              >
                <option value="">Select Shop Owner Account *</option>
                {eligibleShopOwners.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} (@{u.username})
                  </option>
                ))}
              </select>
              <input
                required
                placeholder="Shop Name *"
                value={newShop.name}
                onChange={(e) => setNewShop((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
              <select
                required
                value={newShop.category}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewShop((p) => ({ ...p, category: val, shop_type: '' }));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              >
                <option value="">Select Main Shop Category *</option>
                {shopCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                required
                value={newShop.shop_type}
                onChange={(e) => setNewShop((p) => ({ ...p, shop_type: e.target.value }))}
                disabled={!newShop.category}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm disabled:opacity-50"
              >
                <option value="">
                  {!newShop.category ? 'Select Category First' : 'Select Shop Type *'}
                </option>
                {(
                  shopCategories.find((c) => String(c.id) === String(newShop.category))?.shop_types || []
                ).map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
              <input
                required
                placeholder="Campus Location *"
                value={newShop.location}
                onChange={(e) => setNewShop((p) => ({ ...p, location: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
              <input
                placeholder="Contact Number"
                value={newShop.contact_number}
                onChange={(e) => setNewShop((p) => ({ ...p, contact_number: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
              <textarea
                rows={2}
                placeholder="Description"
                value={newShop.description}
                onChange={(e) => setNewShop((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer"
              >
                Create & Approve Shop
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
