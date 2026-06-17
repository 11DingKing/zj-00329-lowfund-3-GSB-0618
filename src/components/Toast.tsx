import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; text: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
  },
  error: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    icon: XCircle,
    iconColor: 'text-rose-500',
  },
  info: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-800',
    icon: Info,
    iconColor: 'text-sky-500',
  },
};

function ToastView({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) {
  const cfg = TOAST_CONFIG[toast.type];
  const Icon = cfg.icon;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${cfg.bg} ${cfg.border} animate-[slideIn_0.3s_ease-out] min-w-[280px] max-w-[400px]`}
    >
      <Icon size={20} className={cfg.iconColor} />
      <span className={`flex-1 text-sm font-medium ${cfg.text}`}>{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white/50"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastView toast={t} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
