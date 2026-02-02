import { useRef, useCallback, useState } from 'react';
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

const DRAG_THRESHOLD = 5; // pixels

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
  const [hasDragged, setHasDragged] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.node-action')) return;

    e.stopPropagation();
    e.preventDefault();
    
    // Capture pointer for touch devices
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setHasDragged(false);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = node.position.x;
    const startPosY = node.position.y;
    let dragStarted = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Only start dragging after threshold is exceeded
      if (!dragStarted && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
        dragStarted = true;
        setHasDragged(true);
      }
      
      if (dragStarted) {
        onMove({
          x: startPosX + deltaX,
          y: startPosY + deltaY,
        });
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      startPosRef.current = null;
      (upEvent.target as HTMLElement).releasePointerCapture?.(upEvent.pointerId);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [node.position.x, node.position.y, onMove]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If we just finished dragging, don't trigger click
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
    
    // If we're connecting and this is not the source node, complete the connection
    if (isConnecting && !isConnectingSource) {
      onConnectionEnd();
      return;
    }
    
    // Otherwise, select the node
    onClick();
  }, [hasDragged, isConnecting, isConnectingSource, onConnectionEnd, onClick]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDragged) return;
    onDoubleClick();
  }, [hasDragged, onDoubleClick]);

  return (
    <motion.div
      ref={nodeRef}
      className={cn(
        'canvas-node absolute flex min-w-[180px] cursor-move select-none flex-col rounded-xl border-2 shadow-lg transition-shadow hover:shadow-xl',
        statusColors[node.status],
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isConnecting && !isConnectingSource && 'ring-2 ring-accent ring-offset-1 cursor-crosshair'
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        left: node.position.x,
        top: node.position.y,
        touchAction: 'none', // Prevent scroll while dragging on touch
      }}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 rounded-t-xl bg-secondary/50 px-3 py-2.5">
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 font-medium text-foreground truncate">{node.title}</span>
      </div>

      {/* Status indicator */}
      <div className="px-3 py-2">
        <span className="text-xs text-muted-foreground">{statusLabels[node.status]}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border/50 px-2 py-2">
        <button
          className="node-action flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onConnectionStart();
          }}
          title="Utwórz połączenie"
        >
          <Link2 className="h-4 w-4 text-primary" />
        </button>
        <button
          className="node-action flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Usuń węzeł"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </div>

      {/* Connection ports */}
      <div
        className="node-action absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-primary bg-background shadow-md transition-transform hover:scale-125"
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
        className="node-action absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-accent bg-background shadow-md transition-transform hover:scale-125"
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
