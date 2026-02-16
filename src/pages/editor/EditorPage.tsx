import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEditorStore } from '@/stores/editorStore';
import { useEditorDialogService } from '@/pages/editor/hooks/editorDialogService';
import { EditorCategoryGrid } from '@/pages/editor/components/EditorCategoryGrid';
import { useCategorySearch } from '@/pages/learn/hooks/useCategorySearch';
import { SearchBar } from '@/pages/learn/components/SearchBar';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const EMOJI_OPTIONS = ["💻", "📚", "🎨", "🔬", "📐", "🌍", "💼", "🎵", "⚽", "🍳", "📜", "🧠"];

const EditorPage = () => {
  const store = useEditorStore();
  const navigate = useNavigate();
  const dialog = useEditorDialogService(store);

  // Wyszukiwanie kategorii
  const { searchQuery, setSearchQuery, filteredCategories } = useCategorySearch(store.state.categories || []);

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Settings2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Edytor kategorii</h1>
              <p className="text-sm text-muted-foreground">Wybierz kategorię do edycji</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Grid Kategorii */}
        <EditorCategoryGrid
          categories={filteredCategories}
          onSelectCategory={(id) => navigate(`/editor/roadmap/${id}`)}
          onEditCategory={(category) => dialog.openDialog('edit-category', category)}
          onDeleteCategory={store.deleteCategory}
          onAddCategory={() => dialog.openDialog('add-category')}
        />
      </div>

      {/* Dialog Add/Edit Category */}
      <Dialog open={dialog.dialogType !== null && dialog.isCategoryDialog} onOpenChange={(open) => !open && dialog.closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{dialog.dialogTitle}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
             <div className="flex gap-3 items-center">
                <div className="w-20">
                  <Select value={dialog.formData.icon} onValueChange={(val) => dialog.setFormData(prev => ({ ...prev, icon: val }))}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Ikona" /></SelectTrigger>
                    <SelectContent>{EMOJI_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input placeholder="Nazwa kategorii" value={dialog.formData.name} onChange={(e) => dialog.setFormData(prev => ({ ...prev, name: e.target.value }))} />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={dialog.closeDialog}>Anuluj</Button>
            <Button onClick={dialog.submitDialog} disabled={!dialog.formData.name.trim()}>{dialog.dialogType?.startsWith('add') ? 'Dodaj' : 'Zapisz'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default EditorPage;