import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Settings2, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '@/stores/editorStore';
import { useEditorCategoryService } from '@/pages/editor/hooks/editorCategoryService';
import { useEditorDialogService } from '@/pages/editor/hooks/editorDialogService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EditorCategoryGrid } from '@/pages/editor/components/EditorCategoryGrid';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const EMOJI_OPTIONS = ["💻", "📚", "🎨", "🔬", "📐", "🌍", "💼", "🎵", "⚽", "🍳", "📜", "🧠"];

const EditorPage = () => {
  const store = useEditorStore();
  const navigate = useNavigate(); // Hook do nawigacji
  const categories = useEditorCategoryService(store);
  const dialog = useEditorDialogService(store);

  // UWAGA: Usunęliśmy całą logikę "if (selectedCategory) return ..."
  // oraz "if (canvas.isCanvasMode) ..."

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Header - uproszczony, tylko dla widoku głównego */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Settings2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  Edytor Roadmap
                </h1>
                <p className="text-sm text-muted-foreground">
                  Wybierz kategorię, aby zarządzać roadmapami
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
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
              value={categories.searchQuery}
              onChange={(e) => categories.setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Grid Kategorii */}
        <EditorCategoryGrid
          key="categories"
          categories={categories.filteredCategories}

          // ZMIANA KLUCZOWA: Zamiast selectCategory, robimy navigate
          onSelectCategory={(category) => navigate(`/editor/category/${category.id}`)}

          onEditCategory={(category) => dialog.openDialog('edit-category', category)}
          onDeleteCategory={store.deleteCategory}
          onAddCategory={() => dialog.openDialog('add-category')}
          getTotalTopics={categories.getTotalTopics}
        />
      </div>

      {/* Dialog (głównie dla Add/Edit Category na tym ekranie) */}
      <Dialog open={dialog.dialogType !== null} onOpenChange={(open) => !open && dialog.closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Tutaj wystarczy obsługa kategorii, bo mapy są głębiej,
                ale dla bezpieczeństwa i spójności z hookiem można zostawić obie gałęzie */}
            {dialog.isCategoryDialog && (
              <div className="flex gap-3 items-center">
                  <div className="w-20">
                    <Select
                      value={dialog.formData.icon}
                      onValueChange={(val) => dialog.setFormData(prev => ({ ...prev, icon: val }))}
                    >
                      <SelectTrigger className="h-10"><SelectValue placeholder="Wybierz" /></SelectTrigger>
                      <SelectContent>
                        {EMOJI_OPTIONS.map((emoji) => (
                          <SelectItem key={emoji} value={emoji}><span className="text-lg">{emoji}</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Nazwa kategorii"
                      value={dialog.formData.name}
                      onChange={(e) => dialog.setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={dialog.closeDialog}>
              Anuluj
            </Button>
            <Button onClick={dialog.submitDialog} disabled={!dialog.formData.name.trim()}>
              {dialog.dialogType?.startsWith('add') ? 'Dodaj' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default EditorPage;