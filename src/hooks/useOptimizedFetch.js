/**
 * useOptimizedFetch.js
 * =====================================================
 * React hooks for optimized data fetching
 * Prevents multiple requests, adds caching, debouncing
 * =====================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounced value hook
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Optimized fetch with caching, pagination, and debouncing
 * @param {Function} fetchFn - Async function to fetch data
 * @param {object} options - { deps, pageSize, cacheKey, debounceMs }
 */
export function useOptimizedFetch(fetchFn, options = {}) {
  const {
    deps = [],
    pageSize = 20,
    cacheKey = null,
    debounceMs = 300,
    initialPage = 0
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Refs for preventing stale closures and duplicate calls
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

  // Debounced dependencies
  const debouncedPage = useDebounce(page, debounceMs);
  const debouncedDeps = useDebounce(deps, debounceMs);

  const getCacheKey = useCallback((p, d) => {
    if (cacheKey) return cacheKey;
    return `fetch_${JSON.stringify({ page: p, deps: d })}`;
  }, [cacheKey, debouncedDeps]);

  const fetchData = useCallback(async (pageNum, depsValues) => {
    if (isFetchingRef.current) return;

    const cacheKeyCurrent = getCacheKey(pageNum, depsValues);

    // Check cache first
    if (cacheRef.current.has(cacheKeyCurrent)) {
      const cached = cacheRef.current.get(cacheKeyCurrent);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
        setData(cached.data);
        setTotal(cached.total || 0);
        setLoading(false);
        return;
      }
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const result = await Promise.race([
        fetchFn({ page: pageNum, pageSize, deps: depsValues }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout (10s)')), 10000)
        )
      ]);

      // Normalize result
      const items = result?.items || result || [];
      const totalCount = result?.total || items.length;
      const normalizedData = Array.isArray(result) ? result : items;

      // Cache the result
      cacheRef.current.set(cacheKeyCurrent, {
        data: normalizedData,
        total: totalCount,
        timestamp: Date.now()
      });

      setData(normalizedData);
      setTotal(totalCount);
      setHasMore((pageNum + 1) * pageSize < totalCount);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[useOptimizedFetch] Error:', err);
        setError(err.message);
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [fetchFn, pageSize, getCacheKey]);

  // Main effect
  useEffect(() => {
    fetchData(debouncedPage, debouncedDeps);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedPage, debouncedDeps, fetchData]);

  // Pagination helpers
  const nextPage = useCallback(() => {
    if (hasMore) setPage(p => p + 1);
  }, [hasMore]);

  const prevPage = useCallback(() => {
    setPage(p => Math.max(0, p - 1));
  }, []);

  const goToPage = useCallback((p) => {
    setPage(p);
  }, []);

  const refresh = useCallback(() => {
    // Clear cache for current key
    const key = getCacheKey(page, deps);
    cacheRef.current.delete(key);
    fetchData(page, deps);
  }, [page, deps, fetchData, getCacheKey]);

  return {
    data,
    loading,
    error,
    page,
    total,
    hasMore,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    setPage
  };
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback(callback, delay = 300) {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      // Schedule for later
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
}

/**
 * Lazy load component
 */
export function useLazyComponent(importFn) {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadRef = useRef(false);

  const load = useCallback(async () => {
    if (loadRef.current || Component) return;
    loadRef.current = true;
    setLoading(true);

    try {
      const mod = await importFn();
      setComponent(() => mod.default || mod);
    } catch (err) {
      console.error('[useLazyComponent] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [importFn, Component]);

  return { Component, loading, load };
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      threshold: 0.1,
      ...options
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
}

export default {
  useDebounce,
  useOptimizedFetch,
  useThrottledCallback,
  useLazyComponent,
  useIntersectionObserver
};
