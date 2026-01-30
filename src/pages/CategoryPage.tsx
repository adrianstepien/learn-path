import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, ChevronRight, Play } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getCategoryById } from '@/data/mockData';
import { Roadmap } from '@/types/learning';

const RoadmapCard = ({ roadmap, delay }: { roadmap: Roadmap; delay: number }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-lg hover:border-primary/20"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Play className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {roadmap.title}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{roadmap.description}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary shrink-0" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-secondary to-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground">
          {roadmap.topics.length} tematów
        </span>
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-secondary to-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground">
          {roadmap.totalQuestions} pytań
        </span>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground font-medium">Postęp</span>
          <span className="font-bold text-foreground">{roadmap.progress}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div 
            className="h-2.5 rounded-full gradient-primary transition-all duration-500"
            style={{ width: `${roadmap.progress}%` }}
          />
        </div>
      </div>

      <Button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/learn/roadmap/${roadmap.id}`);
        }}
        className="w-full shadow-md hover:shadow-glow"
        size="lg"
      >
        <Play className="mr-2 h-4 w-4" />
        Otwórz roadmapę
      </Button>
    </motion.div>
  );
};

const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const category = getCategoryById(categoryId || '');

  if (!category) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <p className="text-muted-foreground">Kategoria nie została znaleziona</p>
        </div>
      </MainLayout>
    );
  }

  const filteredRoadmaps = category.roadmaps.filter(roadmap =>
    roadmap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roadmap.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/learn')}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do kategorii
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl md:text-4xl">{category.icon}</span>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{category.name}</h1>
          </div>
          <p className="text-muted-foreground">{category.description}</p>
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
              placeholder="Szukaj roadmapy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Roadmaps Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRoadmaps.map((roadmap, index) => (
            <RoadmapCard key={roadmap.id} roadmap={roadmap} delay={0.1 + index * 0.05} />
          ))}
        </div>

        {filteredRoadmaps.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Nie znaleziono roadmap w tej kategorii</p>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default CategoryPage;
