import { useState, useCallback, useEffect } from 'react';
import { Category, Roadmap, Topic, Question, Resource, TopicConnection } from '@/types/learning';
import { mockCategories as initialCategories } from '@/data/mockData';

// Storage key for persisting positions
const STORAGE_KEY = 'learnflow-editor-positions';

// Helper to load saved positions from localStorage
const loadSavedPositions = (): Record<string, { x: number; y: number }> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Helper to save positions to localStorage
const savePositions = (positions: Record<string, { x: number; y: number }>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Ignore storage errors
  }
};

// Editor state management using React hooks pattern
export interface EditorNode {
  id: string;
  topicId: string;
  position: { x: number; y: number };
  title: string;
  status: Topic['status'];
}

export interface EditorConnection {
  id: string;
  from: string;
  to: string;
  type: TopicConnection['type'];
}

export interface EditorState {
  categories: Category[];
  selectedCategoryId: string | null;
  selectedRoadmapId: string | null;
  selectedTopicId: string | null;
  nodes: EditorNode[];
  connections: EditorConnection[];
  isDragging: boolean;
  draggedNodeId: string | null;
  connectingFrom: string | null;
  zoom: number;
  pan: { x: number; y: number };
  savedPositions: Record<string, { x: number; y: number }>;
}

export const createInitialState = (): EditorState => ({
  categories: initialCategories,
  selectedCategoryId: null,
  selectedRoadmapId: null,
  selectedTopicId: null,
  nodes: [],
  connections: [],
  isDragging: false,
  draggedNodeId: null,
  connectingFrom: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  savedPositions: loadSavedPositions(),
});

export const useEditorStore = () => {
  const [state, setState] = useState<EditorState>(createInitialState);

  // Save positions whenever they change
  useEffect(() => {
    if (Object.keys(state.savedPositions).length > 0) {
      savePositions(state.savedPositions);
    }
  }, [state.savedPositions]);

  const selectCategory = useCallback((categoryId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedCategoryId: categoryId,
      selectedRoadmapId: null,
      selectedTopicId: null,
      nodes: [],
      connections: [],
    }));
  }, []);

  const selectRoadmap = useCallback((roadmapId: string | null) => {
    setState(prev => {
      if (!roadmapId) {
        return { ...prev, selectedRoadmapId: null, nodes: [], connections: [] };
      }

      // Find the roadmap and load its topics
      let foundRoadmap: Roadmap | undefined;
      for (const cat of prev.categories) {
        foundRoadmap = cat.roadmaps.find(r => r.id === roadmapId);
        if (foundRoadmap) break;
      }

      if (!foundRoadmap) return prev;

      // Use saved positions if available, otherwise use topic's default position
      const nodes: EditorNode[] = foundRoadmap.topics.map(t => ({
        id: t.id,
        topicId: t.id,
        position: prev.savedPositions[t.id] || t.position,
        title: t.title,
        status: t.status,
      }));

      const connections: EditorConnection[] = foundRoadmap.connections.map(c => ({
        id: c.id,
        from: c.fromTopicId,
        to: c.toTopicId,
        type: c.type,
      }));

      return {
        ...prev,
        selectedRoadmapId: roadmapId,
        selectedTopicId: null,
        nodes,
        connections,
      };
    });
  }, []);

  const selectTopic = useCallback((topicId: string | null) => {
    setState(prev => ({ ...prev, selectedTopicId: topicId }));
  }, []);

  const addCategory = useCallback((name: string, icon: string) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      icon,
      roadmaps: [],
      progress: 0,
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
    return newCategory;
  }, []);

  const updateCategory = useCallback((categoryId: string, updates: Partial<Pick<Category, 'name' | 'icon' | 'description'>>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => 
        c.id === categoryId ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== categoryId),
      selectedCategoryId: prev.selectedCategoryId === categoryId ? null : prev.selectedCategoryId,
    }));
  }, []);

  const addRoadmap = useCallback((categoryId: string, title: string, description?: string) => {
    const newRoadmap: Roadmap = {
      id: `roadmap-${Date.now()}`,
      categoryId,
      title,
      description,
      topics: [],
      connections: [],
      progress: 0,
      totalQuestions: 0,
      masteredQuestions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c =>
        c.id === categoryId
          ? { ...c, roadmaps: [...c.roadmaps, newRoadmap] }
          : c
      ),
    }));
    return newRoadmap;
  }, []);

  const updateRoadmap = useCallback((roadmapId: string, updates: Partial<Pick<Roadmap, 'title' | 'description'>>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r =>
          r.id === roadmapId ? { ...r, ...updates, updatedAt: new Date() } : r
        ),
      })),
    }));
  }, []);

  const deleteRoadmap = useCallback((roadmapId: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.filter(r => r.id !== roadmapId),
      })),
      selectedRoadmapId: prev.selectedRoadmapId === roadmapId ? null : prev.selectedRoadmapId,
    }));
  }, []);

  const addNode = useCallback((title: string, position: { x: number; y: number }) => {
    const newNode: EditorNode = {
      id: `topic-${Date.now()}`,
      topicId: `topic-${Date.now()}`,
      position,
      title,
      status: 'not_started',
    };

    setState(prev => {
      // Also add to the actual roadmap data
      const updatedCategories = prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => {
          if (r.id !== prev.selectedRoadmapId) return r;
          const newTopic: Topic = {
            id: newNode.id,
            roadmapId: r.id,
            title,
            position,
            status: 'not_started',
            questions: [],
            resources: [],
            childTopicIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { ...r, topics: [...r.topics, newTopic], updatedAt: new Date() };
        }),
      }));

      // Save position immediately
      const newSavedPositions = {
        ...prev.savedPositions,
        [newNode.id]: position,
      };

      return {
        ...prev,
        categories: updatedCategories,
        nodes: [...prev.nodes, newNode],
        savedPositions: newSavedPositions,
      };
    });

    return newNode;
  }, []);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, position } : n
      ),
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t =>
            t.id === nodeId ? { ...t, position, updatedAt: new Date() } : t
          ),
        })),
      })),
      // Save position to persist across refreshes
      savedPositions: {
        ...prev.savedPositions,
        [nodeId]: position,
      },
    }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<Pick<EditorNode, 'title' | 'status'>>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t =>
            t.id === nodeId ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        })),
      })),
    }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setState(prev => {
      // Remove position from saved positions
      const { [nodeId]: _, ...remainingPositions } = prev.savedPositions;
      
      return {
        ...prev,
        nodes: prev.nodes.filter(n => n.id !== nodeId),
        connections: prev.connections.filter(c => c.from !== nodeId && c.to !== nodeId),
        selectedTopicId: prev.selectedTopicId === nodeId ? null : prev.selectedTopicId,
        categories: prev.categories.map(c => ({
          ...c,
          roadmaps: c.roadmaps.map(r => ({
            ...r,
            topics: r.topics.filter(t => t.id !== nodeId),
            connections: r.connections.filter(conn => conn.fromTopicId !== nodeId && conn.toTopicId !== nodeId),
          })),
        })),
        savedPositions: remainingPositions,
      };
    });
  }, []);

  const addConnection = useCallback((fromId: string, toId: string, type: TopicConnection['type'] = 'suggested_order') => {
    const newConnection: EditorConnection = {
      id: `conn-${Date.now()}`,
      from: fromId,
      to: toId,
      type,
    };

    setState(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      connectingFrom: null,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => {
          if (r.id !== prev.selectedRoadmapId) return r;
          const topicConn: TopicConnection = {
            id: newConnection.id,
            fromTopicId: fromId,
            toTopicId: toId,
            type,
          };
          return { ...r, connections: [...r.connections, topicConn] };
        }),
      })),
    }));

    return newConnection;
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== connectionId),
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          connections: r.connections.filter(conn => conn.id !== connectionId),
        })),
      })),
    }));
  }, []);

  const setConnectingFrom = useCallback((nodeId: string | null) => {
    setState(prev => ({ ...prev, connectingFrom: nodeId }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.25, Math.min(2, zoom)) }));
  }, []);

  const setPan = useCallback((pan: { x: number; y: number }) => {
    setState(prev => ({ ...prev, pan }));
  }, []);

  const getSelectedCategory = useCallback(() => {
    return state.categories.find(c => c.id === state.selectedCategoryId);
  }, [state.categories, state.selectedCategoryId]);

  const getSelectedRoadmap = useCallback(() => {
    for (const cat of state.categories) {
      const roadmap = cat.roadmaps.find(r => r.id === state.selectedRoadmapId);
      if (roadmap) return roadmap;
    }
    return undefined;
  }, [state.categories, state.selectedRoadmapId]);

  const getSelectedTopic = useCallback(() => {
    const roadmap = getSelectedRoadmap();
    return roadmap?.topics.find(t => t.id === state.selectedTopicId);
  }, [getSelectedRoadmap, state.selectedTopicId]);

  const addQuestion = useCallback((topicId: string, question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>) => {
    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}`,
      topicId,
      createdAt: new Date(),
      updatedAt: new Date(),
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
    };

    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t =>
            t.id === topicId
              ? { ...t, questions: [...t.questions, newQuestion], updatedAt: new Date() }
              : t
          ),
          totalQuestions: r.topics.reduce((acc, t) => 
            acc + (t.id === topicId ? t.questions.length + 1 : t.questions.length), 0
          ),
        })),
      })),
    }));

    return newQuestion;
  }, []);

  const updateQuestion = useCallback((questionId: string, updates: Partial<Question>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t => ({
            ...t,
            questions: t.questions.map(q =>
              q.id === questionId ? { ...q, ...updates, updatedAt: new Date() } : q
            ),
          })),
        })),
      })),
    }));
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t => ({
            ...t,
            questions: t.questions.filter(q => q.id !== questionId),
          })),
        })),
      })),
    }));
  }, []);

  const addResource = useCallback((topicId: string, resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => {
    const newResource: Resource = {
      ...resource,
      id: `res-${Date.now()}`,
      topicId,
      isCompleted: false,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t =>
            t.id === topicId
              ? { ...t, resources: [...t.resources, newResource], updatedAt: new Date() }
              : t
          ),
        })),
      })),
    }));

    return newResource;
  }, []);

  const updateResource = useCallback((resourceId: string, updates: Partial<Resource>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t => ({
            ...t,
            resources: t.resources.map(res =>
              res.id === resourceId ? { ...res, ...updates } : res
            ),
          })),
        })),
      })),
    }));
  }, []);

  const deleteResource = useCallback((resourceId: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t => ({
            ...t,
            resources: t.resources.filter(res => res.id !== resourceId),
          })),
        })),
      })),
    }));
  }, []);

  return {
    state,
    selectCategory,
    selectRoadmap,
    selectTopic,
    addCategory,
    updateCategory,
    deleteCategory,
    addRoadmap,
    updateRoadmap,
    deleteRoadmap,
    addNode,
    updateNodePosition,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    setConnectingFrom,
    setZoom,
    setPan,
    getSelectedCategory,
    getSelectedRoadmap,
    getSelectedTopic,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addResource,
    updateResource,
    deleteResource,
  };
};
