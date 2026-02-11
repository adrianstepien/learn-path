import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { TopicSlidePanel } from '@/components/learn/TopicSlidePanel';
import { Topic } from '@/types/learning';
import { useZoomPan } from '@/pages/learn/roadmap/hooks/useZoomPan';
import { useTouchGestures } from '@/pages/learn/roadmap/hooks/useTouchGestures';
import { useRoadmapData } from '@/pages/learn/roadmap/hooks/useRoadmapData';
import { roadmapMouseCanvas } from '@/pages/learn/roadmap/hooks/roadmapMouseCanvas';
import { computeConnectionsFromTopics } from '@/domain/canvas/connections';
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

export default RoadmapViewPage;