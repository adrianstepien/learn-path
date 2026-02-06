import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Play, BookOpen, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLearnData } from '@/hooks/useLearnData';
import { Category, Roadmap } from '@/types/learning';

const RoadmapMiniCard = ({ roadmap }: { roadmap: Roadmap }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3 transition-all hover:bg-secondary/50">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate text-sm">{roadmap.title}</p>
        <p className="text-xs text-muted-foreground">
          {roadmap.topics.length} tematów • {roadmap.progress}% ukończone
        </p>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/learn/roadmap/${roadmap.id}`);
          }}
        >
          <BookOpen className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          className="h-8 px-3"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/learn/study?roadmap=${roadmap.id}`);
          }}
        >
          <Play className="h-3 w-3 mr-1" />
          Ucz się
        </Button>
      </div>
    </div>
  );
};

const CategoryCard = ({ 
  category, 
  delay, 
  onExpand,
  isExpanded,
  roadmaps,
  isLoadingRoadmaps,
}: { 
  category: Category; 
  delay: number;
  onExpand: () => void;
  isExpanded: boolean;
  roadmaps: Roadmap[];
  isLoadingRoadmaps: boolean;
}) => {
  const navigate = useNavigate();

  const totalTopics = roadmaps.reduce((sum, r) => sum + r.topics.length, 0);
  const displayRoadmapCount = isExpanded ? roadmaps.length : category.roadmaps.length;

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
        onClick={() => navigate(`/learn/category/${category.id}`)}
        className="cursor-pointer p-4 md:p-6 pb-4 transition-all hover:bg-gradient-to-br hover:from-secondary/50 hover:to-transparent"
      >
        <div className="mb-3 md:mb-4 flex items-center justify-between">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <span className="text-2xl md:text-3xl">{category.icon}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <h3 className="mb-2 text-base md:text-lg font-bold text-foreground">{category.name}</h3>
        <p className="mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground line-clamp-2">{category.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
            {displayRoadmapCount} roadmap{displayRoadmapCount !== 1 ? 'y' : 'a'} {isExpanded && `• ${totalTopics} tematów`}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 md:w-20 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-2 rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${category.progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-foreground">{category.progress}%</span>
          </div>
        </div>
      </div>

      {/* Study Button */}
      <div className="border-t border-border px-4 md:px-6 py-4 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Button 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/learn/study?category=${category.id}`);
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            Ucz się w kategorii
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="shrink-0"
          >
            {isLoadingRoadmaps ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            )}
          </Button>
        </div>

        {/* Expandable roadmaps list */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {isLoadingRoadmaps ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : roadmaps.length > 0 ? (
              roadmaps.map(roadmap => (
                <RoadmapMiniCard key={roadmap.id} roadmap={roadmap} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak roadmap w tej kategorii
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

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

const LearnPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categoryRoadmaps, setCategoryRoadmaps] = useState<Record<string, Roadmap[]>>({});
  const [loadingRoadmapsFor, setLoadingRoadmapsFor] = useState<string | null>(null);
  
  const { categories, isLoading, loadRoadmaps, roadmaps } = useLearnData();

  const handleExpandCategory = async (categoryId: string) => {
    if (expandedCategoryId === categoryId) {
      setExpandedCategoryId(null);
      return;
    }

    setExpandedCategoryId(categoryId);
    
    // Check if we already loaded roadmaps for this category
    if (!categoryRoadmaps[categoryId]) {
      setLoadingRoadmapsFor(categoryId);
      await loadRoadmaps(categoryId);
    }
  };

  // Update category roadmaps when roadmaps change
  useEffect(() => {
    if (expandedCategoryId && roadmaps.length > 0) {
      setCategoryRoadmaps(prev => ({
        ...prev,
        [expandedCategoryId]: roadmaps,
      }));
      setLoadingRoadmapsFor(null);
    }
  }, [roadmaps, expandedCategoryId]);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Nauka</h1>
              <p className="text-sm text-muted-foreground">
                Wybierz kategorię, aby rozpocząć naukę
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 md:mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj kategorii lub roadmapy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category, index) => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                delay={index * 0.05}
                isExpanded={expandedCategoryId === category.id}
                onExpand={() => handleExpandCategory(category.id)}
                roadmaps={categoryRoadmaps[category.id] || category.roadmaps}
                isLoadingRoadmaps={loadingRoadmapsFor === category.id}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredCategories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Nie znaleziono kategorii</p>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default LearnPage;
