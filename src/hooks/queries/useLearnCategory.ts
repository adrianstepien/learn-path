import { useState, useEffect, useCallback } from 'react';
import { Category} from '@/types/learning';
import { mockCategories } from '@/data/mockData';
import * as api from '@/lib/api';
import { getCategoriesWithProgress } from '@/lib/api/learnProgress';
import { CategoryDto } from '@/lib/api/types';

// ===== DTO to Domain Mappers =====

const mapCategoryDtoToCategory = (dto: CategoryDto): Category => ({
  id: String(dto.categoryId),
  name: dto.title,
  description: dto.description,
  icon: dto.iconData || '📁',
  totalCards: dto.totalCards,
  dueCards: dto.dueCards,
  progress: dto.totalCards > 0
    ? Math.round(((dto.totalCards - dto.dueCards) / dto.totalCards) * 100)
    : 0,
});

interface UseLearnCategoryReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  selectedCategoryId: string | null;
  loadCategories: () => Promise<void>;
}

export const useLearnCategory = (): UseLearnCategoryReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
        const categoryDtos = await getCategoriesWithProgress();
        const mappedCategories = categoryDtos.map(dto => mapCategoryDtoToCategory(dto));
        setCategories(mappedCategories);
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Fallback to mock data on error
      setCategories(mockCategories);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    isLoading,
    error,
    selectedCategoryId,
    loadCategories,
  };
};
