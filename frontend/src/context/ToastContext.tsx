"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type ToastTone = "info" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  icon?: string;
}

type ShowToast = (message: string, options?: { tone?: ToastTone; icon?: string }) => void;

const ToastContext = createContext<ShowToast | null>(null);

const TONE_CLASSES: Record<ToastTone, string> = {
  info: "border-line bg-surface text-ink",
  success: "border-feather bg-correct-bg text-correct-ink",
  error: "border-cardinal bg-wrong-bg text-wrong-ink",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const show = useCallback<ShowToast>((message, options = {}) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, message, tone: options.tone ?? "info", icon: options.icon }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  }, []);

  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "animate-pop-in flex items-center gap-2 rounded-2xl border-2 px-4 py-3 text-[15px] font-bold shadow-lg",
              TONE_CLASSES[toast.tone],
            )}
          >
            {toast.icon && <span aria-hidden>{toast.icon}</span>}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside <ToastProvider>");
  return value;
}
