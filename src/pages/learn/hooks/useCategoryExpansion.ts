import { useState, useCallback } from 'react';

// Usuwamy propsy związane z ładowaniem danych
export const useCategoryExpansion = () => {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    setExpandedCategoryId(prev => (prev === categoryId ? null : categoryId));
  }, []);

  return {
    expandedCategoryId,
    toggleCategoryExpansion,
    isExpanded: (id: string) => expandedCategoryId === id,
  };
};