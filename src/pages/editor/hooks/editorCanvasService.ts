import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import type { Resource, Question, Topic } from '@/types/learning';
import { useEditorStore } from '@/stores/editorStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorRoadmap } from '@/hooks/queries/useEditorRoadmap';
import {
  useEditorTopic,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useAddResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
} from '@/hooks/queries/useEditorTopic';
import type { EditorNode } from '@/stores/editorStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editorKeys } from '@/hooks/queries/editorQueryKeys';
import { mapTopicToUpdateDto } from '@/domain/editorMappers';
import * as api from '@/lib/api';

export type CanvasPosition = { x: number; y: number };

export function useEditorCanvasService(roadmapId: string | undefined) {
  const ui = useEditorStore();
  const canvas = useCanvasStore();
  const queryClient = useQueryClient();

  const {
    roadmap,
    topics,
    connections,
    isLoading: isRoadmapLoading,
    moveNode,
    addNode,
    deleteNode,
    addConnection,
    deleteConnection,
  } = useEditorRoadmap(roadmapId);

  const selectedTopicBase = useMemo(
    () => topics.find((t) => t.id === ui.selectedTopicId) || null,
    [topics, ui.selectedTopicId],
  );

  const topicDetailsQuery = useEditorTopic(ui.selectedTopicId);

  const addQuestionMutation = useAddQuestionMutation();
  const updateQuestionMutation = useUpdateQuestionMutation();
  const deleteQuestionMutation = useDeleteQuestionMutation();

  const addResourceMutation = useAddResourceMutation();
  const updateResourceMutation = useUpdateResourceMutation();
  const deleteResourceMutation = useDeleteResourceMutation();

  const updateTopicMutation = useMutation({
    mutationFn: async ({
      topicId,
      updates,
    }: {
      topicId: string;
      updates: Partial<Topic>;
    }) => {
      const cachedTopics =
        queryClient.getQueryData<Topic[]>(editorKeys.topics(roadmapId || 'unknown')) ||
        [];
      const existing = cachedTopics.find((t) => t.id === topicId);
      if (!existing) return;

      const dto = mapTopicToUpdateDto({ ...existing, ...updates });
      if (!dto.id) return;

      await api.updateTopic(dto.id, dto);
    },
    onSuccess: () => {
      if (!roadmapId) return;
      queryClient.invalidateQueries({ queryKey: editorKeys.topics(roadmapId) });
    },
  });

  const nodes: EditorNode[] = useMemo(
    () =>
      topics.map((t) => ({
        id: t.id,
        topicId: t.id,
        position: t.position,
        title: t.title,
        status: t.status,
      })),
    [topics],
  );

  const selectedTopic: Topic | null = useMemo(() => {
    if (!selectedTopicBase) return null;
    const details = topicDetailsQuery.data;
    if (!details) return selectedTopicBase;
    return {
      ...selectedTopicBase,
      resources: details.resources,
      questions: details.questions,
    };
  }, [selectedTopicBase, topicDetailsQuery.data]);

  const isCanvasMode = !!roadmapId && !!roadmap;

  const handleAddNode = useCallback(
    (position: CanvasPosition) => {
      canvas.openAddNodeDialog(position);
    },
    [canvas],
  );

  const closeAddNodeDialog = useCallback(() => {
    canvas.closeAddNodeDialog();
  }, [canvas]);

  const handleCreateNode = useCallback(
    async (title: string) => {
      if (!canvas.addNodePosition) return;
      try {
        await addNode({ title, position: canvas.addNodePosition });
        toast.success(`Dodano temat: ${title}`);
      } catch {
        // Error toast is handled in mutation onError
      } finally {
        canvas.closeAddNodeDialog();
      }
    },
    [addNode, canvas],
  );

  const selectNode = useCallback(
    (nodeId: string | null) => {
      ui.setSelectedTopicId(nodeId);
      canvas.selectNode(nodeId);
    },
    [ui, canvas],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      selectNode(nodeId);
    },
    [selectNode],
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      selectNode(nodeId);
    },
    [selectNode],
  );

  const handleConnectionEnd = useCallback(
    (nodeId: string) => {
      if (canvas.connectingFromId && canvas.connectingFromId !== nodeId) {
        addConnection({ from: canvas.connectingFromId, to: nodeId });
        toast.success('Połączenie utworzone');
        canvas.setConnectingFrom(null);
      } else {
        canvas.setConnectingFrom(null);
      }
    },
    [addConnection, canvas],
  );

  const handleSave = useCallback(() => {
    toast.success('Zmiany są automatycznie zapisywane');
  }, []);

  const closeTopicPanel = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const updateSelectedTopic = useCallback(
    (updates: Partial<Topic>) => {
      if (!ui.selectedTopicId) return;
      updateTopicMutation.mutate({ topicId: ui.selectedTopicId, updates });
      toast.success('Temat zaktualizowany');
    },
    [ui.selectedTopicId, updateTopicMutation],
  );

  const addQuestionToSelectedTopic = useCallback(
    (question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt'>) => {
      if (!ui.selectedTopicId) return;
      addQuestionMutation.mutate({ topicId: ui.selectedTopicId, question: question as any });
      toast.success('Pytanie dodane');
    },
    [ui.selectedTopicId, addQuestionMutation],
  );

  const updateQuestion = useCallback(
    (questionId: string, updates: Partial<Question>) => {
      if (!ui.selectedTopicId) return;
      updateQuestionMutation.mutate({
        topicId: ui.selectedTopicId,
        questionId,
        updates: updates as any,
      });
      toast.success('Pytanie zaktualizowane');
    },
    [ui.selectedTopicId, updateQuestionMutation],
  );

  const deleteQuestion = useCallback(
    (questionId: string) => {
      if (!ui.selectedTopicId) return;
      deleteQuestionMutation.mutate({ topicId: ui.selectedTopicId, questionId });
      toast.success('Pytanie usunięte');
    },
    [ui.selectedTopicId, deleteQuestionMutation],
  );

  const addResourceToSelectedTopic = useCallback(
    (resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => {
      if (!ui.selectedTopicId) return;
      addResourceMutation.mutate({
        topicId: ui.selectedTopicId,
        resource: resource as any,
      });
      toast.success('Materiał dodany');
    },
    [ui.selectedTopicId, addResourceMutation],
  );

  const updateResource = useCallback(
    (resourceId: string, updates: Partial<Resource>) => {
      if (!ui.selectedTopicId) return;
      updateResourceMutation.mutate({
        topicId: ui.selectedTopicId,
        resourceId,
        updates: updates as any,
      });
      toast.success('Materiał zaktualizowany');
    },
    [ui.selectedTopicId, updateResourceMutation],
  );

  const deleteResource = useCallback(
    (resourceId: string) => {
      if (!ui.selectedTopicId) return;
      deleteResourceMutation.mutate({ topicId: ui.selectedTopicId, resourceId });
      toast.success('Materiał usunięty');
    },
    [ui.selectedTopicId, deleteResourceMutation],
  );

  const onNodeMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      moveNode({ id: nodeId, position });
    },
    [moveNode],
  );

  const onNodeDelete = useCallback(
    (nodeId: string) => {
      deleteNode(nodeId);
      if (ui.selectedTopicId === nodeId) {
        selectNode(null);
      }
    },
    [deleteNode, ui.selectedTopicId, selectNode],
  );

  const onConnectionStart = useCallback(
    (nodeId: string) => {
      canvas.setConnectingFrom(nodeId);
    },
    [canvas],
  );

  const onConnectionDelete = useCallback(
    (connectionId: string) => {
      const conn = connections.find((c) => c.id === connectionId);
      if (!conn) return;
      deleteConnection({ from: conn.from, to: conn.to });
    },
    [connections, deleteConnection],
  );

  const onZoomChange = useCallback(
    (zoom: number) => {
      canvas.setZoom(zoom);
    },
    [canvas],
  );

  const onPanChange = useCallback(
    (pan: { x: number; y: number }) => {
      canvas.setPan(pan);
    },
    [canvas],
  );

  const exitCanvasMode = useCallback(() => {
    ui.setSelectedRoadmapId(null);
    selectNode(null);
  }, [ui, selectNode]);

  return {
    // mode/state
    isCanvasMode,
    selectedRoadmap: roadmap,
    selectedTopic,
    addNodePosition: canvas.addNodePosition,
    isLoading: isRoadmapLoading || topicDetailsQuery.isLoading,

    // nodes & connections
    handleAddNode,
    closeAddNodeDialog,
    handleCreateNode,
    handleNodeClick,
    handleNodeDoubleClick,
    handleConnectionEnd,

    // persistence
    handleSave,

    // topic panel
    closeTopicPanel,
    updateSelectedTopic,
    addQuestionToSelectedTopic,
    updateQuestion,
    deleteQuestion,
    addResourceToSelectedTopic,
    updateResource,
    deleteResource,

    // pass-through state for canvas
    nodes,
    connections,
    zoom: canvas.zoom,
    pan: canvas.pan,
    connectingFrom: canvas.connectingFromId,
    selectedNodeId: canvas.selectedNodeId,

    // pass-through actions for canvas
    onNodeMove,
    onNodeDelete,
    onConnectionStart,
    onConnectionDelete,
    onZoomChange,
    onPanChange,

    // navigation helpers
    exitCanvasMode,
  };
}

