import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Map, 
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Search,
  Play
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
  const navigate = useNavigate();
  const [dialogType, setDialogType] = useState<'add-category' | 'edit-category' | 'add-roadmap' | 'edit-roadmap' | null>(null);
  const [editingItem, setEditingItem] = useState<Category | Roadmap | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '📚', description: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleStudyRoadmap = (roadmapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/learn/study?roadmap=${roadmapId}`);
  };

  return (
    <>
      <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm">
        {/* Header */}
        <div className="border-b border-border p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            {selectedCategory ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onSelectCategory(null)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <span className="text-lg md:text-xl">{selectedCategory.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-foreground truncate text-sm md:text-base">{selectedCategory.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedCategory.roadmaps.length} roadmap{selectedCategory.roadmaps.length !== 1 ? 'y' : 'a'}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h2 className="font-bold text-foreground text-base md:text-lg">Kategorie</h2>
                <p className="text-xs text-muted-foreground">Wybierz kategorię do edycji</p>
              </div>
            )}
          </div>
          
          {/* Search */}
          {!selectedCategoryId && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj kategorii..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-3 md:p-4">
            <AnimatePresence mode="wait">
              {!selectedCategoryId ? (
                // Categories Grid - matching LearnPage style
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2 md:space-y-3"
                >
                  {filteredCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      className={cn(
                        'group rounded-xl md:rounded-2xl border border-border bg-card p-3 md:p-4 transition-all cursor-pointer',
                        'hover:shadow-lg hover:border-primary/20'
                      )}
                      onClick={() => onSelectCategory(category.id)}
                    >
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          <span className="text-xl md:text-2xl">{category.icon}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8 opacity-0 group-hover:opacity-100"
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
                      </div>
                      
                      <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">{category.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2 md:mb-3">
                        {category.roadmaps.length} roadmap{category.roadmaps.length !== 1 ? 'y' : 'a'} • {
                          category.roadmaps.reduce((sum, r) => sum + r.topics.length, 0)
                        } tematów
                      </p>
                      
                      {/* Progress bar - matching LearnPage */}
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 md:h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className="h-full rounded-full gradient-primary transition-all duration-500"
                            style={{ width: `${category.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{category.progress}%</span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add category button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full rounded-xl md:rounded-2xl border-2 border-dashed border-border p-4 md:p-6 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
                    onClick={() => handleOpenDialog('add-category')}
                  >
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <Plus className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="font-medium text-sm md:text-base">Dodaj kategorię</span>
                  </motion.button>
                </motion.div>
              ) : (
                // Roadmaps list - matching LearnPage style
                <motion.div
                  key="roadmaps"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2 md:space-y-3"
                >
                  {selectedCategory?.roadmaps.map((roadmap, index) => (
                    <motion.div
                      key={roadmap.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      className={cn(
                        'group rounded-xl md:rounded-2xl border bg-card p-3 md:p-4 transition-all cursor-pointer',
                        roadmap.id === selectedRoadmapId 
                          ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20' 
                          : 'border-border hover:shadow-lg hover:border-primary/20'
                      )}
                      onClick={() => onSelectRoadmap(roadmap.id)}
                    >
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className={cn(
                          'h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center',
                          roadmap.id === selectedRoadmapId 
                            ? 'bg-primary/20' 
                            : 'bg-gradient-to-br from-primary/10 to-accent/10'
                        )}>
                          <Map className={cn(
                            'h-5 w-5 md:h-6 md:w-6',
                            roadmap.id === selectedRoadmapId ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 md:h-8 md:w-8 opacity-0 group-hover:opacity-100"
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
                      </div>

                      <h3 className={cn(
                        'font-bold mb-1 text-sm md:text-base',
                        roadmap.id === selectedRoadmapId ? 'text-primary' : 'text-foreground'
                      )}>
                        {roadmap.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 md:mb-3">
                        {roadmap.topics.length} tematów • {roadmap.totalQuestions} pytań
                      </p>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-1.5 md:h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className="h-full rounded-full gradient-primary transition-all duration-500"
                            style={{ width: `${roadmap.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{roadmap.progress}%</span>
                      </div>

                      {/* Study button */}
                      <Button
                        size="sm"
                        variant={roadmap.id === selectedRoadmapId ? 'default' : 'outline'}
                        className="w-full h-8 text-xs md:text-sm"
                        onClick={(e) => handleStudyRoadmap(roadmap.id, e)}
                      >
                        <Play className="h-3 w-3 mr-1.5" />
                        Ucz się
                      </Button>
                    </motion.div>
                  ))}

                  {/* Add roadmap button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full rounded-xl md:rounded-2xl border-2 border-dashed border-border p-4 md:p-6 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
                    onClick={() => handleOpenDialog('add-roadmap')}
                  >
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <Plus className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="font-medium text-sm md:text-base">Dodaj roadmapę</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
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
