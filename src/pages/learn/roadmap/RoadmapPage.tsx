import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, ChevronRight, Play, RotateCcw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getCategoryById } from '@/data/mockData';
import { Roadmap } from '@/types/learning';
import { useRoadmaps } from '@/hooks/queries/useRoadmaps';
import * as api from '@/lib/api';

const RoadmapCard = ({ roadmap, categoryId, delay }: { roadmap: Roadmap; categoryId: string; delay: number }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="group rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden"
    >
      {/* Header - clickable to navigate to roadmap view */}
      <div
        onClick={() => navigate(`/learn/${categoryId}/topic/${roadmap.id}`)}
        className="cursor-pointer p-6 pb-4 transition-all hover:bg-gradient-to-br hover:from-secondary/50 hover:to-transparent"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Play className="h-6 w-6 text-primary" />
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-foreground">{roadmap.title}</h3>
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{roadmap.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
            {(roadmap.topics?.length || 0)} tematów • {(roadmap.totalQuestions || 0)} pytań
          </span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-2 rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${roadmap.progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-foreground">{roadmap.progress}%</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 px-6 py-4 bg-gradient-to-b from-secondary/30 to-secondary/10">
        <div className="flex items-center gap-2">
          <Button
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/learn/study?roadmap=${roadmap.id}&mode=SRS`);
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            Ucz się w roadmapie
          </Button>

          <Button
            variant="outline"
            className="shrink-0 px-3 transition-colors hover:bg-background hover:text-primary hover:border-primary/20 border border-transparent"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/learn/study?roadmap=${roadmap.id}&mode=FUTURE`);
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <span>Powtórz</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const RoadmapPage = () => {
  const { categoryId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const { data: roadmaps = [], isLoading } = useRoadmaps(categoryId);

  const filteredRoadmaps = roadmaps.filter(roadmap =>
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
            <span className="text-3xl md:text-4xl">{state.icon}</span>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{state.name}</h1>
          </div>
          <p className="text-muted-foreground">{state.description}</p>
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredRoadmaps.map((roadmap, index) => (
            <RoadmapCard key={roadmap.id} roadmap={roadmap} categoryId={categoryId!} delay={0.1 + index * 0.05} />
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

export default RoadmapPage;