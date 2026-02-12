import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings2, ArrowLeft, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '@/stores/editorStore';
import { useEditorCanvasService } from '@/pages/editor/hooks/editorCanvasService';
import { useEditorCategoryService } from '@/pages/editor/hooks/editorCategoryService';
import { useEditorDialogService } from '@/pages/editor/hooks/editorDialogService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Category, Roadmap } from '@/types/learning';
import { EditorCanvasLayout } from '@/pages/editor/components/EditorCanvasLayout';
import { EditorCategoryGrid } from '@/pages/editor/components/EditorCategoryGrid';
import { EditorRoadmapGrid } from '@/pages/editor/components/EditorRoadmapGrid';
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
  const navigate = useNavigate();

  const canvas = useEditorCanvasService(store);
  const selectedRoadmap = canvas.selectedRoadmap;
  const categories = useEditorCategoryService(store);
  const selectedCategory = categories.selectedCategory;
  const dialog = useEditorDialogService(store);

  // Canvas view when a roadmap is selected
  if (canvas.isCanvasMode && selectedRoadmap) {
    return (
      <MainLayout>
        <EditorCanvasLayout
          canvas={canvas}
          onBack={canvas.exitCanvasMode}
          onStartStudy={() =>
            navigate(`/learn/study?roadmap=${selectedRoadmap.id}`)
          }
        />
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
                onClick={() => categories.selectCategory(null)}
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
                  value={categories.searchQuery}
                  onChange={(e) => categories.setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <EditorCategoryGrid
              key="categories"
              categories={categories.filteredCategories}
              onSelectCategory={categories.selectCategory}
              onEditCategory={(category) =>
                dialog.openDialog('edit-category', category)
              }
              onDeleteCategory={store.deleteCategory}
              onAddCategory={() => dialog.openDialog('add-category')}
              getTotalTopics={categories.getTotalTopics}
            />
          ) : (
            <EditorRoadmapGrid
              key="roadmaps"
              category={selectedCategory}
              onSelectRoadmap={categories.selectRoadmap}
              onEditRoadmap={(roadmap) =>
                dialog.openDialog('edit-roadmap', roadmap)
              }
              onDeleteRoadmap={store.deleteRoadmap}
              onAddRoadmap={() => dialog.openDialog('add-roadmap')}
              onStartStudy={(roadmapId) =>
                navigate(`/learn/study?roadmap=${roadmapId}`)
              }
            />
          )}
        </AnimatePresence>
      </div>

      {/* Dialog for add/edit */}
      <Dialog open={dialog.dialogType !== null} onOpenChange={(open) => !open && dialog.closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dialog.isCategoryDialog && (
              <div className="flex gap-3 items-center">
                  <div className="w-20">
                    <Select
                      value={dialog.formData.icon}
                      onValueChange={(val) =>
                        dialog.setFormData(prev => ({ ...prev, icon: val }))
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Wybierz" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMOJI_OPTIONS.map((emoji) => (
                          <SelectItem key={emoji} value={emoji}>
                            <span className="text-lg">{emoji}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Input
                      placeholder="Nazwa kategorii"
                      value={dialog.formData.name}
                      onChange={(e) =>
                        dialog.setFormData(prev => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                </div>
            )}
            {dialog.isRoadmapDialog && (
              <>
                <Input
                  placeholder="Nazwa roadmapy"
                  value={dialog.formData.name}
                  onChange={(e) =>
                    dialog.setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                />
                <Input
                  placeholder="Opis (opcjonalny)"
                  value={dialog.formData.description}
                  onChange={(e) =>
                    dialog.setFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                />
              </>
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
