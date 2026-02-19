import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Category } from '@/types/learning';
import { CategoryCard } from './CategoryCard';

interface CategoryGridProps {
  categories: Category[];
  isLoading: boolean;
  isExpanded: (categoryId: string) => boolean;
  onExpand: (categoryId: string) => void;
  isLoadingCategory: (categoryId: string) => boolean;
}

const CategorySkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-12 w-12 md:h-14 md:w-14 rounded-xl" />
      <Skeleton className="h-5 w-5" />
    </div>
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-full mb-4" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-2 w-20" />
    </div>
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-12"
  >
    <p className="text-muted-foreground">Nie znaleziono kategorii</p>
  </motion.div>
);

/**
 * Presentational component for displaying the grid of category cards
 * Follows SRP - only responsible for rendering the grid layout and states
 */
export const CategoryGrid = ({
  categories,
  isLoading,
  isExpanded,
  onExpand,
  isLoadingCategory,
}: CategoryGridProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <CategorySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category, index) => (
        <CategoryCard
          key={category.id}
          category={category}
          delay={index * 0.05}
          isExpanded={isExpanded(category.id)}
          onExpand={() => onExpand(category.id)}
          isLoadingRoadmaps={isLoadingCategory(category.id)}
        />
      ))}
    </div>
  );
};