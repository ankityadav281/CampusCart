import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileImage,
  Info,
  MapPin,
  Phone,
  Sparkles,
  Store,
  Upload,
} from 'lucide-react';
import { marketplaceAPI, shopCategoryAPI, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import CategoryIcon from './CategoryIcon';
import { FALLBACK_SHOP_CATEGORIES } from '../constants/shopCategories';

const STEPS = [
  { step: 1, title: 'Shop Details' },
  { step: 2, title: 'Main Category' },
  { step: 3, title: 'Shop Type' },
  { step: 4, title: 'Location & Contact' },
  { step: 5, title: 'Logo & Banner' },
  { step: 6, title: 'Review & Submit' },
];

export default function ShopRegistrationWizard({ onRegistered }) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState(FALLBACK_SHOP_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    // Step 1
    name: '',
    description: '',
    opening_time: '08:00',
    closing_time: '20:00',
    // Step 2
    category: '',
    // Step 3
    shop_type: '',
    // Step 4
    location: '',
    contact_number: '',
    contact_email: '',
    // Step 5
    logo: null,
    banner: null,
  });

  const [previews, setPreviews] = useState({
    logo: null,
    banner: null,
  });

  useEffect(() => {
    shopCategoryAPI
      .list()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        if (list && list.length > 0) {
          setCategories(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(form.category));
  const availableShopTypes = selectedCategoryObj?.shop_types || [];
  const selectedShopTypeObj = availableShopTypes.find((st) => String(st.id) === String(form.shop_type));

  const handleCategorySelect = (catId) => {
    setForm((prev) => ({
      ...prev,
      category: String(catId),
      shop_type: '', // Reset shop type dynamically when category changes
    }));
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    setForm((prev) => ({ ...prev, [field]: file }));
    const url = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [field]: url }));
  };

  // Step validation before advancing
  const canProceed = () => {
    if (currentStep === 1) {
      return form.name.trim().length >= 3 && form.description.trim().length >= 5;
    }
    if (currentStep === 2) {
      return Boolean(form.category);
    }
    if (currentStep === 3) {
      return Boolean(form.shop_type);
    }
    if (currentStep === 4) {
      return form.location.trim().length >= 3;
    }
    if (currentStep === 5) {
      return true; // Images are optional at registration, but recommended
    }
    return true;
  };

  const nextStep = () => {
    if (!canProceed()) {
      if (currentStep === 1) toast.error('Please enter a shop name (at least 3 characters) and description.');
      else if (currentStep === 2) toast.error('Please select a main shop category.');
      else if (currentStep === 3) toast.error('Please select a shop type for this category.');
      else if (currentStep === 4) toast.error('Please provide your campus location (e.g. Block A, Ground Floor).');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.category || !form.shop_type) {
      toast.error('Please ensure both category and shop type are selected.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('description', form.description.trim());
      data.append('category', form.category);
      data.append('shop_type', form.shop_type);
      data.append('location', form.location.trim());
      if (form.contact_number) data.append('contact_number', form.contact_number.trim());
      if (form.contact_email) data.append('contact_email', form.contact_email.trim());
      if (form.opening_time) data.append('opening_time', form.opening_time);
      if (form.closing_time) data.append('closing_time', form.closing_time);
      if (form.logo) data.append('logo', form.logo);
      if (form.banner) data.append('banner', form.banner);

      const res = await marketplaceAPI.registerShop(data);
      toast.success(res.data.message || 'Shop submitted successfully for admin approval!');
      if (onRegistered) onRegistered(res.data.shop);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit shop registration.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-indigo-100 shadow-md p-6 sm:p-8 space-y-7">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 mb-2">
          <Store className="w-3.5 h-3.5 text-indigo-600" />
          University Vendor Portal
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Register Your Campus Shop
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Complete the 6 steps below to submit your campus store for administrator verification and onboarding.
        </p>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="hidden sm:grid grid-cols-6 gap-2">
        {STEPS.map((s) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          return (
            <div
              key={s.step}
              onClick={() => s.step < currentStep && setCurrentStep(s.step)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isDone
                  ? 'bg-emerald-50 border-emerald-200 cursor-pointer'
                  : isCurrent
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.step}
                </span>
                <span
                  className={`text-xs font-bold truncate ${
                    isDone ? 'text-emerald-800' : isCurrent ? 'text-indigo-900' : 'text-slate-500'
                  }`}
                >
                  Step {s.step}
                </span>
              </div>
              <p
                className={`text-[11px] font-medium truncate ${
                  isCurrent ? 'text-indigo-700 font-semibold' : 'text-slate-500'
                }`}
              >
                {s.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Mobile Step Badge */}
      <div className="sm:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
        <span className="text-xs font-bold text-indigo-700">
          Step {currentStep} of 6: {STEPS[currentStep - 1].title}
        </span>
        <span className="text-xs text-indigo-600 font-semibold">{Math.round((currentStep / 6) * 100)}%</span>
      </div>

      {/* STEP 1: Enter shop details */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">Step 1: Enter Shop Details</h3>
            <p className="text-xs text-slate-500">Provide the basic identifying information for your store.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Shop Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Campus Corner Canteen or TechZone Accessories"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Shop Description *
            </label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Explain what your shop offers to campus students and faculty..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Typical Opening Time
              </label>
              <input
                type="time"
                value={form.opening_time}
                onChange={(e) => setForm((p) => ({ ...p, opening_time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Typical Closing Time
              </label>
              <input
                type="time"
                value={form.closing_time}
                onChange={(e) => setForm((p) => ({ ...p, closing_time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Select a main shop category */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">Step 2: Select Main Shop Category</h3>
            <p className="text-xs text-slate-500">
              Choose the primary umbrella category that best represents your store.
            </p>
          </div>

          {loadingCategories ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading categories...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {categories.map((cat) => {
                const isSelected = String(form.category) === String(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-600'
                        }`}
                      >
                        <CategoryIcon name={cat.name} icon={cat.icon} className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{cat.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{cat.shop_types?.length || 0} Shop Types</span>
                      {isSelected && <span className="font-bold text-indigo-600">Selected</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Select a shop type based on the selected category */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Step 3: Select Shop Type for &ldquo;{selectedCategoryObj?.name}&rdquo;
              </h3>
              <p className="text-xs text-slate-500">
                Only shop types belonging to &ldquo;{selectedCategoryObj?.name}&rdquo; are shown below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="text-xs font-semibold text-indigo-600 hover:underline self-start sm:self-auto cursor-pointer"
            >
              Change Category
            </button>
          </div>

          {availableShopTypes.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No shop types configured for this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableShopTypes.map((st) => {
                const isSelected = String(form.shop_type) === String(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() => setForm((p) => ({ ...p, shop_type: String(st.id) }))}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <div>
                      <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {st.name}
                      </h4>
                      {st.description && (
                        <p className={`text-xs mt-0.5 line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {st.description}
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Enter shop location and contact information */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">
              Step 4: Enter Shop Location & Contact Information
            </h3>
            <p className="text-xs text-slate-500">
              Students and staff need accurate pickup instructions and shop contact details.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Campus Location (Block / Floor / Room) *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Student Center, 1st Floor, Near Central Library"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.contact_number}
                  onChange={(e) => setForm((p) => ({ ...p, contact_number: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                placeholder="e.g. shop@university.edu"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Upload shop logo and banner */}
      {currentStep === 5 && (
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">Step 5: Upload Shop Logo & Banner</h3>
            <p className="text-xs text-slate-500">
              Branding helps students recognize your store in the campus directory.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Shop Logo (Square 1:1)
              </span>

              {previews.logo ? (
                <div className="relative w-24 h-24 mx-auto rounded-2xl overflow-hidden border shadow">
                  <img src={previews.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Store className="w-8 h-8" />
                </div>
              )}

              <div>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {previews.logo ? 'Change Logo' : 'Select Logo File'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange('logo', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* Banner Upload */}
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Shop Banner (Wide 16:9)
              </span>

              {previews.banner ? (
                <div className="relative h-24 mx-auto rounded-xl overflow-hidden border shadow">
                  <img src={previews.banner} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-20 mx-auto rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <FileImage className="w-8 h-8" />
                </div>
              )}

              <div>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {previews.banner ? 'Change Banner' : 'Select Banner File'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange('banner', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Submit shop for administrator approval */}
      {currentStep === 6 && (
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900">
              Step 6: Review & Submit for Administrator Approval
            </h3>
            <p className="text-xs text-slate-500">
              Please review all entered details. Once submitted, university administrators will verify your shop.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Shop Name:</span>
              <span className="font-bold text-slate-900">{form.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Main Category:</span>
              <span className="font-bold text-indigo-700">{selectedCategoryObj?.name || 'Not selected'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Shop Type:</span>
              <span className="font-bold text-violet-700">{selectedShopTypeObj?.name || 'Not selected'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Campus Location:</span>
              <span className="font-bold text-slate-900">{form.location}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Operating Hours:</span>
              <span className="font-bold text-slate-900">
                {form.opening_time} – {form.closing_time}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Contact Phone:</span>
              <span className="font-bold text-slate-900">{form.contact_number || 'N/A'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Administrator Review Policy</p>
              <p className="mt-0.5 text-amber-800">
                Your shop status will initially be <strong>PENDING</strong>. Once an administrator approves your shop, it will appear publicly across CampusCart, and you will gain full access to product and order management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < 6 ? (
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors shadow-xs"
          >
            Next: {STEPS[currentStep].title}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors shadow-md disabled:opacity-60"
          >
            {submitting ? 'Submitting Application...' : 'Submit Shop for Admin Approval'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
