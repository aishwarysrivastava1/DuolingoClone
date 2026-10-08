"use client";

import { useEffect, useRef } from "react";

/** Calls `onKey(digit)` for 0-9 key presses (ignored while typing in a field). */
export function useNumberKeys(onKey: (digit: number) => void, enabled: boolean) {
  const handler = useRef(onKey);
  useEffect(() => {
    handler.current = onKey;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.metaKey || event.ctrlKey || event.altKey || !/^[0-9]$/.test(event.key)) return;
      handler.current(Number(event.key));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
