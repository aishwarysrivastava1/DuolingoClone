"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  labelledBy?: string;
  className?: string;
  /** Skip the default padding (for dialogs with full-bleed headers). */
  bare?: boolean;
  size?: "md" | "lg";
  children: React.ReactNode;
}

/** Centered dialog (bottom sheet on phones) rendered in a portal. */
export function Modal({ open, onClose, labelledBy, className, bare = false, size = "md", children }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;
  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "animate-pop-in max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-surface sm:rounded-3xl",
          size === "lg" ? "max-w-[560px]" : "max-w-[440px]",
          !bare && "p-6",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
