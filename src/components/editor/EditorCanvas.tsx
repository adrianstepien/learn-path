import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorNode, EditorConnection } from '@/stores/editorStore';
import { CanvasNode } from './CanvasNode';
import { CanvasConnection } from './CanvasConnection';

interface EditorCanvasProps {
  nodes: EditorNode[];
  connections: EditorConnection[];
  zoom: number;
  pan: { x: number; y: number };
  connectingFrom: string | null;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionStart: (nodeId: string) => void;
  onConnectionEnd: (nodeId: string) => void;
  onConnectionDelete: (connectionId: string) => void;
  onAddNode: (position: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
}

export const EditorCanvas = ({
  nodes,
  connections,
  zoom,
  pan,
  connectingFrom,
  selectedNodeId,
  onNodeClick,
  onNodeDoubleClick,
  onNodeMove,
  onNodeDelete,
  onConnectionStart,
  onConnectionEnd,
  onConnectionDelete,
  onAddNode,
  onZoomChange,
  onPanChange,
}: EditorCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      onZoomChange(zoom + delta);
    } else {
      onPanChange({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  }, [zoom, pan, onZoomChange, onPanChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      });
    }

    if (isPanning) {
      onPanChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart, pan, zoom, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.canvas-node')) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const position = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      };
      onAddNode(position);
    }
  }, [pan, zoom, onAddNode]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.canvas-node')) return;
    if (connectingFrom) {
      onConnectionStart(null as any); // Cancel connection
    }
  }, [connectingFrom, onConnectionStart]);

  const getNodePosition = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.position.x + 80, y: node.position.y + 30 } : { x: 0, y: 0 };
  }, [nodes]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-secondary/30">
      {/* Toolbar */}
      <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
        <Button
          variant="default"
          onClick={() => {
            const centerPosition = {
              x: (window.innerWidth / 2 - pan.x) / zoom - 80,
              y: (window.innerHeight / 2 - pan.y) / zoom - 50,
            };
            onAddNode(centerPosition);
          }}
          className="gap-2 shadow-md"
        >
          <Plus className="h-4 w-4" />
          Dodaj temat
        </Button>
        <div className="flex flex-col gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onZoomChange(zoom + 0.1)}
            className="h-10 w-10 bg-card shadow-md"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onZoomChange(zoom - 0.1)}
            className="h-10 w-10 bg-card shadow-md"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              onZoomChange(1);
              onPanChange({ x: 0, y: 0 });
            }}
            className="h-10 w-10 bg-card shadow-md"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 z-20 rounded-lg bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-md">
        {Math.round(zoom * 100)}%
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-20 rounded-lg bg-card px-4 py-2 text-sm text-muted-foreground shadow-md">
        <p>Podwójne kliknięcie = nowy węzeł</p>
        <p>Alt + przeciągnij = przesuwaj canvas</p>
        <p>Scroll = przesuwaj | Ctrl+Scroll = zoom</p>
        <p className="text-primary">Kliknij ikonę łańcucha → drugi węzeł = połączenie</p>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onClick={handleCanvasClick}
      >
        {/* Grid pattern */}
        <svg className="absolute inset-0 h-full w-full" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="10000" height="10000" x="-5000" y="-5000" fill="url(#grid)" />
        </svg>

        {/* Content layer */}
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Connections */}
          <svg className="pointer-events-none absolute inset-0" style={{ width: '10000px', height: '10000px', left: '-5000px', top: '-5000px', overflow: 'visible' }}>
            {connections.map(conn => {
              const fromPos = getNodePosition(conn.from);
              const toPos = getNodePosition(conn.to);
              return (
                <CanvasConnection
                  key={conn.id}
                  id={conn.id}
                  from={fromPos}
                  to={toPos}
                  type={conn.type}
                  onDelete={() => onConnectionDelete(conn.id)}
                />
              );
            })}
            
            {/* Connection in progress */}
            {connectingFrom && (
              <line
                x1={getNodePosition(connectingFrom).x}
                y1={getNodePosition(connectingFrom).y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.6"
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isConnecting={connectingFrom !== null}
              isConnectingSource={connectingFrom === node.id}
              onClick={() => onNodeClick(node.id)}
              onDoubleClick={() => onNodeDoubleClick(node.id)}
              onMove={(pos) => onNodeMove(node.id, pos)}
              onDelete={() => onNodeDelete(node.id)}
              onConnectionStart={() => onConnectionStart(node.id)}
              onConnectionEnd={() => onConnectionEnd(node.id)}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Pusta roadmapa</h3>
            <p className="mt-1 text-muted-foreground">
              Kliknij dwukrotnie aby dodać pierwszy temat
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
