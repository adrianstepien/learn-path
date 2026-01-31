import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Undo, Redo, Settings2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { TopicEditPanel } from '@/components/editor/TopicEditPanel';
import { AddNodeDialog } from '@/components/editor/AddNodeDialog';
import { useEditorStore } from '@/stores/editorStore';
import { toast } from 'sonner';

const EditorPage = () => {
  const store = useEditorStore();
  const [addNodePosition, setAddNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);

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
        {/* Top Bar - Modernized */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled className="h-9 w-9">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled className="h-9 w-9">
              <Redo className="h-4 w-4" />
            </Button>
            <Button onClick={handleSave} className="gap-2 ml-2">
              <Save className="h-4 w-4" />
              Zapisz
            </Button>
          </div>
        </motion.div>

        {/* Main Content - Side by side layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full border-r border-border"
            style={{ width: sidebarWidth, minWidth: 280, maxWidth: 400 }}
          >
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
          </motion.div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
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
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary/30 to-background">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="mb-6 mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <span className="text-5xl">🗺️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Wybierz roadmapę</h2>
                  <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
                    Wybierz kategorię i roadmapę z panelu bocznego,
                    aby rozpocząć edycję
                  </p>
                </motion.div>
              </div>
            )}
          </div>
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
            onUpdateQuestion={(questionId, updates) => {
              store.updateQuestion(questionId, updates);
              toast.success('Pytanie zaktualizowane');
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
            onUpdateResource={(resourceId, updates) => {
              store.updateResource(resourceId, updates);
              toast.success('Materiał zaktualizowany');
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
