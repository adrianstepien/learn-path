import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings2, ArrowLeft, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useEditorStore } from '@/stores/editorStore';
import { useEditorCategoryService } from '@/pages/editor/hooks/editorCategoryService';
import { useEditorDialogService } from '@/pages/editor/hooks/editorDialogService';
import { EditorRoadmapGrid } from '@/pages/editor/components/EditorRoadmapGrid';

// Opcje ikon (potrzebne do dialogu edycji, który tu też może wystąpić)
const EMOJI_OPTIONS = ["💻", "📚", "🎨", "🔬", "📐", "🌍", "💼", "🎵", "⚽", "🍳", "📜", "🧠"];

const EditorCategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const store = useEditorStore();
  const categoriesService = useEditorCategoryService(store);
  const dialog = useEditorDialogService(store);

  // Synchronizacja URL ze stanem
  useEffect(() => {
    if (categoryId) {
      store.selectCategory(categoryId);
    }
    return () => {
      store.selectCategory(null);
    };
  }, [categoryId]);

  const selectedCategory = categoriesService.selectedCategory;

  // Obsługa ładowania lub braku kategorii
  if (store.state.isLoading) {
    return <MainLayout><div className="p-8">Ładowanie...</div></MainLayout>;
  }

  if (!selectedCategory && !store.state.isLoading) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl">Nie znaleziono kategorii</h2>
          <Button onClick={() => navigate('/editor')} className="mt-4">Wróć do listy</Button>
        </div>
      </MainLayout>
    );
  }

  // Jeśli mamy kategorię, wyświetlamy jej zawartość
  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Header kategorii */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('/editor')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-2xl">{selectedCategory?.icon || <Settings2 className="h-5 w-5" />}</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {selectedCategory?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedCategory?.roadmaps.length} roadmap{(selectedCategory?.roadmaps.length !== 1 ? 'y' : 'a')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista Roadmap wewnątrz kategorii */}
        {selectedCategory && (
          <EditorRoadmapGrid
            key="roadmaps"
            category={selectedCategory}
            // Tu nawigujemy do widoku Canvasa (z poprzedniego kroku)
            onSelectRoadmap={(roadmap) => navigate(`/editor/roadmap/${roadmap.id}`)}
            onEditRoadmap={(roadmap) => dialog.openDialog('edit-roadmap', roadmap)}
            onDeleteRoadmap={store.deleteRoadmap}
            onAddRoadmap={() => dialog.openDialog('add-roadmap')}
            onStartStudy={(roadmapId) => navigate(`/learn/study?roadmap=${roadmapId}`)}
          />
        )}
      </div>

      {/* Dialogi (Add/Edit Roadmap, Edit Category) */}
      <Dialog open={dialog.dialogType !== null} onOpenChange={(open) => !open && dialog.closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             {/* Logika formularzy identyczna jak w EditorPage - skopiowana dla spójności */}
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
            {dialog.isRoadmapDialog && (
              <>
                <Input
                  placeholder="Nazwa roadmapy"
                  value={dialog.formData.name}
                  onChange={(e) => dialog.setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Opis (opcjonalny)"
                  value={dialog.formData.description}
                  onChange={(e) => dialog.setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={dialog.closeDialog}>Anuluj</Button>
            <Button onClick={dialog.submitDialog} disabled={!dialog.formData.name.trim()}>
              {dialog.dialogType?.startsWith('add') ? 'Dodaj' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default EditorCategoryPage;