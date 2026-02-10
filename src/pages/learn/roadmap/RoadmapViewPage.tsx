import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { TopicSlidePanel } from '@/components/learn/TopicSlidePanel';
import { Topic } from '@/types/learning';
import { useZoomPan } from '@/pages/learn/roadmap/hooks/useZoomPan';
import { useTouchGestures } from '@/pages/learn/roadmap/hooks/useTouchGestures';
import { useRoadmapData } from '@/pages/learn/roadmap/hooks/useRoadmapData';
import {
  RoadmapToolbar,
  StatusLegend,
  RoadmapCanvas
} from '@/pages/learn/roadmap/components';

const RoadmapViewPage = () => {
  const { roadmapId } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

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

  // Roadmap data
  const { roadmap, getTopicPosition } = useRoadmapData(roadmapId);

  // Handle roadmap not found
  if (!roadmap) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center p-8">
          <p className="text-muted-foreground">Roadmapa nie została znaleziona</p>
        </div>
      </MainLayout>
    );
  }

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
          zoom={zoom}
          pan={pan}
          selectedTopic={selectedTopic}
          onTopicClick={setSelectedTopic}
          getTopicPosition={getTopicPosition}
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

export default RoadmapViewPage;