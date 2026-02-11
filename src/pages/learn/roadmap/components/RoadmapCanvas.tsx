import { Roadmap, Topic } from '@/types/learning';
import { Eye } from 'lucide-react';
import { TopicNode } from './TopicNode';
import { ConnectionLine } from './ConnectionLine';

interface RoadmapCanvasProps {
  roadmap: Roadmap;
  connections: EditorConnection[];
  zoom: number;
  pan: { x: number; y: number };
  selectedTopic: Topic | null;
  onTopicClick: (topic: Topic) => void;
  getTopicPosition: (topic: Topic) => { x: number; y: number };
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Presentational component for the roadmap canvas
 * Follows SRP - only responsible for rendering the interactive canvas with topics and connections
 */
export const RoadmapCanvas = ({
  roadmap,
  connections,
  zoom,
  pan,
  selectedTopic,
  onTopicClick,
  getTopicPosition,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  containerRef,
}: RoadmapCanvasProps) => {
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-secondary/30 touch-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="relative min-h-[600px] min-w-[1000px] p-8"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'top left'
        }}
      >
        {/* Connections */}
        {connections.map(conn => {
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

        {/* Topic Nodes */}
        {roadmap.topics.map(topic => (
          <TopicNode
            key={topic.id}
            topic={topic}
            position={getTopicPosition(topic)}
            onClick={() => onTopicClick(topic)}
            isSelected={selectedTopic?.id === topic.id}
          />
        ))}

        {/* Empty State */}
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
  );
};