"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, api, toApiError } from "@/lib/api";
import type { Me } from "@/lib/types";

interface UserContextValue {
  me: Me | null;
  error: ApiError | null;
  /** Server clock minus browser clock, in ms (non-zero when days are simulated). */
  clockSkew: number;
  refresh: () => Promise<void>;
  setMe: (me: Me) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

/** Holds the learner's stats (hearts, streak, XP, gems) shared by every screen. */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ me: Me | null; clockSkew: number }>({ me: null, clockSkew: 0 });
  const [error, setError] = useState<ApiError | null>(null);

  const setMe = useCallback((me: Me) => {
    setState({ me, clockSkew: new Date(me.server_time).getTime() - Date.now() });
  }, []);

  const refresh = useCallback(async () => {
    try {
      setMe(await api.me());
      setError(null);
    } catch (err) {
      setError(toApiError(err));
    }
  }, [setMe]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Hearts regenerate on the server clock; re-fetch when the next one is due.
  const { me, clockSkew } = state;
  const nextHeartAt = me?.hearts.next_heart_at;
  useEffect(() => {
    if (!nextHeartAt) return;
    const delay = Math.max(1000, new Date(nextHeartAt).getTime() - (Date.now() + clockSkew) + 500);
    const timer = window.setTimeout(() => void refresh(), Math.min(delay, 2 ** 31 - 1));
    return () => window.clearTimeout(timer);
  }, [nextHeartAt, clockSkew, refresh]);

  const value = useMemo(() => ({ me, error, clockSkew, refresh, setMe }), [me, error, clockSkew, refresh, setMe]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const value = useContext(UserContext);
  if (!value) throw new Error("useUser must be used inside <UserProvider>");
  return value;
}
