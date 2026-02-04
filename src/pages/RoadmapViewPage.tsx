import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  Play,
  Filter,
  Eye,
  RotateCcw
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editorStore';
import { Topic, ProgressStatus, Roadmap } from '@/types/learning';
import { TopicSlidePanel } from '@/components/learn/TopicSlidePanel';
import { cn } from '@/lib/utils';

const statusColors: Record<ProgressStatus, string> = {
  not_started: 'bg-secondary border-border',
  in_progress: 'bg-primary/20 border-primary',
  mastered: 'bg-success/20 border-success',
  due_review: 'bg-warning/20 border-warning',
};

const statusLabels: Record<ProgressStatus, string> = {
  not_started: 'Nierozpoczęty',
  in_progress: 'W trakcie',
  mastered: 'Opanowany',
  due_review: 'Do powtórki',
};

// Calculate topic progress based on questions
const getTopicProgress = (topic: Topic): number => {
  if (topic.questions.length === 0) return 0;
  const masteredQuestions = topic.questions.filter(q => q.repetitions > 0).length;
  return Math.round((masteredQuestions / topic.questions.length) * 100);
};

interface TopicNodeProps {
  topic: Topic;
  position: { x: number; y: number };
  onClick: () => void;
  isSelected: boolean;
}

const TopicNode = ({ 
  topic, 
  position,
  onClick,
  isSelected
}: TopicNodeProps) => {
  const questionsCount = topic.questions.length;
  const resourcesCount = topic.resources.length;
  const progress = getTopicProgress(topic);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onClick={onClick}
      style={{ 
        position: 'absolute',
        left: position.x,
        top: position.y,
      }}
      className={cn(
        'topic-node w-48 cursor-pointer rounded-xl border-2 bg-card p-4 shadow-md transition-all',
        statusColors[topic.status],
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <h4 className="font-semibold text-foreground mb-1 truncate">{topic.title}</h4>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{topic.description}</p>
      
      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Postęp</span>
          <span className="text-xs font-medium text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div 
            className="h-full rounded-full gradient-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {questionsCount > 0 && (
            <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              🎯 {questionsCount}
            </span>
          )}
          {resourcesCount > 0 && (
            <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              📚 {resourcesCount}
            </span>
          )}
        </div>
        <span className={cn(
          'h-2 w-2 rounded-full',
          topic.status === 'mastered' && 'bg-success',
          topic.status === 'in_progress' && 'bg-primary',
          topic.status === 'due_review' && 'bg-warning',
          topic.status === 'not_started' && 'bg-muted-foreground'
        )} />
      </div>
    </motion.div>
  );
};

const ConnectionLine = ({ 
  from, 
  to 
}: { 
  from: { x: number; y: number }; 
  to: { x: number; y: number }; 
}) => {
  const startX = from.x + 96; // Half of node width
  const startY = from.y + 40; // Node height
  const endX = to.x + 96;
  const endY = to.y;

  const midY = (startY + endY) / 2;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <path
        d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="2"
        strokeDasharray="4,4"
      />
    </svg>
  );
};

const RoadmapViewPage = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const { state } = useEditorStore();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Touch gesture state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

  // Find roadmap from global store
  const roadmap: Roadmap | undefined = (() => {
    for (const cat of state.categories) {
      const found = cat.roadmaps.find(r => r.id === roadmapId);
      if (found) return found;
    }
    return undefined;
  })();

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.25));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Helper to calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Touch handlers for mobile panning and pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Check if touch is on a topic node - if so, let it handle click
    if ((e.target as HTMLElement).closest('.topic-node')) return;
    
    if (e.touches.length === 2) {
      // Two fingers - pinch to zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      pinchStartRef.current = { distance, zoom };
      
      // Also track pan position for combined pan+zoom
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchStartRef.current = {
        x: midX,
        y: midY,
        panX: pan.x,
        panY: pan.y,
      };
      setIsTouchPanning(true);
    } else if (e.touches.length === 1) {
      // Single finger - pan only
      e.preventDefault();
      const touch = e.touches[0];
      setIsTouchPanning(true);
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      pinchStartRef.current = null;
    }
  }, [pan, zoom, getTouchDistance]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    e.preventDefault();

    if (e.touches.length === 2 && pinchStartRef.current) {
      // Pinch to zoom
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / pinchStartRef.current.distance;
      const newZoom = Math.min(Math.max(pinchStartRef.current.zoom * scale, 0.25), 2);
      setZoom(newZoom);

      // Pan with two fingers
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaX = midX - touchStartRef.current.x;
      const deltaY = midY - touchStartRef.current.y;
      setPan({
        x: touchStartRef.current.panX + deltaX,
        y: touchStartRef.current.panY + deltaY,
      });
    } else if (e.touches.length === 1 && isTouchPanning) {
      // Single finger pan
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      setPan({
        x: touchStartRef.current.panX + deltaX,
        y: touchStartRef.current.panY + deltaY,
      });
    }
  }, [isTouchPanning, getTouchDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isTouchPanning) {
      e.preventDefault();
    }
    setIsTouchPanning(false);
    touchStartRef.current = null;
    pinchStartRef.current = null;
  }, [isTouchPanning]);

  // Get position for a topic - use saved position if available, otherwise use default
  const getTopicPosition = (topic: Topic) => {
    return state.savedPositions[topic.id] || topic.position;
  };

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
            <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">{roadmap.title}</h1>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border mx-2 hidden md:block" />
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Filter className="h-4 w-4 mr-2" />
              Filtruj
            </Button>
            <Button size="sm" onClick={() => navigate(`/learn/study?roadmap=${roadmap.id}`)}>
              <Play className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Tryb nauki</span>
              <span className="md:hidden">Ucz się</span>
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6 border-b border-border bg-card/50 px-4 md:px-6 py-2">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={cn(
                'h-3 w-3 rounded-full border',
                statusColors[status as ProgressStatus]
              )} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Canvas with touch support */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden bg-secondary/30 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="relative min-h-[600px] min-w-[1000px] p-8"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
              transformOrigin: 'top left' 
            }}
          >
            {/* Connections - use saved positions */}
            {roadmap.connections.map(conn => {
              const fromTopic = roadmap.topics.find(t => t.id === conn.fromTopicId);
              const toTopic = roadmap.topics.find(t => t.id === conn.toTopicId);
              if (!fromTopic || !toTopic) return null;
              return (
                <ConnectionLine
                  key={conn.id}
                  from={getTopicPosition(fromTopic)}
                  to={getTopicPosition(toTopic)}
                />
              );
            })}

            {/* Nodes - use saved positions */}
            {roadmap.topics.map(topic => (
              <TopicNode
                key={topic.id}
                topic={topic}
                position={getTopicPosition(topic)}
                onClick={() => setSelectedTopic(topic)}
                isSelected={selectedTopic?.id === topic.id}
              />
            ))}

            {roadmap.topics.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Ta roadmapa jest pusta</p>
                  <p className="text-sm text-muted-foreground">Przejdź do edytora, aby dodać tematy</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
