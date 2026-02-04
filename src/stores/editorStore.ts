import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { Category, Roadmap, Topic, Question, Resource, TopicConnection } from '@/types/learning';
import { mockCategories as initialCategories } from '@/data/mockData';

// Storage keys
const STORAGE_KEY_DATA = 'learnlantern-data';
const STORAGE_KEY_POSITIONS = 'learnlantern-positions';

// Helper to load saved data from localStorage
const loadSavedData = (): Category[] | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert date strings back to Date objects
      return parsed.map((cat: any) => ({
        ...cat,
        createdAt: new Date(cat.createdAt),
        roadmaps: cat.roadmaps.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
          topics: r.topics.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            questions: t.questions.map((q: any) => ({
              ...q,
              createdAt: new Date(q.createdAt),
              updatedAt: new Date(q.updatedAt),
              nextReviewDate: q.nextReviewDate ? new Date(q.nextReviewDate) : undefined,
              lastReviewDate: q.lastReviewDate ? new Date(q.lastReviewDate) : undefined,
            })),
            resources: t.resources.map((res: any) => ({
              ...res,
              createdAt: new Date(res.createdAt),
            })),
          })),
        })),
      }));
    }
    return null;
  } catch {
    return null;
  }
};

// Helper to save data to localStorage
const saveData = (categories: Category[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(categories));
  } catch {
    // Ignore storage errors
  }
};

// Helper to load saved positions from localStorage
const loadSavedPositions = (): Record<string, { x: number; y: number }> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_POSITIONS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Helper to save positions to localStorage
const savePositions = (positions: Record<string, { x: number; y: number }>) => {
  try {
    localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions));
  } catch {
    // Ignore storage errors
  }
};

// Editor state management
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

// Global state singleton
let globalState: EditorState = {
  categories: loadSavedData() || initialCategories,
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
};

// Subscribers for state changes
let listeners: (() => void)[] = [];

const emitChange = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const getSnapshot = () => globalState;

const setState = (updater: (prev: EditorState) => EditorState) => {
  globalState = updater(globalState);
  emitChange();
};

// Actions
const selectCategory = (categoryId: string | null) => {
  setState(prev => ({
    ...prev,
    selectedCategoryId: categoryId,
    selectedRoadmapId: null,
    selectedTopicId: null,
    nodes: [],
    connections: [],
  }));
};

const selectRoadmap = (roadmapId: string | null) => {
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
};

const selectTopic = (topicId: string | null) => {
  setState(prev => ({ ...prev, selectedTopicId: topicId }));
};

const addCategory = (name: string, icon: string) => {
  const newCategory: Category = {
    id: `cat-${Date.now()}`,
    name,
    icon,
    roadmaps: [],
    progress: 0,
    createdAt: new Date(),
  };
  setState(prev => {
    const newCategories = [...prev.categories, newCategory];
    saveData(newCategories);
    return { ...prev, categories: newCategories };
  });
  return newCategory;
};

const updateCategory = (categoryId: string, updates: Partial<Pick<Category, 'name' | 'icon' | 'description'>>) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => 
      c.id === categoryId ? { ...c, ...updates } : c
    );
    saveData(newCategories);
    return { ...prev, categories: newCategories };
  });
};

const deleteCategory = (categoryId: string) => {
  setState(prev => {
    const newCategories = prev.categories.filter(c => c.id !== categoryId);
    saveData(newCategories);
    return {
      ...prev,
      categories: newCategories,
      selectedCategoryId: prev.selectedCategoryId === categoryId ? null : prev.selectedCategoryId,
    };
  });
};

const addRoadmap = (categoryId: string, title: string, description?: string) => {
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
  setState(prev => {
    const newCategories = prev.categories.map(c =>
      c.id === categoryId
        ? { ...c, roadmaps: [...c.roadmaps, newRoadmap] }
        : c
    );
    saveData(newCategories);
    return { ...prev, categories: newCategories };
  });
  return newRoadmap;
};

const updateRoadmap = (roadmapId: string, updates: Partial<Pick<Roadmap, 'title' | 'description'>>) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r =>
        r.id === roadmapId ? { ...r, ...updates, updatedAt: new Date() } : r
      ),
    }));
    saveData(newCategories);
    return { ...prev, categories: newCategories };
  });
};

const deleteRoadmap = (roadmapId: string) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.filter(r => r.id !== roadmapId),
    }));
    saveData(newCategories);
    return {
      ...prev,
      categories: newCategories,
      selectedRoadmapId: prev.selectedRoadmapId === roadmapId ? null : prev.selectedRoadmapId,
    };
  });
};

const addNode = (title: string, position: { x: number; y: number }) => {
  const newNode: EditorNode = {
    id: `topic-${Date.now()}`,
    topicId: `topic-${Date.now()}`,
    position,
    title,
    status: 'not_started',
  };

  setState(prev => {
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
    savePositions(newSavedPositions);
    saveData(updatedCategories);

    return {
      ...prev,
      categories: updatedCategories,
      nodes: [...prev.nodes, newNode],
      savedPositions: newSavedPositions,
    };
  });

  return newNode;
};

const updateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t =>
          t.id === nodeId ? { ...t, position, updatedAt: new Date() } : t
        ),
      })),
    }));
    
    const newSavedPositions = {
      ...prev.savedPositions,
      [nodeId]: position,
    };
    savePositions(newSavedPositions);
    saveData(newCategories);

    return {
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, position } : n
      ),
      categories: newCategories,
      savedPositions: newSavedPositions,
    };
  });
};

const updateNode = (nodeId: string, updates: Partial<Pick<EditorNode, 'title' | 'status'>>) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t =>
          t.id === nodeId ? { ...t, ...updates, updatedAt: new Date() } : t
        ),
      })),
    }));
    saveData(newCategories);

    return {
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
      categories: newCategories,
    };
  });
};

const deleteNode = (nodeId: string) => {
  setState(prev => {
    const { [nodeId]: _, ...remainingPositions } = prev.savedPositions;
    
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.filter(t => t.id !== nodeId),
        connections: r.connections.filter(conn => conn.fromTopicId !== nodeId && conn.toTopicId !== nodeId),
      })),
    }));
    savePositions(remainingPositions);
    saveData(newCategories);
    
    return {
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      connections: prev.connections.filter(c => c.from !== nodeId && c.to !== nodeId),
      selectedTopicId: prev.selectedTopicId === nodeId ? null : prev.selectedTopicId,
      categories: newCategories,
      savedPositions: remainingPositions,
    };
  });
};

const addConnection = (fromId: string, toId: string, type: TopicConnection['type'] = 'suggested_order') => {
  const newConnection: EditorConnection = {
    id: `conn-${Date.now()}`,
    from: fromId,
    to: toId,
    type,
  };

  setState(prev => {
    const newCategories = prev.categories.map(c => ({
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
    }));
    saveData(newCategories);

    return {
      ...prev,
      connections: [...prev.connections, newConnection],
      connectingFrom: null,
      categories: newCategories,
    };
  });

  return newConnection;
};

const deleteConnection = (connectionId: string) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        connections: r.connections.filter(conn => conn.id !== connectionId),
      })),
    }));
    saveData(newCategories);

    return {
      ...prev,
      connections: prev.connections.filter(c => c.id !== connectionId),
      categories: newCategories,
    };
  });
};

const setConnectingFrom = (nodeId: string | null) => {
  setState(prev => ({ ...prev, connectingFrom: nodeId }));
};

const setZoom = (zoom: number) => {
  setState(prev => ({ ...prev, zoom: Math.max(0.25, Math.min(2, zoom)) }));
};

const setPan = (pan: { x: number; y: number }) => {
  setState(prev => ({ ...prev, pan }));
};

const addQuestion = (topicId: string, question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>) => {
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

  setState(prev => {
    const newCategories = prev.categories.map(c => ({
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
    }));
    saveData(newCategories);

    return { ...prev, categories: newCategories };
  });

  return newQuestion;
};

const updateQuestion = (questionId: string, updates: Partial<Question>) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
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
    }));
    saveData(newCategories);

    return { ...prev, categories: newCategories };
  });
};

const deleteQuestion = (questionId: string) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t => ({
          ...t,
          questions: t.questions.filter(q => q.id !== questionId),
        })),
      })),
    }));
    saveData(newCategories);

    return { ...prev, categories: newCategories };
  });
};

const addResource = (topicId: string, resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => {
  const newResource: Resource = {
    ...resource,
    id: `res-${Date.now()}`,
    topicId,
    isCompleted: false,
    createdAt: new Date(),
  };

  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t =>
          t.id === topicId
            ? { ...t, resources: [...t.resources, newResource], updatedAt: new Date() }
            : t
        ),
      })),
    }));
    saveData(newCategories);

    return { ...prev, categories: newCategories };
  });

  return newResource;
};

const updateResource = (resourceId: string, updates: Partial<Resource>) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
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
    }));
    saveData(newCategories);

    return { ...prev, categories: newCategories };
  });
};

const deleteResource = (resourceId: string) => {
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t => ({
          ...t,
          resources: t.resources.filter(res => res.id !== resourceId),
        })),
      })),
    }));
    saveData(newCategories);

    return { ...prev, categories: newCategories };
  });
};

// Save all current data (called by Save button)
const saveAllData = () => {
  saveData(globalState.categories);
  savePositions(globalState.savedPositions);
};

// Get categories for Learn view
const getCategories = () => globalState.categories;

// Hook to use the store with automatic re-renders
export const useEditorStore = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot);

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
    saveAllData,
  };
};

// Export getCategories for use in Learn pages
export { getCategories };
