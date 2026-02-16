import { useCallback, useMemo, useState } from 'react';

import type { Category } from '@/types/learning';
import type { useEditorStore } from '@/stores/editorStore';

type EditorStore = ReturnType<typeof useEditorStore>;

export function useEditorCategoryService(store: EditorStore) {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCategory = store.getSelectedCategory();

  const filteredCategories = useMemo(
    () =>
      store.state.categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [store.state.categories, searchQuery]
  );

  const selectCategory = useCallback(
    (categoryId: string | null) => {
      store.selectCategory(categoryId);
    },
    [store]
  );

  const selectRoadmap = useCallback(
    (roadmapId: string | null) => {
      store.selectRoadmap(roadmapId);
    },
    [store]
  );


  return {
    searchQuery,
    setSearchQuery,
    filteredCategories,
    selectedCategory,
    selectCategory,
    selectRoadmap,
  };
}

