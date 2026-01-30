import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Map, 
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Category, Roadmap } from '@/types/learning';
import { cn } from '@/lib/utils';

interface EditorSidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  selectedRoadmapId: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectRoadmap: (id: string | null) => void;
  onAddCategory: (name: string, icon: string) => void;
  onUpdateCategory: (id: string, updates: { name?: string; icon?: string }) => void;
  onDeleteCategory: (id: string) => void;
  onAddRoadmap: (categoryId: string, title: string, description?: string) => void;
  onUpdateRoadmap: (id: string, updates: { title?: string; description?: string }) => void;
  onDeleteRoadmap: (id: string) => void;
}

export const EditorSidebar = ({
  categories,
  selectedCategoryId,
  selectedRoadmapId,
  onSelectCategory,
  onSelectRoadmap,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddRoadmap,
  onUpdateRoadmap,
  onDeleteRoadmap,
}: EditorSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dialogType, setDialogType] = useState<'add-category' | 'edit-category' | 'add-roadmap' | 'edit-roadmap' | null>(null);
  const [editingItem, setEditingItem] = useState<Category | Roadmap | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '📚', description: '' });

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

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
      onAddCategory(formData.name, formData.icon);
    } else if (dialogType === 'edit-category' && editingItem) {
      onUpdateCategory(editingItem.id, { name: formData.name, icon: formData.icon });
    } else if (dialogType === 'add-roadmap' && selectedCategoryId) {
      onAddRoadmap(selectedCategoryId, formData.name, formData.description);
    } else if (dialogType === 'edit-roadmap' && editingItem) {
      onUpdateRoadmap(editingItem.id, { title: formData.name, description: formData.description });
    }
    setDialogType(null);
    setFormData({ name: '', icon: '📚', description: '' });
  };

  return (
    <>
      <motion.div
        className={cn(
          'flex h-full flex-col border-r border-border bg-card/50 backdrop-blur-sm',
          isCollapsed ? 'w-16' : 'w-full'
        )}
        animate={{ width: isCollapsed ? 64 : '100%' }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <span className="text-xl">{selectedCategory.icon}</span>
              )}
              <h2 className="font-semibold text-foreground truncate">
                {selectedCategory ? selectedCategory.name : 'Kategorie'}
              </h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto shrink-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-3">
          <AnimatePresence mode="wait">
            {!selectedCategoryId ? (
              // Categories Grid - matching LearnPage style
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {categories.map((category) => (
                  <motion.div
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'group rounded-xl border border-border bg-card p-4 transition-all cursor-pointer',
                      'hover:shadow-md hover:border-primary/30'
                    )}
                    onClick={() => onSelectCategory(category.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{category.icon}</span>
                        {!isCollapsed && (
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{category.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {category.roadmaps.length} roadmap{category.roadmaps.length !== 1 ? 'y' : 'a'}
                            </p>
                          </div>
                        )}
                      </div>
                      {!isCollapsed && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"
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
                              onClick={() => onDeleteCategory(category.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    {/* Progress bar - matching LearnPage */}
                    {!isCollapsed && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Postęp</span>
                          <span className="font-medium text-muted-foreground">{category.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-secondary">
                          <div 
                            className="h-1.5 rounded-full gradient-primary transition-all duration-500"
                            style={{ width: `${category.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Add category button */}
                {!isCollapsed && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full rounded-xl border-2 border-dashed border-border p-4 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                    onClick={() => handleOpenDialog('add-category')}
                  >
                    <Plus className="h-5 w-5" />
                    Dodaj kategorię
                  </motion.button>
                )}
              </motion.div>
            ) : (
              // Roadmaps list - matching LearnPage style
              <motion.div
                key="roadmaps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {/* Back button */}
                <Button
                  variant="ghost"
                  className="mb-2 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onSelectCategory(null)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {!isCollapsed && 'Powrót do kategorii'}
                </Button>

                {selectedCategory?.roadmaps.map((roadmap) => (
                  <motion.div
                    key={roadmap.id}
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'group rounded-xl border bg-card p-4 transition-all cursor-pointer',
                      roadmap.id === selectedRoadmapId 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:shadow-md hover:border-primary/30'
                    )}
                    onClick={() => onSelectRoadmap(roadmap.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                          roadmap.id === selectedRoadmapId ? 'bg-primary/20' : 'bg-secondary'
                        )}>
                          <Map className={cn(
                            'h-5 w-5',
                            roadmap.id === selectedRoadmapId ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>
                        {!isCollapsed && (
                          <div className="min-w-0">
                            <p className={cn(
                              'truncate font-semibold',
                              roadmap.id === selectedRoadmapId ? 'text-primary' : 'text-foreground'
                            )}>
                              {roadmap.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {roadmap.topics.length} tematów • {roadmap.totalQuestions} pytań
                            </p>
                          </div>
                        )}
                      </div>
                      {!isCollapsed && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"
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
                              onClick={() => onDeleteRoadmap(roadmap.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Progress bar */}
                    {!isCollapsed && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Postęp</span>
                          <span className="font-medium text-muted-foreground">{roadmap.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-secondary">
                          <div 
                            className="h-1.5 rounded-full gradient-primary transition-all duration-500"
                            style={{ width: `${roadmap.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Add roadmap button */}
                {!isCollapsed && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full rounded-xl border-2 border-dashed border-border p-4 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                    onClick={() => handleOpenDialog('add-roadmap')}
                  >
                    <Plus className="h-5 w-5" />
                    Dodaj roadmapę
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </motion.div>

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
                  placeholder="Tytuł roadmapy"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Opis (opcjonalnie)"
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
    </>
  );
};
