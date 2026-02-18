import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Play,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoadmapToolbarProps {
  roadmapTitle: string;
  roadmapId: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

/**
 * Presentational component for the roadmap toolbar
 * Follows SRP - only responsible for rendering toolbar controls
 */
export const RoadmapToolbar = ({
  roadmapTitle,
  roadmapId,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
}: RoadmapToolbarProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6 py-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden md:inline">Powrót</span>
        </button>
        <div className="h-6 w-px bg-border hidden md:block" />
        <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
          {roadmapTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <Button variant="outline" size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="outline" size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-2 hidden md:block" />
        <Button size="sm" onClick={() => navigate(`/learn/study?roadmap=${roadmapId}&mode=SRS`)}>
          <Play className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Tryb nauki</span>
          <span className="md:hidden">Ucz się</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/learn/study?roadmap=${roadmapId}&mode=FUTURE`)}>
          <RotateCcw className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Powtórz</span>
          <span className="md:hidden">Ucz się</span>
        </Button>
      </div>
    </div>
  );
};