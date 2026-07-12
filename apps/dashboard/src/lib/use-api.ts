'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from './api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Client-side GET hook. Re-fetches when `path` changes or `refetch` is called.
 * Returns loading and error state for graceful UI.
 */
export function useApiData<T>(path: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiFetch<T>(path)
      .then((res) => {
        if (active.current) setData(res);
      })
      .catch((err: Error) => {
        if (active.current) setError(err.message);
      })
      .finally(() => {
        if (active.current) setLoading(false);
      });
    return () => {
      active.current = false;
    };
  }, [path, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, refetch };
}
