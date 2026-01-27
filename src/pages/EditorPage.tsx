import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Undo, Redo } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { TopicEditPanel } from '@/components/editor/TopicEditPanel';
import { AddNodeDialog } from '@/components/editor/AddNodeDialog';
import { useEditorStore } from '@/stores/editorStore';
import { toast } from 'sonner';

const EditorPage = () => {
  const store = useEditorStore();
  const [addNodePosition, setAddNodePosition] = useState<{ x: number; y: number } | null>(null);

  const selectedTopic = store.getSelectedTopic();
  const selectedRoadmap = store.getSelectedRoadmap();

  const handleAddNode = useCallback((position: { x: number; y: number }) => {
    setAddNodePosition(position);
  }, []);

  const handleCreateNode = useCallback((title: string) => {
    if (addNodePosition) {
      store.addNode(title, addNodePosition);
      setAddNodePosition(null);
      toast.success(`Dodano temat: ${title}`);
    }
  }, [addNodePosition, store]);

  const handleNodeClick = useCallback((nodeId: string) => {
    store.selectTopic(nodeId);
  }, [store]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    store.selectTopic(nodeId);
  }, [store]);

  const handleConnectionEnd = useCallback((nodeId: string) => {
    if (store.state.connectingFrom && store.state.connectingFrom !== nodeId) {
      store.addConnection(store.state.connectingFrom, nodeId, 'suggested_order');
      toast.success('Połączenie utworzone');
    } else {
      store.setConnectingFrom(null);
    }
  }, [store]);

  const handleSave = useCallback(() => {
    toast.success('Zmiany zapisane!');
  }, []);

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-2rem)] flex-col">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b border-border bg-card px-4 py-3"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {selectedRoadmap ? selectedRoadmap.title : 'Edytor Roadmap'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedRoadmap 
                ? `${store.state.nodes.length} tematów • ${store.state.connections.length} połączeń`
                : 'Wybierz kategorię i roadmapę z panelu bocznego'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <Redo className="h-4 w-4" />
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Zapisz
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Sidebar */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
              <EditorSidebar
                categories={store.state.categories}
                selectedCategoryId={store.state.selectedCategoryId}
                selectedRoadmapId={store.state.selectedRoadmapId}
                onSelectCategory={store.selectCategory}
                onSelectRoadmap={store.selectRoadmap}
                onAddCategory={store.addCategory}
                onUpdateCategory={store.updateCategory}
                onDeleteCategory={store.deleteCategory}
                onAddRoadmap={store.addRoadmap}
                onUpdateRoadmap={store.updateRoadmap}
                onDeleteRoadmap={store.deleteRoadmap}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Canvas */}
            <ResizablePanel defaultSize={80}>
              {store.state.selectedRoadmapId ? (
                <EditorCanvas
                  nodes={store.state.nodes}
                  connections={store.state.connections}
                  zoom={store.state.zoom}
                  pan={store.state.pan}
                  connectingFrom={store.state.connectingFrom}
                  selectedNodeId={store.state.selectedTopicId}
                  onNodeClick={handleNodeClick}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  onNodeMove={store.updateNodePosition}
                  onNodeDelete={store.deleteNode}
                  onConnectionStart={store.setConnectingFrom}
                  onConnectionEnd={handleConnectionEnd}
                  onConnectionDelete={store.deleteConnection}
                  onAddNode={handleAddNode}
                  onZoomChange={store.setZoom}
                  onPanChange={store.setPan}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-secondary/30">
                  <div className="text-center">
                    <div className="mb-4 text-6xl">🗺️</div>
                    <h2 className="text-xl font-semibold text-foreground">Wybierz roadmapę</h2>
                    <p className="mt-2 text-muted-foreground">
                      Wybierz kategorię i roadmapę z panelu bocznego,<br />
                      aby rozpocząć edycję
                    </p>
                  </div>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Topic Edit Panel */}
        {selectedTopic && (
          <TopicEditPanel
            topic={selectedTopic}
            isOpen={!!store.state.selectedTopicId}
            onClose={() => store.selectTopic(null)}
            onUpdateTopic={(updates) => {
              if (store.state.selectedTopicId) {
                store.updateNode(store.state.selectedTopicId, updates as any);
              }
            }}
            onAddQuestion={(question) => {
              if (store.state.selectedTopicId) {
                store.addQuestion(store.state.selectedTopicId, question);
                toast.success('Pytanie dodane');
              }
            }}
            onDeleteQuestion={(questionId) => {
              store.deleteQuestion(questionId);
              toast.success('Pytanie usunięte');
            }}
            onAddResource={(resource) => {
              if (store.state.selectedTopicId) {
                store.addResource(store.state.selectedTopicId, resource);
                toast.success('Materiał dodany');
              }
            }}
            onDeleteResource={(resourceId) => {
              store.deleteResource(resourceId);
              toast.success('Materiał usunięty');
            }}
          />
        )}

        {/* Add Node Dialog */}
        <AddNodeDialog
          isOpen={addNodePosition !== null}
          onClose={() => setAddNodePosition(null)}
          onAdd={handleCreateNode}
        />
      </div>
    </MainLayout>
  );
};

export default EditorPage;
