import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'success', duration = 3600) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 4500),
    info: (msg, dur) => addToast(msg, 'info', dur),
    showToast: (msg, type = 'success', dur) => addToast(msg, type, dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const styles = {
            success: 'bg-white border-emerald-200 text-slate-900 shadow-emerald-950/10',
            error: 'bg-white border-rose-200 text-slate-900 shadow-rose-950/10',
            info: 'bg-white border-indigo-200 text-slate-900 shadow-indigo-950/10',
          }[t.type];
          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            info: Info,
          }[t.type];
          const iconColor = {
            success: 'text-emerald-600',
            error: 'text-rose-600',
            info: 'text-indigo-600',
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto animate-toast flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${styles}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <p className="text-sm font-medium leading-snug flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
