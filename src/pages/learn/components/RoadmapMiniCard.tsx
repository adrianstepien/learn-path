import { useNavigate } from 'react-router-dom';
import { Play, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Roadmap } from '@/types/learning';

interface RoadmapMiniCardProps {
  roadmap: Roadmap;
}

/**
 * Presentational component for displaying a compact roadmap card
 * Follows SRP - only responsible for rendering roadmap info and handling navigation
 */
export const RoadmapMiniCard = ({ roadmap }: RoadmapMiniCardProps) => {
  const navigate = useNavigate();

  const handleViewRoadmap = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/learn/roadmap/${roadmap.id}`);
  };

  const handleStartStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/learn/study?roadmap=${roadmap.id}`);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3 transition-all hover:bg-secondary/50">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate text-sm">
          {roadmap.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {roadmap.topics.length} tematów • {roadmap.progress}% ukończone
        </p>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          onClick={handleViewRoadmap}
          aria-label={`Zobacz roadmapę ${roadmap.title}`}
        >
          <BookOpen className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          className="h-8 px-3"
          onClick={handleStartStudy}
        >
          <Play className="h-3 w-3 mr-1" />
          Ucz się
        </Button>
      </div>
    </div>
  );
};