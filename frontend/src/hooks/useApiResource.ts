"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "@/lib/api";

interface Resource<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/** Fetches `load()` on mount and whenever `key` changes; stale responses are ignored. */
export function useApiResource<T>(key: string, load: () => Promise<T>): Resource<T> {
  const loadRef = useRef(load);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Omit<Resource<T>, "reload">>({ data: null, error: null, loading: true });

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    loadRef.current().then(
      (data) => active && setState({ data, error: null, loading: false }),
      (error) => active && setState((current) => ({ ...current, error: toApiError(error), loading: false })),
    );
    return () => {
      active = false;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
