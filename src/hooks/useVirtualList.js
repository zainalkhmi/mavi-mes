import { useState, useMemo } from 'react';

/**
 * Custom hook for lightweight DOM list virtualization & pagination windowing.
 *
 * @param {Array} items - Raw array of data items
 * @param {Object} options - Options object
 * @param {number} [options.pageSize=15] - Number of items per page/window
 * @param {string} [options.searchKeyword=''] - Keyword to filter items
 * @param {Array<string>} [options.searchFields=[]] - Item property keys to search in
 * @returns {Object} Virtualized list state and navigation handlers
 */
export function useVirtualList(items = [], options = {}) {
  const {
    pageSize: initialPageSize = 15,
    searchKeyword = '',
    searchFields = []
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter items based on search keyword & fields
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return items;

    return items.filter((item) => {
      if (!item) return false;

      // If searchFields specified, check only those keys
      if (searchFields.length > 0) {
        return searchFields.some((field) => {
          const val = item[field];
          return String(val ?? '').toLowerCase().includes(kw);
        });
      }

      // Otherwise search all string/number values of the item
      return Object.values(item).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(kw);
        }
        return false;
      });
    });
  }, [items, searchKeyword, searchFields]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  // Calculate window slice
  const virtualItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return {
    virtualItems,
    filteredItems,
    totalItems,
    totalPages,
    currentPage: safePage,
    pageSize,
    setCurrentPage,
    setPageSize,
    nextPage,
    prevPage,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1
  };
}
