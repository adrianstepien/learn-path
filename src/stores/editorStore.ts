import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { Category, Roadmap, Topic, Question, Resource, TopicConnection } from '@/types/learning';
import { mockCategories as initialCategories } from '@/data/mockData';
import * as api from '@/lib/api';
import { isApiAvailable } from '@/lib/api/config';
import { 
  CategoryDto, 
  RoadmapDto, 
  TopicDto, 
  CreateTopicDto, 
  UpdateTopicDto,
  NoteDto,
  ArticleDto,
  VideoDto,
  CardDto 
} from '@/lib/api/types';

// Storage keys for local cache/positions
const STORAGE_KEY_POSITIONS = 'learnlantern-positions';

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

// ===== DTO to Domain Mappers =====

const mapCategoryDtoToCategory = (dto: CategoryDto, roadmaps: Roadmap[] = []): Category => ({
  id: String(dto.id),
  name: dto.title,
  description: dto.description,
  icon: dto.iconData || '📁',
  roadmaps,
  progress: 0,
  createdAt: new Date(),
});

const mapRoadmapDtoToRoadmap = (dto: RoadmapDto, topics: Topic[] = []): Roadmap => ({
  id: String(dto.id),
  categoryId: String(dto.categoryId),
  title: dto.title,
  description: dto.description,
  topics,
  connections: [],
  progress: 0,
  totalQuestions: topics.reduce((acc, t) => acc + t.questions.length, 0),
  masteredQuestions: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mapTopicDtoToTopic = (dto: TopicDto, roadmapId: string): Topic => ({
  id: String(dto.id),
  roadmapId,
  title: dto.title,
  description: dto.description,
  position: { x: dto.canvasPositionX, y: dto.canvasPositionY },
  status: 'not_started',
  questions: [],
  resources: [],
  childTopicIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mapCardDtoToQuestion = (dto: CardDto, topicId: string): Question => ({
  id: String(dto.id),
  topicId,
  type: 'open_ended',
  content: dto.question,
  answer: dto.answer,
  difficulty: dto.difficulty === 1 ? 'beginner' : dto.difficulty === 2 ? 'intermediate' : dto.difficulty === 3 ? 'advanced' : 'expert',
  importance: dto.importance === 1 ? 'low' : dto.importance === 2 ? 'medium' : dto.importance === 3 ? 'high' : 'critical',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
});

const mapNoteToResource = (dto: NoteDto): Resource => ({
  id: String(dto.id),
  topicId: String(dto.topicId),
  type: 'description',
  title: 'Notatka',
  content: dto.description,
  isCompleted: false,
  createdAt: new Date(),
});

const mapArticleToResource = (dto: ArticleDto): Resource => ({
  id: String(dto.id),
  topicId: String(dto.topicId),
  type: 'article',
  title: dto.description,
  url: dto.url,
  isCompleted: false,
  createdAt: new Date(),
});

const mapVideoToResource = (dto: VideoDto): Resource => ({
  id: String(dto.id),
  topicId: String(dto.topicId),
  type: 'video',
  title: dto.description,
  url: dto.url,
  isCompleted: false,
  createdAt: new Date(),
});

// ===== Domain to DTO Mappers =====

const mapCategoryToDto = (cat: Category): CategoryDto => ({
  id: cat.id ? parseInt(cat.id.replace(/\D/g, '')) || undefined : undefined,
  title: cat.name,
  description: cat.description,
  iconData: cat.icon,
});

const mapRoadmapToDto = (roadmap: Roadmap): RoadmapDto => ({
  id: roadmap.id ? parseInt(roadmap.id.replace(/\D/g, '')) || undefined : undefined,
  title: roadmap.title,
  description: roadmap.description,
  categoryId: parseInt(roadmap.categoryId.replace(/\D/g, '')),
});

const mapTopicToCreateDto = (topic: { title: string; position: { x: number; y: number }; roadmapId: string }): CreateTopicDto => ({
  title: topic.title,
  canvasPositionX: topic.position.x,
  canvasPositionY: topic.position.y,
  roadmapId: parseInt(topic.roadmapId.replace(/\D/g, '')),
});

const mapTopicToUpdateDto = (topic: Topic): UpdateTopicDto => ({
  id: parseInt(topic.id.replace(/\D/g, '')),
  title: topic.title,
  description: topic.description,
  canvasPositionX: topic.position.x,
  canvasPositionY: topic.position.y,
  roadmapId: parseInt(topic.roadmapId.replace(/\D/g, '')),
});

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
  isLoading: boolean;
  error: string | null;
}

// Global state singleton
let globalState: EditorState = {
  categories: initialCategories, // Fallback until API loads
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
  isLoading: false,
  error: null,
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

// ===== API-based Actions =====

// Load all categories from API
const loadCategories = async () => {
  setState(prev => ({ ...prev, isLoading: true, error: null }));
  
  try {
    const available = await isApiAvailable();
    
    if (!available) {
      // Fallback to mock data
      console.log('API unavailable, using mock data for editor');
      setState(prev => ({ 
        ...prev, 
        categories: initialCategories,
        isLoading: false 
      }));
      return;
    }

    const categoryDtos = await api.getCategories();
    
    // For each category, load its roadmaps
    const categoriesWithRoadmaps = await Promise.all(
      categoryDtos.map(async (catDto) => {
        if (!catDto.id) return mapCategoryDtoToCategory(catDto, []);
        
        try {
          const roadmapDtos = await api.getRoadmaps(catDto.id);
          
          // For each roadmap, load its topics
          const roadmapsWithTopics = await Promise.all(
            roadmapDtos.map(async (roadmapDto) => {
              if (!roadmapDto.id) return mapRoadmapDtoToRoadmap(roadmapDto, []);
              
              try {
                const topicDtos = await api.getTopics(roadmapDto.id);
                const topics = topicDtos.map(t => 
                  mapTopicDtoToTopic(t, String(roadmapDto.id))
                );
                return mapRoadmapDtoToRoadmap(roadmapDto, topics);
              } catch {
                return mapRoadmapDtoToRoadmap(roadmapDto, []);
              }
            })
          );
          
          return mapCategoryDtoToCategory(catDto, roadmapsWithTopics);
        } catch {
          return mapCategoryDtoToCategory(catDto, []);
        }
      })
    );
    
    setState(prev => ({ 
      ...prev, 
      categories: categoriesWithRoadmaps.length > 0 ? categoriesWithRoadmaps : prev.categories,
      isLoading: false 
    }));
  } catch (err) {
    console.error('Failed to load categories:', err);
    // Fallback to mock data on error
    setState(prev => ({ 
      ...prev, 
      categories: initialCategories,
      isLoading: false, 
      error: err instanceof Error ? err.message : 'Failed to load data' 
    }));
  }
};

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

const selectRoadmap = async (roadmapId: string | null) => {
  if (!roadmapId) {
    setState(prev => ({ ...prev, selectedRoadmapId: null, nodes: [], connections: [] }));
    return;
  }

  setState(prev => ({ ...prev, isLoading: true }));

  // Helper to load from local state
  const loadFromLocalState = () => {
    setState(prev => {
      let foundRoadmap: Roadmap | undefined;
      for (const cat of prev.categories) {
        foundRoadmap = cat.roadmaps.find(r => r.id === roadmapId);
        if (foundRoadmap) break;
      }

      if (!foundRoadmap) return { ...prev, isLoading: false };

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
        isLoading: false,
      };
    });
  };

  try {
    const available = await isApiAvailable();
    
    if (!available) {
      // Fallback to local state
      loadFromLocalState();
      return;
    }

    // Get roadmap ID as number
    const numericRoadmapId = parseInt(roadmapId.replace(/\D/g, ''));
    
    // Load topics from API
    const topicDtos = await api.getTopics(numericRoadmapId);
    
    // Use saved positions if available, otherwise use API positions
    const nodes: EditorNode[] = topicDtos.map(t => ({
      id: String(t.id),
      topicId: String(t.id),
      position: globalState.savedPositions[String(t.id)] || { x: t.canvasPositionX, y: t.canvasPositionY },
      title: t.title,
      status: 'not_started' as const,
    }));

    // Also update local state categories with the fresh topics
    const topics = topicDtos.map(t => mapTopicDtoToTopic(t, roadmapId));

    setState(prev => {
      const newCategories = prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => 
          r.id === roadmapId ? { ...r, topics } : r
        ),
      }));

      return {
        ...prev,
        selectedRoadmapId: roadmapId,
        selectedTopicId: null,
        nodes,
        connections: [], // TODO: implement connections API if needed
        categories: newCategories,
        isLoading: false,
      };
    });
  } catch (err) {
    console.error('Failed to load roadmap topics:', err);
    loadFromLocalState();
  }
};

const selectTopic = (topicId: string | null) => {
  setState(prev => ({ ...prev, selectedTopicId: topicId }));
};

const addCategory = async (name: string, icon: string) => {
  const categoryDto: CategoryDto = {
    title: name,
    iconData: icon,
  };

  try {
    await api.createCategory(categoryDto);
    // Reload categories to get the new ID
    await loadCategories();
  } catch (err) {
    console.error('Failed to create category:', err);
    // Fallback to local state
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      icon,
      roadmaps: [],
      progress: 0,
      createdAt: new Date(),
    };
    setState(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
    return newCategory;
  }
};

const updateCategory = async (categoryId: string, updates: Partial<Pick<Category, 'name' | 'icon' | 'description'>>) => {
  const numericId = parseInt(categoryId.replace(/\D/g, ''));
  
  setState(prev => {
    const category = prev.categories.find(c => c.id === categoryId);
    if (!category) return prev;

    const categoryDto: CategoryDto = {
      id: numericId,
      title: updates.name || category.name,
      description: updates.description || category.description,
      iconData: updates.icon || category.icon,
    };

    // Fire and forget API call
    api.updateCategory(numericId, categoryDto).catch(console.error);

    const newCategories = prev.categories.map(c => 
      c.id === categoryId ? { ...c, ...updates } : c
    );
    return { ...prev, categories: newCategories };
  });
};

const deleteCategory = async (categoryId: string) => {
  const numericId = parseInt(categoryId.replace(/\D/g, ''));
  
  try {
    await api.deleteCategory(numericId);
  } catch (err) {
    console.error('Failed to delete category:', err);
  }

  setState(prev => ({
    ...prev,
    categories: prev.categories.filter(c => c.id !== categoryId),
    selectedCategoryId: prev.selectedCategoryId === categoryId ? null : prev.selectedCategoryId,
  }));
};

const addRoadmap = async (categoryId: string, title: string, description?: string) => {
  const numericCategoryId = parseInt(categoryId.replace(/\D/g, ''));
  
  const roadmapDto: RoadmapDto = {
    title,
    description,
    categoryId: numericCategoryId,
  };

  try {
    await api.createRoadmap(roadmapDto);
    // Reload to get new ID
    await loadCategories();
  } catch (err) {
    console.error('Failed to create roadmap:', err);
    // Fallback to local state
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
  }
};

const updateRoadmap = async (roadmapId: string, updates: Partial<Pick<Roadmap, 'title' | 'description'>>) => {
  const numericId = parseInt(roadmapId.replace(/\D/g, ''));

  setState(prev => {
    let roadmap: Roadmap | undefined;
    for (const cat of prev.categories) {
      roadmap = cat.roadmaps.find(r => r.id === roadmapId);
      if (roadmap) break;
    }
    if (!roadmap) return prev;

    const roadmapDto: RoadmapDto = {
      id: numericId,
      title: updates.title || roadmap.title,
      description: updates.description || roadmap.description,
      categoryId: parseInt(roadmap.categoryId.replace(/\D/g, '')),
    };

    // Fire and forget
    api.updateRoadmap(numericId, roadmapDto).catch(console.error);

    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r =>
        r.id === roadmapId ? { ...r, ...updates, updatedAt: new Date() } : r
      ),
    }));
    return { ...prev, categories: newCategories };
  });
};

const deleteRoadmap = async (roadmapId: string) => {
  const numericId = parseInt(roadmapId.replace(/\D/g, ''));

  try {
    await api.deleteRoadmap(numericId);
  } catch (err) {
    console.error('Failed to delete roadmap:', err);
  }

  setState(prev => ({
    ...prev,
    categories: prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.filter(r => r.id !== roadmapId),
    })),
    selectedRoadmapId: prev.selectedRoadmapId === roadmapId ? null : prev.selectedRoadmapId,
  }));
};

const addNode = async (title: string, position: { x: number; y: number }) => {
  const { selectedRoadmapId } = globalState;
  if (!selectedRoadmapId) return;

  const numericRoadmapId = parseInt(selectedRoadmapId.replace(/\D/g, ''));

  const createDto: CreateTopicDto = {
    title,
    canvasPositionX: position.x,
    canvasPositionY: position.y,
    roadmapId: numericRoadmapId,
  };

  try {
    await api.createTopic(createDto);
    // Reload roadmap to get new topic with ID
    await selectRoadmap(selectedRoadmapId);
  } catch (err) {
    console.error('Failed to create topic:', err);
    // Fallback to local state
    const newNode: EditorNode = {
      id: `topic-${Date.now()}`,
      topicId: `topic-${Date.now()}`,
      position,
      title,
      status: 'not_started',
    };

    setState(prev => {
      const newTopic: Topic = {
        id: newNode.id,
        roadmapId: selectedRoadmapId,
        title,
        position,
        status: 'not_started',
        questions: [],
        resources: [],
        childTopicIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newCategories = prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r =>
          r.id === selectedRoadmapId
            ? { ...r, topics: [...r.topics, newTopic], updatedAt: new Date() }
            : r
        ),
      }));

      const newSavedPositions = { ...prev.savedPositions, [newNode.id]: position };
      savePositions(newSavedPositions);

      return {
        ...prev,
        categories: newCategories,
        nodes: [...prev.nodes, newNode],
        savedPositions: newSavedPositions,
      };
    });

    return newNode;
  }
};

const updateNodePosition = async (nodeId: string, position: { x: number; y: number }) => {
  const numericId = parseInt(nodeId.replace(/\D/g, ''));

  // Update local state immediately for responsiveness
  setState(prev => {
    const newSavedPositions = { ...prev.savedPositions, [nodeId]: position };
    savePositions(newSavedPositions);

    return {
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, position } : n),
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t =>
            t.id === nodeId ? { ...t, position, updatedAt: new Date() } : t
          ),
        })),
      })),
      savedPositions: newSavedPositions,
    };
  });

  // Fire and forget API call
  const node = globalState.nodes.find(n => n.id === nodeId);
  if (node) {
    const updateDto: UpdateTopicDto = {
      id: numericId,
      canvasPositionX: position.x,
      canvasPositionY: position.y,
    };
    api.updateTopic(numericId, updateDto).catch(console.error);
  }
};

const updateNode = async (nodeId: string, updates: Partial<Pick<EditorNode, 'title' | 'status'>>) => {
  const numericId = parseInt(nodeId.replace(/\D/g, ''));

  setState(prev => {
    const node = prev.nodes.find(n => n.id === nodeId);
    if (!node) return prev;

    // Fire and forget API call
    if (updates.title) {
      const updateDto: UpdateTopicDto = {
        id: numericId,
        title: updates.title,
      };
      api.updateTopic(numericId, updateDto).catch(console.error);
    }

    return {
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n),
      categories: prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t =>
            t.id === nodeId ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        })),
      })),
    };
  });
};

const deleteNode = async (nodeId: string) => {
  const numericId = parseInt(nodeId.replace(/\D/g, ''));

  try {
    await api.deleteTopic(numericId);
  } catch (err) {
    console.error('Failed to delete topic:', err);
  }

  setState(prev => {
    const { [nodeId]: _, ...remainingPositions } = prev.savedPositions;
    savePositions(remainingPositions);

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
};

// Connections are handled locally for now (no API endpoint)
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

// ===== Cards (Questions) =====

const addQuestion = async (topicId: string, question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>) => {
  const numericTopicId = parseInt(topicId.replace(/\D/g, ''));

  const cardDto: CardDto = {
    question: question.content,
    answer: question.answer,
    difficulty: question.difficulty === 'beginner' ? 1 : question.difficulty === 'intermediate' ? 2 : question.difficulty === 'advanced' ? 3 : 4,
    importance: question.importance === 'low' ? 1 : question.importance === 'medium' ? 2 : question.importance === 'high' ? 3 : 4,
    topicId: numericTopicId,
  };

  try {
    await api.createCard(cardDto);
    // Could reload topic details here if needed
  } catch (err) {
    console.error('Failed to create card:', err);
  }

  // Also update local state
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
      })),
    })),
  }));

  return newQuestion;
};

const updateQuestion = async (questionId: string, updates: Partial<Question>) => {
  const numericId = parseInt(questionId.replace(/\D/g, ''));

  setState(prev => {
    // Find the question to get current values
    let foundQuestion: Question | undefined;
    let foundTopicId: string | undefined;
    for (const cat of prev.categories) {
      for (const roadmap of cat.roadmaps) {
        for (const topic of roadmap.topics) {
          const q = topic.questions.find(q => q.id === questionId);
          if (q) {
            foundQuestion = q;
            foundTopicId = topic.id;
            break;
          }
        }
      }
    }

    if (foundQuestion && foundTopicId) {
      const cardDto: CardDto = {
        id: numericId,
        question: updates.content || foundQuestion.content,
        answer: updates.answer || foundQuestion.answer,
        difficulty: (updates.difficulty || foundQuestion.difficulty) === 'beginner' ? 1 : 
                   (updates.difficulty || foundQuestion.difficulty) === 'intermediate' ? 2 : 
                   (updates.difficulty || foundQuestion.difficulty) === 'advanced' ? 3 : 4,
        importance: (updates.importance || foundQuestion.importance) === 'low' ? 1 :
                   (updates.importance || foundQuestion.importance) === 'medium' ? 2 :
                   (updates.importance || foundQuestion.importance) === 'high' ? 3 : 4,
        topicId: parseInt(foundTopicId.replace(/\D/g, '')),
      };
      api.updateCard(numericId, cardDto).catch(console.error);
    }

    return {
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
    };
  });
};

const deleteQuestion = async (questionId: string) => {
  const numericId = parseInt(questionId.replace(/\D/g, ''));

  try {
    await api.deleteCard(numericId);
  } catch (err) {
    console.error('Failed to delete card:', err);
  }

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
};

// ===== Resources (Notes, Articles, Videos) =====

const addResource = async (topicId: string, resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => {
  const numericTopicId = parseInt(topicId.replace(/\D/g, ''));

  try {
    if (resource.type === 'description') {
      const noteDto: NoteDto = {
        description: resource.content || '',
        topicId: numericTopicId,
      };
      await api.createNote(noteDto);
    } else if (resource.type === 'article') {
      const articleDto: ArticleDto = {
        description: resource.title,
        url: resource.url || '',
        topicId: numericTopicId,
      };
      await api.createArticle(articleDto);
    } else if (resource.type === 'video') {
      const videoDto: VideoDto = {
        description: resource.title,
        url: resource.url || '',
        topicId: numericTopicId,
      };
      await api.createVideo(videoDto);
    }
  } catch (err) {
    console.error('Failed to create resource:', err);
  }

  // Update local state
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
};

const updateResource = async (resourceId: string, updates: Partial<Resource>) => {
  const numericId = parseInt(resourceId.replace(/\D/g, ''));

  setState(prev => {
    // Find resource to determine type
    let foundResource: Resource | undefined;
    for (const cat of prev.categories) {
      for (const roadmap of cat.roadmaps) {
        for (const topic of roadmap.topics) {
          const res = topic.resources.find(r => r.id === resourceId);
          if (res) {
            foundResource = res;
            break;
          }
        }
      }
    }

    if (foundResource) {
      const type = updates.type || foundResource.type;
      const topicId = parseInt((updates.topicId || foundResource.topicId).replace(/\D/g, ''));

      if (type === 'description') {
        const noteDto: NoteDto = { 
          description: updates.content || foundResource.content || '', 
          topicId 
        };
        api.updateNote(numericId, noteDto).catch(console.error);
      } else if (type === 'article') {
        const articleDto: ArticleDto = { 
          description: updates.title || foundResource.title, 
          url: updates.url || foundResource.url || '',
          topicId 
        };
        api.updateArticle(numericId, articleDto).catch(console.error);
      } else if (type === 'video') {
        const videoDto: VideoDto = { 
          description: updates.title || foundResource.title, 
          url: updates.url || foundResource.url || '',
          topicId 
        };
        api.updateVideo(numericId, videoDto).catch(console.error);
      }
    }

    return {
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
    };
  });
};

const deleteResource = async (resourceId: string) => {
  const numericId = parseInt(resourceId.replace(/\D/g, ''));

  // Find resource type before deleting
  let resourceType: Resource['type'] | undefined;
  for (const cat of globalState.categories) {
    for (const roadmap of cat.roadmaps) {
      for (const topic of roadmap.topics) {
        const res = topic.resources.find(r => r.id === resourceId);
        if (res) {
          resourceType = res.type;
          break;
        }
      }
    }
  }

  try {
    if (resourceType === 'description') {
      await api.deleteNote(numericId);
    } else if (resourceType === 'article') {
      await api.deleteArticle(numericId);
    } else if (resourceType === 'video') {
      await api.deleteVideo(numericId);
    }
  } catch (err) {
    console.error('Failed to delete resource:', err);
  }

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
};

// Save all - now triggers bulk update for positions
const saveAllData = async () => {
  // Build list of topics with updated positions
  const topicsToUpdate: UpdateTopicDto[] = [];
  
  for (const node of globalState.nodes) {
    const numericId = parseInt(node.id.replace(/\D/g, ''));
    if (!isNaN(numericId)) {
      topicsToUpdate.push({
        id: numericId,
        canvasPositionX: node.position.x,
        canvasPositionY: node.position.y,
      });
    }
  }

  if (topicsToUpdate.length > 0) {
    try {
      await api.bulkUpdateTopics(topicsToUpdate);
    } catch (err) {
      console.error('Failed to bulk update topics:', err);
    }
  }

  // Still save positions locally as backup
  savePositions(globalState.savedPositions);
};

// Get categories for Learn view
const getCategories = () => globalState.categories;

// Hook to use the store with automatic re-renders
export const useEditorStore = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
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

  return {
    state,
    loadCategories,
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
export { getCategories, loadCategories };
