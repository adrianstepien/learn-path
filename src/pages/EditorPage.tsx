import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Undo, 
  Redo, 
  Settings2, 
  ArrowLeft,
  Plus,
  Map,
  Play,
  Pencil,
  Trash2,
  MoreVertical,
  Search,
  ChevronRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { TopicEditPanel } from '@/components/editor/TopicEditPanel';
import { AddNodeDialog } from '@/components/editor/AddNodeDialog';
import { useEditorStore } from '@/stores/editorStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Category, Roadmap } from '@/types/learning';

const EditorPage = () => {
  const store = useEditorStore();
  const navigate = useNavigate();
  const [addNodePosition, setAddNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogType, setDialogType] = useState<'add-category' | 'edit-category' | 'add-roadmap' | 'edit-roadmap' | null>(null);
  const [editingItem, setEditingItem] = useState<Category | Roadmap | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '📚', description: '' });

  const selectedTopic = store.getSelectedTopic();
  const selectedRoadmap = store.getSelectedRoadmap();
  const selectedCategory = store.getSelectedCategory();

  const filteredCategories = store.state.categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleOpenDialog = (type: typeof dialogType, item?: Category | Roadmap) => {
    setDialogType(type);
    setEditingItem(item || null);
    if (item) {
      if ('icon' in item && 'name' in item && !('title' in item)) {
        const cat = item as Category;
        setFormData({ name: cat.name, icon: cat.icon || '📚', description: cat.description || '' });
      } else if ('title' in item) {
        const roadmap = item as Roadmap;
        setFormData({ name: roadmap.title, icon: '', description: roadmap.description || '' });
      }
    } else {
      setFormData({ name: '', icon: '📚', description: '' });
    }
  };

  const handleSubmit = () => {
    if (dialogType === 'add-category') {
      store.addCategory(formData.name, formData.icon);
    } else if (dialogType === 'edit-category' && editingItem) {
      store.updateCategory(editingItem.id, { name: formData.name, icon: formData.icon });
    } else if (dialogType === 'add-roadmap' && store.state.selectedCategoryId) {
      store.addRoadmap(store.state.selectedCategoryId, formData.name, formData.description);
    } else if (dialogType === 'edit-roadmap' && editingItem) {
      store.updateRoadmap(editingItem.id, { title: formData.name, description: formData.description });
    }
    setDialogType(null);
    setFormData({ name: '', icon: '📚', description: '' });
  };

  // Calculate total topics for a category
  const getTotalTopics = (category: Category) => {
    return category.roadmaps.reduce((sum, r) => sum + r.topics.length, 0);
  };

  // Canvas view when a roadmap is selected
  if (store.state.selectedRoadmapId && selectedRoadmap) {
    return (
      <MainLayout>
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
                onClick={() => store.selectRoadmap(null)}
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
                  {store.state.nodes.length} tematów • {store.state.connections.length} połączeń
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
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-4"
                onClick={() => navigate(`/learn/study?roadmap=${selectedRoadmap.id}`)}
              >
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Ucz się</span>
              </Button>
              <Button onClick={handleSave} size="sm" className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-4">
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Zapisz</span>
              </Button>
            </div>
          </motion.div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
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

          <AddNodeDialog
            isOpen={addNodePosition !== null}
            onClose={() => setAddNodePosition(null)}
            onAdd={handleCreateNode}
          />
        </div>
      </MainLayout>
    );
  }

  // Category/Roadmap selection view (similar to LearnPage)
  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            {selectedCategory && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => store.selectCategory(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Settings2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {selectedCategory ? selectedCategory.name : 'Edytor Roadmap'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedCategory 
                    ? `${selectedCategory.roadmaps.length} roadmap${selectedCategory.roadmaps.length !== 1 ? 'y' : 'a'}`
                    : 'Wybierz kategorię lub roadmapę do edycji'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        {!selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 md:mb-8"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj kategorii..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            // Categories Grid
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden"
                >
                  {/* Header - clickable */}
                  <div 
                    onClick={() => store.selectCategory(category.id)}
                    className="cursor-pointer p-4 md:p-6 pb-4 transition-all hover:bg-gradient-to-br hover:from-secondary/50 hover:to-transparent"
                  >
                    <div className="mb-3 md:mb-4 flex items-center justify-between">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <span className="text-2xl md:text-3xl">{category.icon}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleOpenDialog('edit-category', category)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => store.deleteCategory(category.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-base md:text-lg font-bold text-foreground">{category.name}</h3>
                    {category.description && (
                      <p className="mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                        {category.roadmaps.length} roadmap{category.roadmaps.length !== 1 ? 'y' : 'a'} • {getTotalTopics(category)} tematów
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 md:w-20 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className="h-2 rounded-full gradient-primary transition-all duration-500"
                            style={{ width: `${category.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{category.progress}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Add category button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: filteredCategories.length * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl border-2 border-dashed border-border p-6 md:p-8 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
                onClick={() => handleOpenDialog('add-category')}
              >
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <Plus className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <span className="font-medium text-sm md:text-base">Dodaj kategorię</span>
              </motion.button>
            </motion.div>
          ) : (
            // Roadmaps Grid
            <motion.div
              key="roadmaps"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {selectedCategory.roadmaps.map((roadmap, index) => (
                <motion.div
                  key={roadmap.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group rounded-2xl border border-border bg-card shadow-card transition-all hover:shadow-lg hover:border-primary/20 overflow-hidden"
                >
                  {/* Header - clickable */}
                  <div 
                    onClick={() => store.selectRoadmap(roadmap.id)}
                    className="cursor-pointer p-4 md:p-6 pb-4 transition-all hover:bg-gradient-to-br hover:from-secondary/50 hover:to-transparent"
                  >
                    <div className="mb-3 md:mb-4 flex items-center justify-between">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Map className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                      </div>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleOpenDialog('edit-roadmap', roadmap)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => store.deleteRoadmap(roadmap.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-base md:text-lg font-bold text-foreground">{roadmap.title}</h3>
                    {roadmap.description && (
                      <p className="mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground line-clamp-2">{roadmap.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                        {roadmap.topics.length} tematów • {roadmap.totalQuestions} pytań
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 md:w-20 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className="h-2 rounded-full gradient-primary transition-all duration-500"
                            style={{ width: `${roadmap.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{roadmap.progress}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border/50 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-b from-secondary/30 to-secondary/10">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        onClick={() => store.selectRoadmap(roadmap.id)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edytuj
                      </Button>
                      <Button 
                        className="flex-1"
                        size="sm"
                        onClick={() => navigate(`/learn/study?roadmap=${roadmap.id}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ucz się
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Add roadmap button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: selectedCategory.roadmaps.length * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl border-2 border-dashed border-border p-6 md:p-8 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
                onClick={() => handleOpenDialog('add-roadmap')}
              >
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <Plus className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <span className="font-medium text-sm md:text-base">Dodaj roadmapę</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredCategories.length === 0 && !selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Nie znaleziono kategorii</p>
          </motion.div>
        )}
      </div>

      {/* Dialog for add/edit */}
      <Dialog open={dialogType !== null} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'add-category' && 'Nowa kategoria'}
              {dialogType === 'edit-category' && 'Edytuj kategorię'}
              {dialogType === 'add-roadmap' && 'Nowa roadmapa'}
              {dialogType === 'edit-roadmap' && 'Edytuj roadmapę'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(dialogType === 'add-category' || dialogType === 'edit-category') && (
              <div className="flex gap-3">
                <Input
                  placeholder="Ikona (emoji)"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-20 text-center text-xl"
                  maxLength={2}
                />
                <Input
                  placeholder="Nazwa kategorii"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                />
              </div>
            )}
            {(dialogType === 'add-roadmap' || dialogType === 'edit-roadmap') && (
              <>
                <Input
                  placeholder="Nazwa roadmapy"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Opis (opcjonalny)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Anuluj
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {dialogType?.startsWith('add') ? 'Dodaj' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default EditorPage;
