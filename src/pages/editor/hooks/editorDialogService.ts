import { useCallback, useMemo, useState } from 'react';

import type { Category, Roadmap } from '@/types/learning';
import type { useEditorStore } from '@/stores/editorStore';

type EditorStore = ReturnType<typeof useEditorStore>;

export type DialogType =
  | 'add-category'
  | 'edit-category'
  | 'add-roadmap'
  | 'edit-roadmap'
  | null;

export interface DialogFormData {
  name: string;
  icon: string;
  description: string;
}

export function useEditorDialogService(store: EditorStore) {
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [editingItem, setEditingItem] = useState<Category | Roadmap | null>(null);
  const [formData, setFormData] = useState<DialogFormData>({
    name: '',
    icon: '📚',
    description: '',
  });

  const resetForm = useCallback(() => {
    setFormData({ name: '', icon: '📚', description: '' });
    setEditingItem(null);
  }, []);

  const openDialog = useCallback(
    (type: Exclude<DialogType, null>, item?: Category | Roadmap) => {
      setDialogType(type);
      setEditingItem(item || null);

      if (item) {
        if ('icon' in item && 'name' in item && !('title' in item)) {
          const cat = item as Category;
          setFormData({
            name: cat.name,
            icon: cat.icon || '📚',
            description: cat.description || '',
          });
        } else if ('title' in item) {
          const roadmap = item as Roadmap;
          setFormData({
            name: roadmap.title,
            icon: '',
            description: roadmap.description || '',
          });
        }
      } else {
        resetForm();
      }
    },
    [resetForm]
  );

  const closeDialog = useCallback(() => {
    setDialogType(null);
    resetForm();
  }, [resetForm]);

  const submitDialog = useCallback(() => {
    if (!dialogType) return;

    if (dialogType === 'add-category') {
      store.addCategory(formData.name, formData.icon);
    } else if (dialogType === 'edit-category' && editingItem) {
      store.updateCategory(editingItem.id, {
        name: formData.name,
        icon: formData.icon,
      });
    } else if (dialogType === 'add-roadmap' && store.state.selectedCategoryId) {
      store.addRoadmap(store.state.selectedCategoryId, formData.name, formData.description);
    } else if (dialogType === 'edit-roadmap' && editingItem) {
      store.updateRoadmap(editingItem.id, {
        title: formData.name,
        description: formData.description,
      });
    }

    closeDialog();
  }, [closeDialog, dialogType, editingItem, formData, store]);

  const dialogTitle = useMemo(() => {
    switch (dialogType) {
      case 'add-category':
        return 'Nowa kategoria';
      case 'edit-category':
        return 'Edytuj kategorię';
      case 'add-roadmap':
        return 'Nowa roadmapa';
      case 'edit-roadmap':
        return 'Edytuj roadmapę';
      default:
        return '';
    }
  }, [dialogType]);

  const isCategoryDialog =
    dialogType === 'add-category' || dialogType === 'edit-category';
  const isRoadmapDialog =
    dialogType === 'add-roadmap' || dialogType === 'edit-roadmap';

  return {
    dialogType,
    formData,
    setFormData,
    openDialog,
    closeDialog,
    submitDialog,
    dialogTitle,
    isCategoryDialog,
    isRoadmapDialog,
  };
}

