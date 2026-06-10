import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

type ToastKind = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

// ── Provider ───────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — top-right */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 'min(340px, calc(100vw - 2rem))' }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── ToastItem ──────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const isSuccess = toast.kind === 'success';
  return (
    <div
      className={[
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[8px] shadow-card-md',
        'text-sm font-medium text-white',
        'animate-toast-in',
        isSuccess ? 'bg-[#437a22]' : 'bg-[#a12c7b]',
      ].join(' ')}
    >
      {isSuccess
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <XCircle className="w-4 h-4 flex-shrink-0" />
      }
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Hook ───────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
