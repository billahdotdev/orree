import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Check } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast({ message, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-40 sm:bottom-24 z-[90] flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.key}
            className="animate-toast-in flex items-center gap-2.5 rounded-full bg-green-deeper/95 backdrop-blur border border-amber/30 px-5 py-3 shadow-glass"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber shrink-0">
              <Check size={12} className="text-cream" strokeWidth={3} />
            </span>
            <span className="text-cream text-[14px] font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Toasts are a nicety, not a requirement — landing pages or tests that
  // render a component outside the provider still work, just silently.
  return ctx || { showToast: () => {} };
}
