import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Play, BookOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockCategories } from '@/data/mockData';
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
            // Navigate to study mode for first topic or random
            if (roadmap.topics.length > 0) {
              navigate(`/learn/study/${roadmap.topics[0].id}`);
            }
          }}
        >
          <Play className="h-3 w-3 mr-1" />
          Ucz się
        </Button>
      </div>
    </div>
  );
};

const CategoryCard = ({ category, delay }: { category: Category; delay: number }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const totalTopics = category.roadmaps.reduce((sum, r) => sum + r.topics.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group rounded-2xl border border-border bg-card shadow-md transition-all hover:shadow-lg overflow-hidden"
    >
      {/* Header - clickable to navigate */}
      <div 
        onClick={() => navigate(`/learn/category/${category.id}`)}
        className="cursor-pointer p-6 pb-4 transition-colors hover:bg-secondary/30"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-4xl">{category.icon}</span>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{category.name}</h3>
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{category.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {category.roadmaps.length} roadmap{category.roadmaps.length !== 1 ? 'y' : 'a'} • {totalTopics} tematów
          </span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-secondary">
              <div 
                className="h-2 rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${category.progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{category.progress}%</span>
          </div>
        </div>
      </div>

      {/* Study Button */}
      <div className="border-t border-border/50 px-6 py-4 bg-secondary/20">
        <div className="flex items-center gap-2">
          <Button 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to study mode for a random topic from this category
              const allTopics = category.roadmaps.flatMap(r => r.topics);
              if (allTopics.length > 0) {
                const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
                navigate(`/learn/study/${randomTopic.id}`);
              }
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            Ucz się w kategorii
          </Button>
          {category.roadmaps.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="shrink-0"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </Button>
          )}
        </div>

        {/* Expandable roadmaps list */}
        {isExpanded && category.roadmaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {category.roadmaps.map(roadmap => (
              <RoadmapMiniCard key={roadmap.id} roadmap={roadmap} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const LearnPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = mockCategories.filter(cat =>
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
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nauka</h1>
          <p className="mt-2 text-muted-foreground">
            Wybierz kategorię, aby rozpocząć naukę
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} delay={0.1 + index * 0.05} />
          ))}
        </div>

        {filteredCategories.length === 0 && (
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
