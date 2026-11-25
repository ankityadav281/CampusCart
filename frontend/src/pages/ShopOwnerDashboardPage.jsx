import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Clock,
  Edit3,
  IndianRupee,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatINR, getErrorMessage, marketplaceAPI, shopCategoryAPI, shopOwnerAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { OrderStatusBadge, PaymentStatusBadge, ShopApprovalBadge } from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

const EMPTY_PRODUCT_FORM = {
  name: '',
  category: '',
  description: '',
  price: '',
  discount_price: '',
  stock_quantity: 10,
  low_stock_threshold: 5,
  is_available: true,
  is_featured: false,
  image: null,
};

const NEXT_ACTION_META = {
  ACCEPTED: { label: 'Accept Order', cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  REJECTED: { label: 'Reject', cls: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' },
  PREPARING: { label: 'Start Preparing', cls: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  READY_FOR_PICKUP: { label: 'Mark Ready for Pickup', cls: 'bg-blue-600 hover:bg-blue-700 text-white' },
  COMPLETED: { label: 'Mark Completed', cls: 'bg-slate-900 hover:bg-slate-800 text-white' },
};

export default function ShopOwnerDashboardPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [savingProduct, setSavingProduct] = useState(false);

  // Shop profile form
  const [shopForm, setShopForm] = useState(null);
  const [shopFiles, setShopFiles] = useState({ logo: null, banner: null });
  const [savingShop, setSavingShop] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, ordRes, catRes, shopCatRes] = await Promise.all([
        shopOwnerAPI.getDashboard(),
        shopOwnerAPI.getProducts(),
        shopOwnerAPI.getOrders(),
        marketplaceAPI.getCategories(),
        shopCategoryAPI.list(),
      ]);
      setDashboard(dashRes.data);
      setProducts(prodRes.data);
      setOrders(ordRes.data);
      setCategories(catRes.data);
      setShopCategories(shopCatRes.data || []);
      const s = dashRes.data.shop;
      setShopForm({
        name: s.name || '',
        category: s.category || '',
        shop_type: s.shop_type || '',
        description: s.description || '',
        location: s.location || '',
        opening_time: s.opening_time ? s.opening_time.slice(0, 5) : '',
        closing_time: s.closing_time ? s.closing_time.slice(0, 5) : '',
        contact_number: s.contact_number || '',
        contact_email: s.contact_email || '',
        is_active: s.is_active,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to load shop dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const refreshProducts = async () => {
    const { data } = await shopOwnerAPI.getProducts({
      search: productSearch || undefined,
      stock_filter: stockFilter !== 'all' ? stockFilter : undefined,
    });
    setProducts(data);
  };

  const refreshOrders = async () => {
    const { data } = await shopOwnerAPI.getOrders({
      status: orderStatusFilter !== 'ALL' ? orderStatusFilter : undefined,
    });
    setOrders(data);
  };

  useEffect(() => {
    if (!loading) refreshProducts().catch(() => {});
  }, [productSearch, stockFilter]);

  useEffect(() => {
    if (!loading) refreshOrders().catch(() => {});
  }, [orderStatusFilter]);

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      category: categories[0]?.id || '',
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category || '',
      description: prod.description || '',
      price: prod.price,
      discount_price: prod.discount_price || '',
      stock_quantity: prod.stock_quantity,
      low_stock_threshold: prod.low_stock_threshold || 5,
      is_available: prod.is_available,
      is_featured: prod.is_featured,
      image: null,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const fd = new FormData();
      fd.append('name', productForm.name);
      if (productForm.category) fd.append('category', productForm.category);
      fd.append('description', productForm.description);
      fd.append('price', productForm.price);
      if (productForm.discount_price !== '' && productForm.discount_price !== null) {
        fd.append('discount_price', productForm.discount_price);
      } else {
        fd.append('discount_price', '');
      }
      fd.append('stock_quantity', productForm.stock_quantity);
      fd.append('low_stock_threshold', productForm.low_stock_threshold);
      fd.append('is_available', productForm.is_available ? 'true' : 'false');
      fd.append('is_featured', productForm.is_featured ? 'true' : 'false');
      if (productForm.image) fd.append('image', productForm.image);

      if (editingProduct) {
        await shopOwnerAPI.updateProduct(editingProduct.id, fd);
        toast.success('Product updated successfully!');
      } else {
        await shopOwnerAPI.createProduct(fd);
        toast.success('New product added to your shop!');
      }
      setProductModalOpen(false);
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save product.'));
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Delete "${prod.name}" permanently from your shop?`)) return;
    try {
      await shopOwnerAPI.deleteProduct(prod.id);
      toast.info('Product deleted.');
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleQuickStockToggle = async (prod, patch) => {
    try {
      await shopOwnerAPI.updateProduct(prod.id, patch);
      toast.success('Inventory updated!');
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleOrderTransition = async (orderId, nextStatus) => {
    let status_note = '';
    if (nextStatus === 'REJECTED') {
      const reason = window.prompt('Reason for rejecting this order:', 'Item temporarily unavailable');
      if (reason === null) return;
      status_note = reason;
    }
    try {
      await shopOwnerAPI.updateOrderStatus(orderId, { order_status: nextStatus, status_note });
      toast.success(`Order status updated to ${nextStatus.replaceAll('_', ' ')}.`);
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePaymentStatusChange = async (orderId, payment_status) => {
    try {
      await shopOwnerAPI.updateOrderStatus(orderId, { payment_status });
      toast.success(`Payment status marked as ${payment_status}.`);
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveShopProfile = async (e) => {
    e.preventDefault();
    setSavingShop(true);
    try {
      const fd = new FormData();
      Object.entries(shopForm).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v));
      });
      if (shopFiles.logo) fd.append('logo', shopFiles.logo);
      if (shopFiles.banner) fd.append('banner', shopFiles.banner);

      await shopOwnerAPI.updateMyShop(fd);
      toast.success('Shop profile updated!');
      setShopFiles({ logo: null, banner: null });
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingShop(false);
    }
  };

  const metrics = dashboard?.metrics || {};
  const shop = dashboard?.shop;

  const tabs = [
    { key: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { key: 'orders', label: 'Incoming Orders', icon: ShoppingBag, badge: metrics.pending_orders || 0 },
    { key: 'products', label: 'Products & Stock', icon: Package, badge: metrics.low_stock_count || 0 },
    { key: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
    { key: 'profile', label: 'Shop Profile', icon: Store },
  ];

  return (
    <DashboardLayout
      title={shop ? shop.name : 'Shop Owner Dashboard'}
      subtitle={shop ? `${shop.location} • ${shop.category}` : 'Manage your campus store'}
      badgeText="Shop Manager Portal"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {loading && !dashboard ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : !shop ? (
        <EmptyState
          icon={Store}
          title="No Shop Linked Yet"
          description="Your shop manager account does not have a shop assigned yet. Contact the campus administrator."
        />
      ) : (
        <div className="space-y-6">
          {/* Pending / Suspended Warning */}
          {shop.approval_status !== 'APPROVED' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Your shop approval status is currently <strong>{shop.approval_status}</strong>. Only approved shops are visible in the public student marketplace.
                </span>
              </div>
              <ShopApprovalBadge status={shop.approval_status} />
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Products', value: metrics.total_products, icon: Package, color: 'bg-indigo-50 text-indigo-600' },
                  { label: 'Total Orders', value: metrics.total_orders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Pending Orders', value: metrics.pending_orders, icon: Clock, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Completed', value: metrics.completed_orders, icon: Check, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Total Sales', value: formatINR(metrics.total_sales), icon: IndianRupee, color: 'bg-violet-50 text-violet-600' },
                  { label: 'Low Stock Items', value: metrics.low_stock_count, icon: AlertTriangle, color: 'bg-rose-50 text-rose-600' },
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

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-extrabold text-slate-900">Recent Incoming Orders</h2>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Manage All →
                    </button>
                  </div>
                  {dashboard.recent_orders.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">No orders received yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {dashboard.recent_orders.map((ord) => (
                        <div key={ord.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{ord.order_number}</span>
                              <OrderStatusBadge status={ord.order_status} />
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {ord.customer_name} • {ord.items.length} item(s) • {ord.pickup_time}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 mr-1">
                              {formatINR(ord.total_amount)}
                            </span>
                            {ord.allowed_shop_transitions?.map((st) => {
                              const meta = NEXT_ACTION_META[st];
                              if (!meta) return null;
                              return (
                                <button
                                  key={st}
                                  onClick={() => handleOrderTransition(ord.id, st)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${meta.cls}`}
                                >
                                  {meta.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Low Stock Alerts */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Low-Stock Alerts
                    </h2>
                    <button
                      onClick={openAddProduct}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      + Add Product
                    </button>
                  </div>
                  {dashboard.low_stock_products.length === 0 ? (
                    <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-4">
                      All products are well stocked!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.low_stock_products.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900 truncate">{p.name}</p>
                            <p className="text-xs text-amber-800 font-semibold">
                              Only {p.stock_quantity} remaining in stock
                            </p>
                          </div>
                          <button
                            onClick={() => handleQuickStockToggle(p, { stock_quantity: p.stock_quantity + 20 })}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                          >
                            +20 Stock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED', 'CANCELLED'].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        orderStatusFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      {st.replaceAll('_', ' ')}
                    </button>
                  )
                )}
              </div>

              {orders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders in this category" description="Orders placed by students for your shop will appear here." />
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-extrabold text-slate-900">{ord.order_number}</span>
                            <OrderStatusBadge status={ord.order_status} />
                            <PaymentStatusBadge status={ord.payment_status} />
                          </div>
                          <p className="text-xs text-slate-500">
                            Customer: <strong className="text-slate-800">{ord.customer_name}</strong> ({ord.customer_phone || ord.customer_email})
                            {ord.customer_student_id ? ` • ID: ${ord.customer_student_id}` : ''}
                          </p>
                          <p className="text-xs text-indigo-700 font-semibold">
                            Pickup Slot: {ord.pickup_time}
                          </p>
                          {ord.customer_notes && (
                            <p className="text-xs text-slate-600 italic">Note: "{ord.customer_notes}"</p>
                          )}
                        </div>

                        <div className="text-right space-y-2">
                          <div className="text-xl font-extrabold text-slate-900">{formatINR(ord.total_amount)}</div>
                          <div className="text-xs text-slate-500">{ord.payment_method_display}</div>
                          <select
                            value={ord.payment_status}
                            onChange={(e) => handlePaymentStatusChange(ord.id, e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                          >
                            <option value="PENDING">Payment: Pending</option>
                            <option value="PAID">Payment: Paid</option>
                            <option value="FAILED">Payment: Failed</option>
                            <option value="REFUNDED">Payment: Refunded</option>
                          </select>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 divide-y divide-slate-200/70">
                        {ord.items.map((item) => (
                          <div key={item.id} className="px-4 py-2 flex justify-between text-sm">
                            <span className="font-medium text-slate-800">
                              {item.product_name_snapshot} × {item.quantity}
                            </span>
                            <span className="font-bold text-slate-900">{formatINR(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      {ord.allowed_shop_transitions?.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-2">
                          {ord.allowed_shop_transitions.map((st) => {
                            const meta = NEXT_ACTION_META[st];
                            if (!meta) return null;
                            return (
                              <button
                                key={st}
                                onClick={() => handleOrderTransition(ord.id, st)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${meta.cls}`}
                              >
                                {meta.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCTS & STOCK */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search your products..."
                    className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-indigo-500 w-full sm:w-64"
                  />
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="low">Low Stock Only</option>
                    <option value="out">Out of Stock Only</option>
                  </select>
                </div>
                <button
                  onClick={openAddProduct}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Product
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Price</th>
                      <th className="px-4 py-3.5">Stock</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                              {p.image_url && (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-[220px]">{p.name}</p>
                              {p.is_featured && (
                                <span className="text-[10px] font-bold text-indigo-600 uppercase">Featured</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{p.category_name}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{formatINR(p.effective_price)}</div>
                          {p.discount_percent > 0 && (
                            <div className="text-xs text-slate-400 line-through">{formatINR(p.price)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                p.stock_quantity === 0
                                  ? 'text-rose-600'
                                  : p.is_low_stock
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                              }`}
                            >
                              {p.stock_quantity}
                            </span>
                            <button
                              onClick={() => handleQuickStockToggle(p, { stock_quantity: p.stock_quantity + 10 })}
                              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-100 text-xs font-bold text-indigo-700 cursor-pointer"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleQuickStockToggle(p, { is_available: !p.is_available })}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer ${
                              p.in_stock
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {!p.is_available ? 'Deactivated' : p.stock_quantity === 0 ? 'Out of Stock' : 'Available'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                              title="Edit product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete product"
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

          {/* TAB 4: SALES ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Best Selling Products */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="font-extrabold text-slate-900">Best-Selling Products</h2>
                {dashboard.best_selling_products.length === 0 ? (
                  <p className="text-sm text-slate-500">No sales recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.best_selling_products.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50">
                        <div>
                          <p className="font-bold text-sm text-slate-900">
                            #{idx + 1} {item.name}
                          </p>
                          <p className="text-xs text-slate-500">{item.units_sold} unit(s) sold</p>
                        </div>
                        <span className="font-extrabold text-indigo-600">{formatINR(item.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daily & Monthly Sales */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <h2 className="font-extrabold text-slate-900">Daily Order Statistics (Last 7 Days)</h2>
                  {dashboard.daily_stats.length === 0 ? (
                    <p className="text-sm text-slate-500">No orders in the past 7 days.</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.daily_stats.map((d) => {
                        const maxRev = Math.max(...dashboard.daily_stats.map((x) => x.revenue), 1);
                        return (
                          <div key={d.date} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-600">{d.date} ({d.order_count} orders)</span>
                              <span className="text-slate-900">{formatINR(d.revenue)}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${Math.max((d.revenue / maxRev) * 100, 6)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <h2 className="font-extrabold text-slate-900">Monthly Revenue Summary</h2>
                  {dashboard.monthly_stats.length === 0 ? (
                    <p className="text-sm text-slate-500">No monthly statistics yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {dashboard.monthly_stats.map((m) => (
                        <div key={m.month} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                          <span className="font-bold text-slate-800">{m.month}</span>
                          <span className="text-slate-500">{m.order_count} order(s)</span>
                          <span className="font-extrabold text-emerald-600">{formatINR(m.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHOP PROFILE */}
          {activeTab === 'profile' && shopForm && (
            <form onSubmit={handleSaveShopProfile} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-3xl space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">Shop Profile & Hours</h2>
                <ShopApprovalBadge status={shop.approval_status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Shop Name</label>
                  <input
                    required
                    value={shopForm.name}
                    onChange={(e) => setShopForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                    Type of Shop
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-700 flex items-center justify-between">
                    <span>
                      {shop?.shop_type_name
                        ? `${shop.shop_type_name} (${shop.category_name || 'Category'})`
                        : shop?.category_name || 'Assigned at Registration'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-200/80 px-2 py-0.5 rounded">
                      Assigned at Registration
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Campus Location</label>
                  <input
                    required
                    value={shopForm.location}
                    onChange={(e) => setShopForm((p) => ({ ...p, location: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Contact Number</label>
                  <input
                    value={shopForm.contact_number}
                    onChange={(e) => setShopForm((p) => ({ ...p, contact_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Opening Time</label>
                  <input
                    type="time"
                    value={shopForm.opening_time}
                    onChange={(e) => setShopForm((p) => ({ ...p, opening_time: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Closing Time</label>
                  <input
                    type="time"
                    value={shopForm.closing_time}
                    onChange={(e) => setShopForm((p) => ({ ...p, closing_time: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={shopForm.description}
                  onChange={(e) => setShopForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Update Shop Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setShopFiles((f) => ({ ...f, logo: e.target.files?.[0] || null }))}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Update Shop Banner</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setShopFiles((f) => ({ ...f, banner: e.target.files?.[0] || null }))}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingShop}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer disabled:opacity-60"
              >
                {savingShop ? 'Saving...' : 'Save Shop Profile'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Product Name *</label>
                <input
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Regular Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={productForm.discount_price}
                    onChange={(e) => setProductForm((f) => ({ ...f, discount_price: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Product Image (JPEG/PNG/WEBP, max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductForm((f) => ({ ...f, image: e.target.files?.[0] || null }))}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold"
                />
              </div>
              <div className="flex items-center gap-5">
                <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_available}
                    onChange={(e) => setProductForm((f) => ({ ...f, is_available: e.target.checked }))}
                    className="rounded text-indigo-600"
                  />
                  Available for sale
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) => setProductForm((f) => ({ ...f, is_featured: e.target.checked }))}
                    className="rounded text-indigo-600"
                  />
                  Featured badge
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer disabled:opacity-60"
                >
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
