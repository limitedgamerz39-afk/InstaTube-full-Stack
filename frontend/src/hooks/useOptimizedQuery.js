import { useState, useEffect, useCallback, useRef } from 'react';

// ✅ Custom hook for optimized data fetching with caching and pagination
export const useOptimizedQuery = (fetchFunction, options = {}) => {
  const {
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
    initialData,
    enabled = true,
    pagination = false,
    pageSize = 10
  } = options;

  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const cacheRef = useRef(new Map());
  const lastFetchTimeRef = useRef(0);

  // ✅ Check if data is fresh
  const isDataFresh = useCallback(() => {
    if (!cacheKey) return false;
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < staleTime;
  }, [cacheKey, staleTime]);

  // ✅ Get cached data
  const getCachedData = useCallback(() => {
    if (!cacheKey) return null;
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > cacheTime) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    return cached.data;
  }, [cacheKey, cacheTime]);

  // ✅ Set cached data
  const setCachedData = useCallback((dataToCache) => {
    if (!cacheKey) return;
    cacheRef.current.set(cacheKey, {
      data: dataToCache,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // ✅ Clear expired cache entries
  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of cacheRef.current.entries()) {
      if (now - value.timestamp > cacheTime) {
        cacheRef.current.delete(key);
      }
    }
  }, [cacheTime]);

  // ✅ Fetch data function
  const fetchData = useCallback(async (options = {}) => {
    const { 
      force = false, 
      nextPage = false,
      params = {}
    } = options;

    // Don't fetch if disabled
    if (!enabled) return;

    // Check if we should use cached data
    if (!force && isDataFresh()) {
      return;
    }

    // Check cache for data
    if (!force) {
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Add pagination params if needed
      const fetchParams = pagination 
        ? { ...params, page: nextPage ? page + 1 : 1, limit: pageSize }
        : params;

      const result = await fetchFunction(fetchParams);
      
      if (pagination && nextPage) {
        // Append new data for pagination
        setData(prevData => ({
          ...prevData,
          data: [...prevData.data, ...result.data.data],
          pagination: result.data.pagination
        }));
        setPage(prevPage => prevPage + 1);
        setHasMore(result.data.pagination.hasMore);
      } else {
        // Replace data
        setData(result.data);
        if (pagination) {
          setHasMore(result.data.pagination.hasMore);
          setPage(1);
        }
      }

      // Cache the result
      setCachedData(result.data);
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      setError(err);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [
    enabled, 
    fetchFunction, 
    getCachedData, 
    isDataFresh, 
    page, 
    pageSize, 
    pagination, 
    setCachedData
  ]);

  // ✅ Load more data for pagination
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchData({ nextPage: true });
  }, [fetchData, hasMore, loading]);

  // ✅ Refetch data
  const refetch = useCallback(() => {
    fetchData({ force: true });
  }, [fetchData]);

  // ✅ Reset pagination
  const resetPagination = useCallback(() => {
    setPage(1);
    setHasMore(true);
  }, []);

  // ✅ Clear cache
  const clearCache = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    } else {
      cacheRef.current.clear();
    }
  }, [cacheKey]);

  // ✅ Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  // ✅ Clear expired cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      clearExpiredCache();
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [clearExpiredCache]);

  return {
    data,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    resetPagination,
    clearCache,
    isFetching: loading,
    isEmpty: !loading && (!data || (Array.isArray(data) ? data.length === 0 : !data.data))
  };
};

// ✅ Custom hook for infinite scroll pagination
export const useInfiniteScroll = (fetchFunction, options = {}) => {
  const {
    cacheKey,
    cacheTime = 5 * 60 * 1000,
    staleTime = 2 * 60 * 1000,
    pageSize = 10
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const cacheRef = useRef(new Map());

  const fetchData = useCallback(async (pageNum = 1) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction({ page: pageNum, limit: pageSize });
      
      if (pageNum === 1) {
        setData(result.data.data);
      } else {
        setData(prevData => [...prevData, ...result.data.data]);
      }

      setHasMore(result.data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, loading, pageSize]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchData(page + 1);
  }, [fetchData, hasMore, loading, page]);

  const refetch = useCallback(() => {
    fetchData(1);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    loadMore,
    hasMore,
    refetch,
    isEmpty: !loading && data.length === 0
  };
};

export default useOptimizedQuery;