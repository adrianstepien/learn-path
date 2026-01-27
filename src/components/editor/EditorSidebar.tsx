import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  FolderOpen, 
  Map, 
  Plus,
  Pencil,
  Trash2,
  MoreVertical
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
        // It's a Category
        const cat = item as Category;
        setFormData({ name: cat.name, icon: cat.icon || '📚', description: cat.description || '' });
      } else if ('title' in item) {
        // It's a Roadmap
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
          'flex h-full flex-col border-r border-border bg-card',
          isCollapsed ? 'w-16' : 'w-72'
        )}
        animate={{ width: isCollapsed ? 64 : 288 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          {!isCollapsed && (
            <h2 className="font-semibold text-foreground">
              {selectedCategory ? selectedCategory.name : 'Kategorie'}
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-2">
          <AnimatePresence mode="wait">
            {!selectedCategoryId ? (
              // Categories list
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-1"
              >
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer',
                      'hover:bg-secondary'
                    )}
                    onClick={() => onSelectCategory(category.id)}
                  >
                    <span className="text-xl">{category.icon}</span>
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-foreground">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.roadmaps.length} roadmap
                          </p>
                        </div>
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
                              onClick={() => onDeleteCategory(category.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                ))}

                {/* Add category button */}
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground"
                    onClick={() => handleOpenDialog('add-category')}
                  >
                    <Plus className="h-5 w-5" />
                    Dodaj kategorię
                  </Button>
                )}
              </motion.div>
            ) : (
              // Roadmaps list
              <motion.div
                key="roadmaps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-1"
              >
                {/* Back button */}
                <Button
                  variant="ghost"
                  className="mb-2 w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => onSelectCategory(null)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {!isCollapsed && 'Powrót do kategorii'}
                </Button>

                {selectedCategory?.roadmaps.map((roadmap) => (
                  <div
                    key={roadmap.id}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer',
                      roadmap.id === selectedRoadmapId 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-secondary'
                    )}
                    onClick={() => onSelectRoadmap(roadmap.id)}
                  >
                    <Map className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{roadmap.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {roadmap.topics.length} tematów
                          </p>
                        </div>
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
                              onClick={() => onDeleteRoadmap(roadmap.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                ))}

                {/* Add roadmap button */}
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground"
                    onClick={() => handleOpenDialog('add-roadmap')}
                  >
                    <Plus className="h-5 w-5" />
                    Dodaj roadmapę
                  </Button>
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
