"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

type ToastTone = "success" | "warning";

type ToastItem = {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
};

const ToastContext = createContext<{
  showToast: (input: { title: string; body?: string; tone?: ToastTone }) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((input: { title: string; body?: string; tone?: ToastTone }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [
      ...current,
      {
        id,
        title: input.title,
        body: input.body,
        tone: input.tone ?? "success"
      }
    ]);

    window.setTimeout(() => {
      startTransition(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      });
    }, 4200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions text">
        {toasts.map((toast) => (
          <article className={`toast-card ${toast.tone}`} key={toast.id}>
            <div className="feedback-banner-head">
              <strong>{toast.title}</strong>
              <button
                aria-label="Dismiss notification"
                className="feedback-dismiss"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                type="button"
              >
                x
              </button>
            </div>
            {toast.body ? <p>{toast.body}</p> : null}
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
