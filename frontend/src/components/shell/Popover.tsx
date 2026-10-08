"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface HoverPopoverProps {
  label: string;
  trigger: React.ReactNode;
  align?: "left" | "center" | "right";
  triggerClassName?: string;
  children: (close: () => void) => React.ReactNode;
}

const DEFAULT_TRIGGER = "flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[17px] font-extrabold hover:bg-surface-2";

const ALIGN = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
};

/** Opens on hover for mouse users and on tap for touch users, like Duolingo's top-bar menus. */
export function HoverPopover({ label, trigger, align = "center", triggerClassName, children }: HoverPopoverProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const pointerType = useRef<string>("mouse");

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <div
      ref={root}
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        closeTimer.current = window.setTimeout(() => setOpen(false), 120);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onPointerDown={(event) => (pointerType.current = event.pointerType)}
        onClick={() => setOpen((current) => (pointerType.current === "mouse" ? true : !current))}
        className={triggerClassName ?? DEFAULT_TRIGGER}
      >
        {trigger}
      </button>
      {open && (
        <div className={cn("absolute top-full z-40 pt-2", ALIGN[align])}>
          <div className="card animate-pop-in w-[min(340px,calc(100vw-2rem))] p-5 shadow-xl">
            {children(() => setOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
}
