import { useState, useMemo, useCallback } from 'react';
import { Category } from '@/types/learning';

interface UseCategorySearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredCategories: Category[];
  hasResults: boolean;
}

/**
 * Custom hook to manage category search functionality
 * Follows SRP by handling only search/filter logic
 */
export const useCategorySearch = (
  categories: Category[]
): UseCategorySearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filter categories based on search query
   * Searches in both name and description
   */
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  /**
   * Check if search has any results
   */
  const hasResults = filteredCategories.length > 0;

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    filteredCategories,
    hasResults,
  };
};