import { MainLayout } from '@/components/layout/MainLayout';
import { useCategories } from '@/hooks/queries/useCategories';
import { useRoadmaps } from '@/hooks/queries/useRoadmaps';
import { useCategoryExpansion } from '@/pages/learn/hooks/useCategoryExpansion';
import { useCategorySearch } from '@/pages/learn/hooks/useCategorySearch';
import { LearnPageHeader } from '@/pages/learn/components/LearnPageHeader';
import { SearchBar } from '@/pages/learn/components/SearchBar';
import { CategoryGrid } from '@/pages/learn/components/CategoryGrid';
import { useMemo } from 'react';

const LearnPage = () => {
  // 1. Pobieranie Kategorii (React Query)
  const { data: categories = [], isLoading } = useCategories();

  // 2. Logika UI - rozwijanie
  const {
    expandedCategoryId,
    toggleCategoryExpansion,
    isExpanded
  } = useCategoryExpansion();

  // 3. Pobieranie Roadmap dla rozwiniętej kategorii (Dependent Query)
  // React Query automatycznie pobierze to, gdy expandedCategoryId będzie ustawione
  const { data: expandedRoadmaps = [], isLoading: isLoadingRoadmaps } = useRoadmaps(expandedCategoryId || undefined);

  // 4. Łączenie danych: Wstrzykujemy pobrane roadmapy do odpowiedniej kategorii w liście
  // To pozwala zachować interfejs CategoryGrid bez zmian
  const categoriesWithRoadmaps = useMemo(() => {
    if (!expandedCategoryId) return categories;

    return categories.map(cat => {
      if (cat.id === expandedCategoryId) {
        return { ...cat, roadmaps: expandedRoadmaps };
      }
      return cat;
    });
  }, [categories, expandedCategoryId, expandedRoadmaps]);

  // 5. Logika wyszukiwania
  const {
    searchQuery,
    setSearchQuery,
    filteredCategories,
  } = useCategorySearch(categoriesWithRoadmaps);

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <LearnPageHeader />

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <CategoryGrid
          categories={filteredCategories}
          isLoading={isLoading}
          isExpanded={isExpanded}
          onExpand={toggleCategoryExpansion}
          // Tutaj przekazujemy funkcję, która zwraca roadmapy z połączonych danych
          getRoadmaps={(id) => {
             // W tym podejściu dane są już w obiekcie kategorii dzięki useMemo powyżej,
             // ale dla kompatybilności Grid może oczekiwać tablicy:
             return categoriesWithRoadmaps.find(c => c.id === id)?.roadmaps || [];
          }}
          isLoadingCategory={(id) => id === expandedCategoryId && isLoadingRoadmaps}
        />
      </div>
    </MainLayout>
  );
};

export default LearnPage;