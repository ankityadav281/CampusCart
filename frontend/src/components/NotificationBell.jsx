import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ unread_count: 0, notifications: [] });
  const ref = useRef(null);

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationAPI.list();
      setData(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      loadNotifications();
    } catch {
      // silent
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationAPI.markAllRead();
      loadNotifications();
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) loadNotifications();
        }}
        className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {data.unread_count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {data.unread_count > 9 ? '9+' : data.unread_count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
            {data.unread_count > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {data.notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : (
              data.notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
