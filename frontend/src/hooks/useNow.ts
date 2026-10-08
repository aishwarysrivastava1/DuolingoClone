"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

/** The server's current time in ms, re-rendering every second while `active`. */
export function useNow(active = true): number {
  const { clockSkew } = useUser();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now + clockSkew;
}
