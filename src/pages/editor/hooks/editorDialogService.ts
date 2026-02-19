import { useCallback, useMemo, useState } from 'react';

import type { Category, Roadmap } from '@/types/learning';
import { useEditorStore } from '@/stores/editorStore';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '@/hooks/queries/useEditorCategories';
import {
  useCreateRoadmapMutation,
  useUpdateRoadmapMutation,
} from '@/hooks/queries/useEditorRoadmap';

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

export function useEditorDialogService() {
  const ui = useEditorStore();
  const createCategory = useCreateCategoryMutation();
  const updateCategory = useUpdateCategoryMutation();
  const createRoadmap = useCreateRoadmapMutation();
  const updateRoadmap = useUpdateRoadmapMutation();
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
            icon: roadmap.icon || '📚',
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
      createCategory.mutate({
        name: formData.name,
        icon: formData.icon,
        description: formData.description,
      });
    } else if (dialogType === 'edit-category' && editingItem) {
      updateCategory.mutate({
        id: editingItem.id,
        name: formData.name,
        icon: formData.icon,
        description: formData.description,
      });
    } else if (dialogType === 'add-roadmap' && ui.selectedCategoryId) {
      createRoadmap.mutate({
        categoryId: ui.selectedCategoryId,
        title: formData.name,
        icon: formData.icon,
        description: formData.description,
      });
    } else if (dialogType === 'edit-roadmap' && editingItem) {
      updateRoadmap.mutate({
        id: editingItem.id,
        title: formData.name,
        icon: formData.icon,
        description: formData.description,
      });
    }

    closeDialog();
  }, [
    closeDialog,
    dialogType,
    editingItem,
    formData,
    ui.selectedCategoryId,
    createCategory,
    updateCategory,
    createRoadmap,
    updateRoadmap,
  ]);

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

