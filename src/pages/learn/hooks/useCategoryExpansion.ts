import { useState, useEffect, useCallback } from 'react';
import { Roadmap } from '@/types/learning';

interface UseCategoryExpansionProps {
  loadRoadmaps: (categoryId: string) => Promise<void>;
  roadmaps: Roadmap[];
}

interface UseCategoryExpansionReturn {
  expandedCategoryId: string | null;
  categoryRoadmaps: Record<string, Roadmap[]>;
  loadingRoadmapsFor: string | null;
  toggleCategoryExpansion: (categoryId: string) => Promise<void>;
  isExpanded: (categoryId: string) => boolean;
  getRoadmapsForCategory: (categoryId: string, fallback: Roadmap[]) => Roadmap[];
  isLoadingCategory: (categoryId: string) => boolean;
}

/**
 * Custom hook to manage category expansion state and roadmap loading
 * Follows SRP by handling only expansion/collapse logic and caching
 */
export const useCategoryExpansion = ({
  loadRoadmaps,
  roadmaps,
}: UseCategoryExpansionProps): UseCategoryExpansionReturn => {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categoryRoadmaps, setCategoryRoadmaps] = useState<Record<string, Roadmap[]>>({});
  const [loadingRoadmapsFor, setLoadingRoadmapsFor] = useState<string | null>(null);

  /**
   * Toggle category expansion and load roadmaps if needed
   */
  const toggleCategoryExpansion = useCallback(async (categoryId: string) => {
    // If clicking the same category, collapse it
    if (expandedCategoryId === categoryId) {
      setExpandedCategoryId(null);
      return;
    }

    // Expand the category
    setExpandedCategoryId(categoryId);

    // Load roadmaps if not already cached
    if (!categoryRoadmaps[categoryId]) {
      setLoadingRoadmapsFor(categoryId);
      await loadRoadmaps(categoryId);
    }
  }, [expandedCategoryId, categoryRoadmaps, loadRoadmaps]);

  /**
   * Update cache when roadmaps are loaded
   */
  useEffect(() => {
    if (expandedCategoryId && roadmaps.length > 0) {
      setCategoryRoadmaps(prev => ({
        ...prev,
        [expandedCategoryId]: roadmaps,
      }));
      setLoadingRoadmapsFor(null);
    }
  }, [roadmaps, expandedCategoryId]);

  /**
   * Check if a category is expanded
   */
  const isExpanded = useCallback((categoryId: string) => {
    return expandedCategoryId === categoryId;
  }, [expandedCategoryId]);

  /**
   * Get roadmaps for a category (from cache or fallback)
   */
  const getRoadmapsForCategory = useCallback((categoryId: string, fallback: Roadmap[]) => {
    return categoryRoadmaps[categoryId] || fallback;
  }, [categoryRoadmaps]);

  /**
   * Check if roadmaps are currently loading for a category
   */
  const isLoadingCategory = useCallback((categoryId: string) => {
    return loadingRoadmapsFor === categoryId;
  }, [loadingRoadmapsFor]);

  return {
    expandedCategoryId,
    categoryRoadmaps,
    loadingRoadmapsFor,
    toggleCategoryExpansion,
    isExpanded,
    getRoadmapsForCategory,
    isLoadingCategory,
  };
};