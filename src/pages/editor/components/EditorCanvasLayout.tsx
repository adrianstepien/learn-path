import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Map,
  Play,
  Save,
  Redo,
  Undo,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { TopicEditPanel } from '@/components/editor/TopicEditPanel';
import { AddNodeDialog } from '@/components/editor/AddNodeDialog';
import type { useEditorCanvasService } from '@/pages/editor/services/editorCanvasService';

type EditorCanvasService = ReturnType<typeof useEditorCanvasService>;

interface EditorCanvasLayoutProps {
  canvas: EditorCanvasService;
  onBack: () => void;
  onStartStudy: () => void;
}

export const EditorCanvasLayout = ({
  canvas,
  onBack,
  onStartStudy,
}: EditorCanvasLayoutProps) => {
  const selectedRoadmap = canvas.selectedRoadmap;

  if (!selectedRoadmap) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex-col">
      {/* Canvas Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-3 md:px-6 py-3 md:py-4"
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 items-center justify-center shrink-0">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold text-foreground truncate">
              {selectedRoadmap.title}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              {canvas.nodes.length} tematów • {canvas.connections.length} połączeń
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            disabled
            className="h-8 w-8 md:h-9 md:w-9 hidden sm:flex"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled
            className="h-8 w-8 md:h-9 md:w-9 hidden sm:flex"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-4"
            onClick={onStartStudy}
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Ucz się</span>
          </Button>
          <Button
            onClick={canvas.handleSave}
            size="sm"
            className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-4"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Zapisz</span>
          </Button>
        </div>
      </motion.div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <EditorCanvas
          nodes={canvas.nodes}
          connections={canvas.connections}
          zoom={canvas.zoom}
          pan={canvas.pan}
          connectingFrom={canvas.connectingFrom}
          selectedNodeId={canvas.selectedNodeId}
          onNodeClick={canvas.handleNodeClick}
          onNodeDoubleClick={canvas.handleNodeDoubleClick}
          onNodeMove={canvas.onNodeMove}
          onNodeDelete={canvas.onNodeDelete}
          onConnectionStart={canvas.onConnectionStart}
          onConnectionEnd={canvas.handleConnectionEnd}
          onConnectionDelete={canvas.onConnectionDelete}
          onAddNode={canvas.handleAddNode}
          onZoomChange={canvas.onZoomChange}
          onPanChange={canvas.onPanChange}
        />
      </div>

      {/* Topic Edit Panel */}
      {canvas.selectedTopic && (
        <TopicEditPanel
          topic={canvas.selectedTopic}
          isOpen={!!canvas.selectedNodeId}
          onClose={canvas.closeTopicPanel}
          onUpdateTopic={canvas.updateSelectedTopic}
          onAddQuestion={canvas.addQuestionToSelectedTopic as any}
          onUpdateQuestion={canvas.updateQuestion as any}
          onDeleteQuestion={canvas.deleteQuestion}
          onAddResource={canvas.addResourceToSelectedTopic as any}
          onUpdateResource={canvas.updateResource as any}
          onDeleteResource={canvas.deleteResource}
        />
      )}

      <AddNodeDialog
        isOpen={canvas.addNodePosition !== null}
        onClose={canvas.closeAddNodeDialog}
        onAdd={canvas.handleCreateNode}
      />
    </div>
  );
};

