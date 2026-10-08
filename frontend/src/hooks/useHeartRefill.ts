"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { api, toApiError } from "@/lib/api";
import type { Me } from "@/lib/types";

/** Spend gems on a full heart refill; guards against double submits. */
export function useHeartRefill() {
  const { setMe } = useUser();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const refill = useCallback(async (): Promise<Me | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setPending(true);
    try {
      const me = await api.refillHearts();
      setMe(me);
      toast("Hearts refilled!", { tone: "success", icon: "❤️" });
      return me;
    } catch (error) {
      toast(toApiError(error).message, { tone: "error" });
      return null;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [setMe, toast]);

  return { refill, pending };
}
