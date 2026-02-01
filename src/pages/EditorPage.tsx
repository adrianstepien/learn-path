import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Undo, Redo, Settings2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { TopicEditPanel } from '@/components/editor/TopicEditPanel';
import { AddNodeDialog } from '@/components/editor/AddNodeDialog';
import { useEditorStore } from '@/stores/editorStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const EditorPage = () => {
  const store = useEditorStore();
  const isMobile = useIsMobile();
  const [addNodePosition, setAddNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  const selectedTopic = store.getSelectedTopic();
  const selectedRoadmap = store.getSelectedRoadmap();
  const selectedCategory = store.getSelectedCategory();

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

  const handleSelectRoadmap = useCallback((id: string | null) => {
    store.selectRoadmap(id);
    if (isMobile && id) {
      setShowSidebar(false);
    }
  }, [store, isMobile]);

  // Determine the empty state message based on selection
  const getEmptyStateContent = () => {
    if (!store.state.selectedCategoryId) {
      return {
        emoji: '📂',
        title: 'Wybierz kategorię',
        description: isMobile 
          ? 'Kliknij ikonę menu, aby wybrać kategorię'
          : 'Wybierz kategorię z panelu bocznego, aby zobaczyć dostępne roadmapy'
      };
    }
    if (!store.state.selectedRoadmapId) {
      return {
        emoji: '🗺️',
        title: 'Wybierz roadmapę',
        description: isMobile 
          ? 'Kliknij ikonę menu, aby wybrać roadmapę'
          : 'Wybierz roadmapę z panelu bocznego, aby rozpocząć edycję'
      };
    }
    return null;
  };

  const emptyState = getEmptyStateContent();

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex-col">
        {/* Top Bar - Mobile optimized */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-3 md:px-6 py-3 md:py-4"
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {/* Mobile sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
            
            <div className="hidden md:flex h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 items-center justify-center shrink-0">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-foreground truncate">
                {selectedRoadmap 
                  ? selectedRoadmap.title 
                  : selectedCategory 
                    ? selectedCategory.name 
                    : 'Edytor Roadmap'}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                {selectedRoadmap 
                  ? `${store.state.nodes.length} tematów • ${store.state.connections.length} połączeń`
                  : selectedCategory
                    ? `${selectedCategory.roadmaps.length} roadmap`
                    : 'Wybierz kategorię'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <Button variant="outline" size="icon" disabled className="h-8 w-8 md:h-9 md:w-9 hidden sm:flex">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled className="h-8 w-8 md:h-9 md:w-9 hidden sm:flex">
              <Redo className="h-4 w-4" />
            </Button>
            <Button onClick={handleSave} size="sm" className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-4">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Zapisz</span>
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar - Mobile overlay, desktop inline */}
          <AnimatePresence>
            {showSidebar && (
              <>
                {/* Mobile backdrop */}
                {isMobile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSidebar(false)}
                    className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
                  />
                )}
                
                <motion.div
                  initial={isMobile ? { x: '-100%' } : { opacity: 0 }}
                  animate={isMobile ? { x: 0 } : { opacity: 1 }}
                  exit={isMobile ? { x: '-100%' } : { opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className={`
                    ${isMobile 
                      ? 'fixed left-0 top-0 z-40 h-full w-[85%] max-w-sm pt-16' 
                      : 'relative h-full w-80 shrink-0'
                    }
                    border-r border-border bg-card
                  `}
                >
                  <EditorSidebar
                    categories={store.state.categories}
                    selectedCategoryId={store.state.selectedCategoryId}
                    selectedRoadmapId={store.state.selectedRoadmapId}
                    onSelectCategory={store.selectCategory}
                    onSelectRoadmap={handleSelectRoadmap}
                    onAddCategory={store.addCategory}
                    onUpdateCategory={store.updateCategory}
                    onDeleteCategory={store.deleteCategory}
                    onAddRoadmap={store.addRoadmap}
                    onUpdateRoadmap={store.updateRoadmap}
                    onDeleteRoadmap={store.deleteRoadmap}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Canvas or Empty State */}
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
            ) : emptyState && (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary/30 to-background p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="mb-4 md:mb-6 mx-auto h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <span className="text-4xl md:text-5xl">{emptyState.emoji}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">{emptyState.title}</h2>
                  <p className="mt-2 md:mt-3 text-sm md:text-base text-muted-foreground max-w-sm mx-auto">
                    {emptyState.description}
                  </p>
                  {isMobile && !showSidebar && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowSidebar(true)}
                    >
                      <PanelLeft className="h-4 w-4 mr-2" />
                      Otwórz menu
                    </Button>
                  )}
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
