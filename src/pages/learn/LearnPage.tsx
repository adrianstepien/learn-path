import { MainLayout } from '@/components/layout/MainLayout';
import { useLearnCategory } from '@/hooks/queries/useLearnCategory';
import { useCategorySearch } from '@/pages/learn/hooks/useCategorySearch';
import { LearnPageHeader } from '@/pages/learn/components/LearnPageHeader';
import { SearchBar } from '@/pages/learn/components/SearchBar';
import { CategoryGrid } from '@/pages/learn/components/CategoryGrid';

/**
 * Main Learn Page Component
 *
 * Refactored to follow SOLID principles (especially SRP):
 * - Delegates state management to custom hooks
 * - Delegates UI rendering to presentational components
 * - Acts as a coordinator/orchestrator with minimal logic
 *
 * Responsibilities:
 * 1. Compose the page layout
 * 2. Connect hooks with presentational components
 * 3. Maintain the same public API and functionality
 */
const LearnPage = () => {
  // Data fetching layer
  const { categories, isLoading } = useLearnCategory();

  // Business logic layer - Search filtering
  const {
    searchQuery,
    setSearchQuery,
    filteredCategories,
  } = useCategorySearch(categories);

  // Presentation layer - Pure composition
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
        />
      </div>
    </MainLayout>
  );
};

export default LearnPage;