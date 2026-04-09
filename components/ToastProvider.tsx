"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastCtx = { toast: (message: string) => void };

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message ? (
        <div
          className="pointer-events-auto fixed bottom-24 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-2xl border border-amber-900/20 bg-[#fdf8f0] px-4 py-3 text-center text-sm font-semibold text-[#3d3020] shadow-lg"
          style={{ fontFamily: "Nunito, sans-serif" }}
          role="status"
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useFernhollowToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (m: string) => {
        if (typeof window !== "undefined") window.alert(m);
      },
    };
  }
  return ctx;
}
