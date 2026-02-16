import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editorStore';
import { useEditorDialogService } from '@/pages/editor/hooks/editorDialogService';
import { EditorRoadmapGrid } from '@/pages/editor/components/EditorRoadmapGrid';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const EditorRoadmapPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const store = useEditorStore();
  const dialog = useEditorDialogService(store);

  const category = useMemo(() =>
    store.state.categories.find(c => c.id === categoryId),
    [store.state.categories, categoryId]
  );

  useEffect(() => {
    if (categoryId && store.state.selectedCategoryId !== categoryId) {
      store.selectCategory(categoryId);
    }
  }, [categoryId, store.state.selectedCategoryId]);

  if (!category) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold">Kategoria nie znaleziona</h2>
            <Button variant="link" onClick={() => navigate('/editor')}>Wróć do listy kategorii</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 md:mb-8">
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate('/editor')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do kategorii
            </Button>
            <div className="flex items-center gap-3">
                <div className="text-4xl">{category.icon}</div>
                <h1 className="text-2xl font-bold">{category.name}</h1>
            </div>
        </motion.div>

        <EditorRoadmapGrid
          category={category}
          onSelectRoadmap={(roadmapId) => navigate(`/editor/roadmap/${roadmapId}`)}
          onEditRoadmap={(roadmap) => dialog.openDialog('edit-roadmap', roadmap)}
          onDeleteRoadmap={store.deleteRoadmap}
          onAddRoadmap={() => dialog.openDialog('add-roadmap')}
        />
      </div>

       <Dialog open={dialog.dialogType !== null && dialog.isRoadmapDialog} onOpenChange={(open) => !open && dialog.closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog.dialogTitle}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
                <Input placeholder="Nazwa roadmapy" value={dialog.formData.name} onChange={(e) => dialog.setFormData(prev => ({ ...prev, name: e.target.value }))} />
                <Input placeholder="Opis" value={dialog.formData.description} onChange={(e) => dialog.setFormData(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={dialog.closeDialog}>Anuluj</Button>
            <Button onClick={dialog.submitDialog}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default EditorRoadmapPage;