// src/pages/learn/roadmap/topic/TopicPage.tsx
import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom'; // Dodaj useNavigate
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

const TopicPage = () => {
  // ZMIANA: Pobieramy też categoryId
  const { roadmapId, categoryId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // ZMIANA: Przekazujemy oba ID do hooka
  const { roadmap, getTopicPosition, isLoading, isError } = useRoadmapData(categoryId, roadmapId);

  // ... (useZoomPan, useTouchGestures - bez zmian) ...
  const { zoom, pan, handleZoomIn, handleZoomOut, handleResetView, setPan, setZoom } = useZoomPan();
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({ zoom, setZoom, pan, setPan });

  // Drag logic (uproszczona wersja dla czytelności)
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  // ... (handleMouseDown/Move/Up bez zmian) ...
  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) setPan({ x: e.clientX - startPos.x, y: e.clientY - startPos.y }); };
  const handleMouseUp = () => setIsDragging(false);


  // ZMIANA: Obsługa ładowania
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-screen items-center justify-center">
          ładowanie...
        </div>
      </MainLayout>
    );
  }

  // ZMIANA: Obsługa błędu
  if (isError || !roadmap) {
    return (
      <MainLayout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Nie znaleziono roadmapy</p>
          <button onClick={() => navigate('/learn')} className="text-primary hover:underline">
            Wróć do listy
          </button>
        </div>
      </MainLayout>
    );
  }

  const connections = computeConnectionsFromTopics(roadmap.topics);

  return (
    <MainLayout>
      <div className="flex h-screen flex-col overflow-hidden"> {/* Dodano overflow-hidden */}
        <RoadmapToolbar
          roadmapTitle={roadmap.title}
          roadmapId={roadmap.id}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
        />

        <StatusLegend />

        {/* Dodano wrapper dla zdarzeń myszy na kontenerze */}
        <div
          className="flex-1 relative w-full h-full bg-background cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          ref={containerRef}
        >
            <RoadmapCanvas
              roadmap={roadmap}
              connections={connections}
              zoom={zoom}
              pan={pan}
              onPanChange={setPan}
              selectedTopic={selectedTopic}
              onTopicClick={setSelectedTopic}
              getTopicPosition={getTopicPosition}
              // Puste handlery, bo obsługujemy je w divie wyżej
              onMouseDown={() => {}}
              onMouseMove={() => {}}
              onMouseUp={() => {}}
              onTouchStart={() => {}}
              onTouchMove={() => {}}
              onTouchEnd={() => {}}
              containerRef={containerRef}
            />
        </div>
      </div>

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