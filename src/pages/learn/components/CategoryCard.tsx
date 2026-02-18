import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Category, Roadmap } from '@/types/learning';
import { RoadmapMiniCard } from './RoadmapMiniCard';

interface CategoryCardProps {
  category: Category;
  delay: number;
  onExpand: () => void;
  isExpanded: boolean;
  roadmaps: Roadmap[];
  isLoadingRoadmaps: boolean;
}

/**
 * Presentational component for displaying a category card
 * Follows SRP - only responsible for rendering category info and delegating actions
 */
export const CategoryCard = ({
  category,
  delay,
  onExpand,
  isExpanded,
  roadmaps,
  isLoadingRoadmaps,
}: CategoryCardProps) => {
  const navigate = useNavigate();

  const totalTopics = roadmaps.reduce((sum, r) => sum + r.topics.length, 0);
  const displayRoadmapCount = isExpanded ? roadmaps.length : category.roadmaps.length;

  const handleNavigateToCategory = () => {
    navigate(`/learn/roadmap/${category.id}`, {
      state: {
        name: category.name,
        description: category.description,
        icon: category.icon
      }
    });
  };

  const handleStartCategoryStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/learn/study?category=${category.id}&mode=SRS`);
  };

  const handleReviewCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/learn/study?category=${category.id}&mode=FUTURE`);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -4 }}
      className="group rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden"
    >
      {/* Header - clickable to navigate */}
      <div
        onClick={handleNavigateToCategory}
        className="cursor-pointer p-4 md:p-6 pb-4 transition-all hover:bg-gradient-to-br hover:from-secondary/50 hover:to-transparent"
      >
        <div className="mb-3 md:mb-4 flex items-center justify-between">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <span className="text-2xl md:text-3xl">{category.icon}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <h3 className="mb-2 text-base md:text-lg font-bold text-foreground">
          {category.name}
        </h3>
        <p className="mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground line-clamp-2">
          {category.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
            {displayRoadmapCount} roadmap{displayRoadmapCount !== 1 ? 'y' : 'a'}{' '}
            {isExpanded && `• ${totalTopics} tematów`}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 md:w-20 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-2 rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${category.progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-foreground">
              {category.progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Study Button */}
      <div className="border-t border-border/50 px-6 py-4 bg-gradient-to-b from-secondary/30 to-secondary/10">
        <div className="flex items-center gap-2">
          <Button
            className="flex-1"
            onClick={handleStartCategoryStudy}
          >
            <Play className="h-4 w-4 mr-2" />
            Ucz się w kategorii
          </Button>

          <Button
            variant="outline"
            className="shrink-0 px-3 transition-colors hover:bg-background hover:text-primary hover:border-primary/20 border border-transparent"
            onClick={handleReviewCategory}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <span>Powtórz</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};