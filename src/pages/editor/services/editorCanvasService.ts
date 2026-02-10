import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { Resource, Question, Topic } from '@/types/learning';
import type { useEditorStore } from '@/stores/editorStore';

type EditorStore = ReturnType<typeof useEditorStore>;

export type CanvasPosition = { x: number; y: number };

export function useEditorCanvasService(store: EditorStore) {
  const [addNodePosition, setAddNodePosition] = useState<CanvasPosition | null>(null);

  const selectedTopic = store.getSelectedTopic();
  const selectedRoadmap = store.getSelectedRoadmap();

  const isCanvasMode = !!store.state.selectedRoadmapId && !!selectedRoadmap;

  const handleAddNode = useCallback((position: CanvasPosition) => {
    setAddNodePosition(position);
  }, []);

  const closeAddNodeDialog = useCallback(() => {
    setAddNodePosition(null);
  }, []);

  const handleCreateNode = useCallback(
    (title: string) => {
      if (!addNodePosition) return;
      store.addNode(title, addNodePosition);
      setAddNodePosition(null);
      toast.success(`Dodano temat: ${title}`);
    },
    [addNodePosition, store]
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      store.selectTopic(nodeId);
    },
    [store]
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      store.selectTopic(nodeId);
    },
    [store]
  );

  const handleConnectionEnd = useCallback(
    (nodeId: string) => {
      if (store.state.connectingFrom && store.state.connectingFrom !== nodeId) {
        store.addConnection(store.state.connectingFrom, nodeId, 'suggested_order');
        toast.success('Połączenie utworzone');
      } else {
        store.setConnectingFrom(null);
      }
    },
    [store]
  );

  const handleSave = useCallback(() => {
    store.saveAllData();
    toast.success('Zmiany zapisane!');
  }, [store]);

  const closeTopicPanel = useCallback(() => {
    store.selectTopic(null);
  }, [store]);

  const updateSelectedTopic = useCallback(
    (updates: Partial<Topic>) => {
      if (!store.state.selectedTopicId) return;
      // Store API uses EditorNode shape; TopicEditPanel provides topic updates.
      // Keep behavior unchanged from previous inline cast.
      store.updateNode(store.state.selectedTopicId, updates as any);
    },
    [store]
  );

  const addQuestionToSelectedTopic = useCallback(
    (question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt'>) => {
      if (!store.state.selectedTopicId) return;
      store.addQuestion(store.state.selectedTopicId, question as any);
      toast.success('Pytanie dodane');
    },
    [store]
  );

  const updateQuestion = useCallback(
    (questionId: string, updates: Partial<Question>) => {
      store.updateQuestion(questionId, updates as any);
      toast.success('Pytanie zaktualizowane');
    },
    [store]
  );

  const deleteQuestion = useCallback(
    (questionId: string) => {
      store.deleteQuestion(questionId);
      toast.success('Pytanie usunięte');
    },
    [store]
  );

  const addResourceToSelectedTopic = useCallback(
    (resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => {
      if (!store.state.selectedTopicId) return;
      store.addResource(store.state.selectedTopicId, resource as any);
      toast.success('Materiał dodany');
    },
    [store]
  );

  const updateResource = useCallback(
    (resourceId: string, updates: Partial<Resource>) => {
      store.updateResource(resourceId, updates as any);
      toast.success('Materiał zaktualizowany');
    },
    [store]
  );

  const deleteResource = useCallback(
    (resourceId: string) => {
      store.deleteResource(resourceId);
      toast.success('Materiał usunięty');
    },
    [store]
  );

  return {
    // mode/state
    isCanvasMode,
    selectedRoadmap,
    selectedTopic,
    addNodePosition,

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
    nodes: store.state.nodes,
    connections: store.state.connections,
    zoom: store.state.zoom,
    pan: store.state.pan,
    connectingFrom: store.state.connectingFrom,
    selectedNodeId: store.state.selectedTopicId,

    // pass-through actions for canvas
    onNodeMove: store.updateNodePosition,
    onNodeDelete: store.deleteNode,
    onConnectionStart: store.setConnectingFrom,
    onConnectionDelete: store.deleteConnection,
    onZoomChange: store.setZoom,
    onPanChange: store.setPan,

    // navigation helpers
    exitCanvasMode: () => store.selectRoadmap(null),
  };
}

