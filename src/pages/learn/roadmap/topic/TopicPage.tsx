import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TopicSlidePanel } from '@/components/learn/TopicSlidePanel';
import { Topic } from '@/types/learning';
import { useZoomPan } from '@/pages/learn/roadmap/hooks/useZoomPan';
import { useTouchGestures } from '@/pages/learn/roadmap/hooks/useTouchGestures';
import { useLearnTopic } from '@/hooks/queries/useLearnTopic';
import { computeConnectionsFromTopics } from '@/domain/canvas/connections';
import { Button } from '@/components/ui/button';
import {
  RoadmapToolbar,
  StatusLegend,
  RoadmapCanvas
} from '@/pages/learn/roadmap/components';

const TopicPage = () => {
  const { categoryId, roadmapId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Roadmap data - fetch using both categoryId and roadmapId
  const { roadmap, isLoading, isError, getTopicPosition } = useLearnTopic(roadmapId);

  // Zoom and pan logic
  const {
    zoom,
    pan,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    setPan,
    setZoom,
  } = useZoomPan();

  // Touch gesture handling
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTouchGestures({
    zoom,
    setZoom,
    pan,
    setPan,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Ładowanie roadmapy...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Handle error state
  if (isError || !roadmap) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold text-foreground">Roadmapa nie została znaleziona</p>
            <p className="text-muted-foreground">Nie udało się załadować roadmapy lub nie istnieje.</p>
            <Button
              onClick={() => navigate(categoryId ? `/learn/roadmap/${categoryId}` : '/learn')}
              variant="outline"
              className="mt-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const connections = computeConnectionsFromTopics(roadmap.topics);

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        {/* Top Bar */}
        <RoadmapToolbar
          roadmapTitle={roadmap.title}
          roadmapId={roadmap.id}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
        />

        {/* Legend */}
        <StatusLegend />

        {/* Canvas */}
        <RoadmapCanvas
          roadmap={roadmap}
          connections={connections}
          zoom={zoom}
          pan={pan}
          onPanChange={setPan}
          selectedTopic={selectedTopic}
          onTopicClick={setSelectedTopic}
          getTopicPosition={getTopicPosition}
           onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          containerRef={containerRef}
        />
      </div>

      {/* Slide Panel */}
      <AnimatePresence>
        {selectedTopic && (
          <TopicSlidePanel
            topic={selectedTopic}
            onClose={() => setSelectedTopic(null)}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default TopicPage;