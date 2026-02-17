import { useEditorCategories } from '@/hooks/queries/useEditorCategories';
import { useEditorStore } from '@/stores/editorStore';
import { useCategorySearch } from '@/pages/learn/hooks/useCategorySearch';

export function useEditorCategoryService() {
  const ui = useEditorStore();
  const { data: categories = [], isLoading, error } = useEditorCategories();
  const { searchQuery, setSearchQuery, filteredCategories } =
    useCategorySearch(categories);

  const selectCategory = (categoryId: string | null) => {
    ui.setSelectedCategoryId(categoryId);
  };

  const selectRoadmap = (roadmapId: string | null) => {
    ui.setSelectedRoadmapId(roadmapId);
  };

  const selectedCategory =
    categories.find((c) => c.id === ui.selectedCategoryId) ?? null;

  return {
    searchQuery,
    setSearchQuery,
    filteredCategories,
    selectedCategory,
    selectCategory,
    selectRoadmap,
    isLoading,
    error,
  };
}

