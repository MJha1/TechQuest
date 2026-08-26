import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tiny stale-while-revalidate cache for GET-style data.
 *
 * The app talks to a remote database, so a cold fetch can take seconds. Without
 * caching, navigating away and back re-mounts a page and shows a multi-second
 * loader every time — the "navigation is slow" pain. This module-level cache
 * lets a revisited page render its last data instantly while it revalidates in
 * the background; only the very first visit shows a loading state.
 *
 * Keys are plain strings (e.g. `child-missions:<id>`). Pages that read the same
 * data share a key, so navigating between them is instant.
 */

interface Entry {
  data: unknown;
  ts: number;
}

const store = new Map<string, Entry>();

/** Drop a cached entry so the next read refetches from scratch. */
export function invalidateCache(key: string): void {
  store.delete(key);
}

/** Drop everything — e.g. when the signed-in parent changes, or in tests. */
export function clearCache(): void {
  store.clear();
}

/** Seed the cache directly (e.g. after a mutation returns fresh data). */
export function primeCache(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}

interface Result<T> {
  data: T | undefined;
  /** True only when there is nothing to show yet (first visit). */
  loading: boolean;
  /** True only when a fetch failed and there is no cached data to fall back to. */
  error: boolean;
  /** Force a fresh fetch (bypasses the cache) — used by "Try again". */
  reload: () => void;
}

export function useCachedResource<T>(key: string, fetcher: () => Promise<T>): Result<T> {
  const cached = store.get(key)?.data as T | undefined;
  const [data, setData] = useState<T | undefined>(cached);
  const [loading, setLoading] = useState<boolean>(cached === undefined);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let active = true;
    const existing = store.get(key)?.data as T | undefined;
    setData(existing);
    setError(false);
    setLoading(existing === undefined); // show a loader only with nothing cached

    fetcherRef.current()
      .then((fresh) => {
        if (!active) return;
        store.set(key, { data: fresh, ts: Date.now() });
        setData(fresh);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        if (!active) return;
        // Keep stale data if we have it; only surface an error with nothing to show.
        if (existing === undefined) setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [key, tick]);

  const reload = useCallback(() => {
    store.delete(key);
    setTick((t) => t + 1);
  }, [key]);

  return { data, loading, error, reload };
}
