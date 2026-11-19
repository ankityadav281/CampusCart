import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit2,
  FileImage,
  Filter,
  FolderTree,
  Plus,
  Power,
  Search,
  Store,
  Tag,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { shopCategoryAPI, shopTypeAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import CategoryIcon from './CategoryIcon';

const PREDEFINED_ICONS = [
  { name: 'UtensilsCrossed', label: 'Food & Dining' },
  { name: 'BookOpen', label: 'Books & Stationery' },
  { name: 'Laptop', label: 'Tech & Electronics' },
  { name: 'Shirt', label: 'Fashion & Clothing' },
  { name: 'ShoppingBasket', label: 'Grocery & Mart' },
  { name: 'Sparkles', label: 'Beauty & Care' },
  { name: 'Dumbbell', label: 'Sports & Fitness' },
  { name: 'Briefcase', label: 'Campus Services' },
  { name: 'Coffee', label: 'Coffee & Drinks' },
  { name: 'Printer', label: 'Printing & Xerox' },
  { name: 'Scissors', label: 'Salon & Hair' },
  { name: 'Store', label: 'General Store' },
];

export default function AdminShopCategoriesSection() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedCatId, setExpandedCatId] = useState(null);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    icon: 'Store',
    is_active: true,
  });
  const [catImageFile, setCatImageFile] = useState(null);
  const [catImagePreview, setCatImagePreview] = useState(null);
  const [savingCat, setSavingCat] = useState(false);

  // Shop Type Modal State
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [savingType, setSavingType] = useState(false);

  // Deletion Protection Dialog State
  const [deleteWarningModal, setDeleteWarningModal] = useState({
    open: false,
    category: null,
    reason: '',
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await shopCategoryAPI.list({ all: 'true' });
      setCategories(res.data || []);
      // If none expanded, expand first one by default
      if (res.data?.length > 0 && !expandedCatId) {
        setExpandedCatId(res.data[0].id);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load shop categories.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(search.toLowerCase())) ||
      (cat.shop_types && cat.shop_types.some((st) => st.name.toLowerCase().includes(search.toLowerCase())));

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return cat.is_active;
    if (statusFilter === 'INACTIVE') return !cat.is_active;
    return true;
  });

  // Open Add Category
  const handleOpenAddCategory = () => {
    setEditingCat(null);
    setCatForm({
      name: '',
      description: '',
      icon: 'Store',
      is_active: true,
    });
    setCatImageFile(null);
    setCatImagePreview(null);
    setCatModalOpen(true);
  };

  // Open Edit Category
  const handleOpenEditCategory = (cat) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'Store',
      is_active: Boolean(cat.is_active),
    });
    setCatImageFile(null);
    setCatImagePreview(cat.image_url || null);
    setCatModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    setSavingCat(true);
    try {
      const data = new FormData();
      data.append('name', catForm.name.trim());
      data.append('description', catForm.description.trim());
      data.append('icon', catForm.icon);
      data.append('is_active', String(catForm.is_active));
      if (catImageFile) {
        data.append('image', catImageFile);
      }

      if (editingCat) {
        await shopCategoryAPI.update(editingCat.id, data);
        toast.success(`Category "${catForm.name}" updated successfully.`);
      } else {
        await shopCategoryAPI.create(data);
        toast.success(`Category "${catForm.name}" created successfully.`);
      }
      setCatModalOpen(false);
      await loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save shop category.'));
    } finally {
      setSavingCat(false);
    }
  };

  // Toggle Category Active Status
  const handleToggleCategoryActive = async (cat) => {
    try {
      await shopCategoryAPI.update(cat.id, { is_active: !cat.is_active });
      toast.success(`Category "${cat.name}" is now ${!cat.is_active ? 'active' : 'inactive'}.`);
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Delete Category with Protected Safety Check
  const handleDeleteCategoryPrompt = (cat) => {
    const shopCount = cat.shop_count ?? cat.shops?.length ?? 0;
    if (shopCount > 0) {
      setDeleteWarningModal({
        open: true,
        category: cat,
        reason: `Cannot delete "${cat.name}" because it is currently assigned to ${shopCount} active campus shop(s). Accidental deletion is blocked to prevent breaking university shop listings. You can deactivate it instead so it is hidden from customers.`,
      });
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete "${cat.name}"? This action cannot be undone.`)) {
      executeDeleteCategory(cat.id);
    }
  };

  const executeDeleteCategory = async (catId) => {
    try {
      await shopCategoryAPI.delete(catId);
      toast.success('Category deleted successfully.');
      setDeleteWarningModal({ open: false, category: null, reason: '' });
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete category.'));
    }
  };

  // Open Add Shop Type
  const handleOpenAddType = (cat) => {
    setTargetCategory(cat);
    setEditingType(null);
    setTypeForm({
      name: '',
      description: '',
      is_active: true,
    });
    setTypeModalOpen(true);
  };

  // Open Edit Shop Type
  const handleOpenEditType = (cat, type) => {
    setTargetCategory(cat);
    setEditingType(type);
    setTypeForm({
      name: type.name,
      description: type.description || '',
      is_active: Boolean(type.is_active),
    });
    setTypeModalOpen(true);
  };

  // Save Shop Type
  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      toast.error('Shop type name is required.');
      return;
    }

    setSavingType(true);
    try {
      if (editingType) {
        await shopTypeAPI.update(editingType.id, {
          name: typeForm.name.trim(),
          description: typeForm.description.trim(),
          is_active: typeForm.is_active,
        });
        toast.success(`Shop type "${typeForm.name}" updated.`);
      } else {
        await shopTypeAPI.create({
          category: targetCategory.id,
          name: typeForm.name.trim(),
          description: typeForm.description.trim(),
          is_active: typeForm.is_active,
        });
        toast.success(`Shop type "${typeForm.name}" added to ${targetCategory.name}.`);
      }
      setTypeModalOpen(false);
      await loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save shop type.'));
    } finally {
      setSavingType(false);
    }
  };

  // Delete Shop Type with assigned check
  const handleDeleteType = async (type) => {
    if (!window.confirm(`Delete shop type "${type.name}"?`)) return;
    try {
      await shopTypeAPI.delete(type.id);
      toast.success(`Shop type "${type.name}" deleted.`);
      loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Cannot delete this shop type. It may be assigned to existing shops.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            Shop Categories & Types Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure primary campus shop categories, manage specialized sub-types, and protect active stores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories or types..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  statusFilter === f ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenAddCategory}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Main Categories Accordion / List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          No shop categories match your filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((cat) => {
            const isExpanded = expandedCatId === cat.id;
            const shopTypes = cat.shop_types || [];
            const shopCount = cat.shop_count ?? cat.shops?.length ?? 0;

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isExpanded ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Category Header Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                  <div
                    onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                    className="flex items-center gap-3.5 flex-1 cursor-pointer select-none"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        cat.is_active
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      <CategoryIcon name={cat.name} icon={cat.icon} className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 truncate">{cat.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cat.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {cat.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-500 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                        <Store className="w-3.5 h-3.5 text-indigo-600" />
                        {shopCount} {shopCount === 1 ? 'Shop' : 'Shops'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                        <Tag className="w-3.5 h-3.5 text-violet-600" />
                        {shopTypes.length} Types
                      </span>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Category Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                    <button
                      title={cat.is_active ? 'Deactivate Category' : 'Activate Category'}
                      onClick={() => handleToggleCategoryActive(cat)}
                      className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        cat.is_active
                          ? 'border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      title="Edit Category"
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      title="Add Shop Type"
                      onClick={() => handleOpenAddType(cat)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Type
                    </button>

                    <button
                      title="Delete Category"
                      onClick={() => handleDeleteCategoryPrompt(cat)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 text-xs cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Section: Shop Types */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-100 p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Shop Types under &ldquo;{cat.name}&rdquo; ({shopTypes.length})
                        </h4>
                      </div>
                      <button
                        onClick={() => handleOpenAddType(cat)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Type
                      </button>
                    </div>

                    {shopTypes.length === 0 ? (
                      <div className="bg-white rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                        No shop types configured yet under this category. Click &ldquo;Add Type&rdquo; above to create one.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {shopTypes.map((st) => (
                          <div
                            key={st.id}
                            className="bg-white rounded-xl border border-slate-200/90 p-3.5 flex items-start justify-between gap-3 shadow-2xs hover:border-indigo-200 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {st.name}
                                </span>
                                {!st.is_active && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-500">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              {st.description && (
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{st.description}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEditType(cat, st)}
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                title="Edit Type"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteType(st)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Delete Type"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT MAIN CATEGORY */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl my-8 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingCat ? 'Edit Shop Category' : 'Add New Shop Category'}
              </h3>
              <button
                onClick={() => setCatModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Food & Beverages or Electronics & Technology"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief summary of shops and supplies found in this category..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category Icon
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                  {PREDEFINED_ICONS.map((ic) => {
                    const isSelected = catForm.icon === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setCatForm((p) => ({ ...p, icon: ic.name }))}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <CategoryIcon name={ic.name} icon={ic.name} className="w-4 h-4 shrink-0" />
                        <span className="truncate">{ic.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category Banner Image
                </label>
                <div className="flex items-center gap-3">
                  {catImagePreview ? (
                    <div className="relative w-16 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={catImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <FileImage className="w-5 h-5" />
                    </div>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    {catImagePreview ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCatImageFile(file);
                          setCatImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catIsActive"
                  checked={catForm.is_active}
                  onChange={(e) => setCatForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="catIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Category is Active (Visible to students and shop owners)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {savingCat ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT SHOP TYPE */}
      {typeModalOpen && targetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingType ? 'Edit Shop Type' : 'Add Shop Type'}
                </h3>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">Under: {targetCategory.name}</p>
              </div>
              <button
                onClick={() => setTypeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Shop Type Name *
                </label>
                <input
                  type="text"
                  required
                  value={typeForm.name}
                  onChange={(e) => setTypeForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Canteen, Bakery, Coffee Shop..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={typeForm.description}
                  onChange={(e) => setTypeForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief note about this shop type..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="typeIsActive"
                  checked={typeForm.is_active}
                  onChange={(e) => setTypeForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="typeIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Shop Type is Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTypeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingType}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {savingType ? 'Saving...' : editingType ? 'Update Type' : 'Add Shop Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 3: DELETION PROTECTION WARNING MODAL */}
      {deleteWarningModal.open && deleteWarningModal.category && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Accidental Deletion Protected
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                {deleteWarningModal.reason}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
              <p className="font-bold">Recommended Administrator Action:</p>
              <p className="mt-0.5 text-indigo-700">
                Deactivate this category to immediately prevent new shops from selecting it and hide it from customer search, while keeping historical order and shop records intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteWarningModal({ open: false, category: null, reason: '' })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Dismiss
              </button>
              {deleteWarningModal.category.is_active && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleToggleCategoryActive(deleteWarningModal.category);
                    setDeleteWarningModal({ open: false, category: null, reason: '' });
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Deactivate Category
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
