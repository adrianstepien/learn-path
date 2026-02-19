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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useEditorCategories } from '@/hooks/queries/useEditorCategories';
import { useEditorRoadmaps } from '@/hooks/queries/useEditorRoadmaps';
import { useDeleteRoadmapMutation } from '@/hooks/queries/useEditorRoadmap';
import { EMOJI_OPTIONS } from '@/types/learning';

const EditorRoadmapPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const ui = useEditorStore();
  const dialog = useEditorDialogService();
  const categoriesQuery = useEditorCategories();
  const roadmapsQuery = useEditorRoadmaps(categoryId);
  const deleteRoadmap = useDeleteRoadmapMutation();

  const category = useMemo(
    () => (categoriesQuery.data || []).find((c) => c.id === categoryId),
    [categoriesQuery.data, categoryId],
  );

  useEffect(() => {
    if (categoryId && ui.selectedCategoryId !== categoryId) {
      ui.setSelectedCategoryId(categoryId);
    }
  }, [categoryId, ui.selectedCategoryId]);

  if (categoriesQuery.isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!category) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold">Roadmapa nie znaleziona</h2>
            <Button variant="link" onClick={() => navigate('/editor')}>Wróć do listy kategorii</Button>
        </div>
      </MainLayout>
    );
  }

  const categoryWithRoadmaps = {
    ...category,
    roadmaps: roadmapsQuery.data || [],
  };

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

        {roadmapsQuery.isLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          </div>
        )}

        <EditorRoadmapGrid
          category={categoryWithRoadmaps}
          onSelectRoadmap={(roadmapId) => navigate(`/editor/topic/${roadmapId}`)}
          onEditRoadmap={(roadmap) => dialog.openDialog('edit-roadmap', roadmap)}
          onDeleteRoadmap={(roadmapId) => deleteRoadmap.mutate({ id: roadmapId, categoryId: category.id })}
          onAddRoadmap={() => dialog.openDialog('add-roadmap')}
        />
      </div>

       <Dialog open={dialog.dialogType !== null && dialog.isRoadmapDialog} onOpenChange={(open) => !open && dialog.closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog.dialogTitle}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
              <div className="flex gap-3 items-center">
                <div className="w-20 flex-shrink-0">
                  <Select value={dialog.formData.icon} onValueChange={(val) => dialog.setFormData(prev => ({ ...prev, icon: val }))}>
                    <SelectTrigger className="h-10 justify-center text-lg"><SelectValue placeholder="Ikona" /></SelectTrigger>
                    <SelectContent>{EMOJI_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input className="flex-1" placeholder="Nazwa roadmapy" value={dialog.formData.name} onChange={(e) => dialog.setFormData(prev => ({ ...prev, name: e.target.value }))}/>
              </div>
              <Input placeholder="Opis roadmapy" value={dialog.formData.description} onChange={(e) => dialog.setFormData(prev => ({ ...prev, description: e.target.value }))}/>
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