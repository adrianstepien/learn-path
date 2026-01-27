import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link2, Trash2, GripVertical } from 'lucide-react';
import { EditorNode } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

interface CanvasNodeProps {
  node: EditorNode;
  isSelected: boolean;
  isConnecting: boolean;
  isConnectingSource: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  onConnectionStart: () => void;
  onConnectionEnd: () => void;
}

const statusColors: Record<EditorNode['status'], string> = {
  not_started: 'border-muted-foreground/30 bg-card',
  in_progress: 'border-primary/50 bg-primary/5',
  mastered: 'border-success/50 bg-success/5',
  due_review: 'border-warning/50 bg-warning/5',
};

const statusLabels: Record<EditorNode['status'], string> = {
  not_started: 'Nie rozpoczęty',
  in_progress: 'W trakcie',
  mastered: 'Opanowany',
  due_review: 'Do powtórki',
};

export const CanvasNode = ({
  node,
  isSelected,
  isConnecting,
  isConnectingSource,
  onClick,
  onDoubleClick,
  onMove,
  onDelete,
  onConnectionStart,
  onConnectionEnd,
}: CanvasNodeProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.node-action')) return;

    e.stopPropagation();
    e.preventDefault();
    
    isDraggingRef.current = true;
    
    // Calculate offset at the time of mousedown
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = node.position.x;
    const startPosY = node.position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      onMove({
        x: startPosX + deltaX,
        y: startPosY + deltaY,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [node.position.x, node.position.y, onMove]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) return;
    
    if (isConnecting && !isConnectingSource) {
      onConnectionEnd();
    } else {
      onClick();
    }
  }, [isConnecting, isConnectingSource, onConnectionEnd, onClick]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick();
  }, [onDoubleClick]);

  return (
    <motion.div
      ref={nodeRef}
      className={cn(
        'canvas-node absolute flex min-w-[160px] cursor-move select-none flex-col rounded-xl border-2 shadow-md transition-shadow',
        statusColors[node.status],
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isConnecting && !isConnectingSource && 'ring-2 ring-accent ring-offset-1'
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 rounded-t-xl bg-secondary/50 px-3 py-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 font-medium text-foreground">{node.title}</span>
      </div>

      {/* Status indicator */}
      <div className="px-3 py-2">
        <span className="text-xs text-muted-foreground">{statusLabels[node.status]}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border/50 px-2 py-1.5">
        <button
          className="node-action flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onConnectionStart();
          }}
          title="Utwórz połączenie"
        >
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          className="node-action flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Usuń węzeł"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>

      {/* Connection ports */}
      <div
        className="node-action absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-primary bg-background transition-transform hover:scale-125"
        onClick={(e) => {
          e.stopPropagation();
          if (isConnecting && !isConnectingSource) {
            onConnectionEnd();
          } else {
            onConnectionStart();
          }
        }}
      />
      <div
        className="node-action absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-accent bg-background transition-transform hover:scale-125"
        onClick={(e) => {
          e.stopPropagation();
          if (isConnecting && !isConnectingSource) {
            onConnectionEnd();
          }
        }}
      />
    </motion.div>
  );
};
