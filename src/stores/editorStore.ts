import { create } from 'zustand';
import type { Topic, EditorConnection as DomainEditorConnection } from '@/types/learning';

/**
 * Editor UI store
 *
 * Holds only client-side UI state that is not persisted
 * to the backend. All server state (categories, roadmaps,
 * topics, questions, resources) is managed via React Query
 * hooks in `src/hooks/queries`.
 */

export interface EditorNode {
  id: string;
  topicId: string;
  position: { x: number; y: number };
  title: string;
  status: Topic['status'];
}

export type EditorConnection = DomainEditorConnection;

interface EditorUIState {
  selectedCategoryId: string | null;
  selectedRoadmapId: string | null;
  selectedTopicId: string | null;

  isDragging: boolean;
  draggedNodeId: string | null;
}

interface EditorUIActions {
  setSelectedCategoryId: (id: string | null) => void;
  setSelectedRoadmapId: (id: string | null) => void;
  setSelectedTopicId: (id: string | null) => void;

  setIsDragging: (isDragging: boolean) => void;
  setDraggedNodeId: (id: string | null) => void;

  resetSelection: () => void;
}

export type EditorStore = EditorUIState & EditorUIActions;

export const useEditorStore = create<EditorStore>((set) => ({
  selectedCategoryId: null,
  selectedRoadmapId: null,
  selectedTopicId: null,

  isDragging: false,
  draggedNodeId: null,

  setSelectedCategoryId: (id) =>
    set(() => ({
      selectedCategoryId: id,
      // reset downstream selection when category changes
      selectedRoadmapId: id ? null : null,
      selectedTopicId: null,
    })),

  setSelectedRoadmapId: (id) =>
    set(() => ({
      selectedRoadmapId: id,
      // reset topic when roadmap changes
      selectedTopicId: null,
    })),

  setSelectedTopicId: (id) =>
    set(() => ({
      selectedTopicId: id,
    })),

  setIsDragging: (isDragging) =>
    set(() => ({
      isDragging,
    })),

  setDraggedNodeId: (id) =>
    set(() => ({
      draggedNodeId: id,
    })),

  resetSelection: () =>
    set(() => ({
      selectedCategoryId: null,
      selectedRoadmapId: null,
      selectedTopicId: null,
    })),
}));