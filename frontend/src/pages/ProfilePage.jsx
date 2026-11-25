import { useState } from 'react';
import { Lock, Save, User } from 'lucide-react';
import { authAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, updateUserLocal } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    student_id: user?.student_id || '',
    department: user?.department || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      updateUserLocal(data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      await authAPI.changePassword(pwdForm);
      toast.success('Password changed successfully!');
      setPwdForm({ old_password: '', new_password: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Account & Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your university profile details and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Profile Details */}
        <form onSubmit={handleProfileSave} className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
            <User className="w-5 h-5 text-indigo-600" />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
              <input
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone</label>
              <input
                value={profileForm.phone}
                onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Student / Staff ID</label>
              <input
                value={profileForm.student_id}
                onChange={(e) => setProfileForm((p) => ({ ...p, student_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Department</label>
            <input
              value={profileForm.department}
              onChange={(e) => setProfileForm((p) => ({ ...p, department: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 h-fit">
          <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
            <Lock className="w-5 h-5 text-indigo-600" />
            Security & Password
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={pwdForm.old_password}
              onChange={(e) => setPwdForm((p) => ({ ...p, old_password: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={pwdForm.new_password}
              onChange={(e) => setPwdForm((p) => ({ ...p, new_password: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingPwd}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {savingPwd ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
