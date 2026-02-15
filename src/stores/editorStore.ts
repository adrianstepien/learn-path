import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { Category, Roadmap, Topic, Question, Resource, TopicConnection } from '@/types/learning';
import { mockCategories as initialCategories } from '@/data/mockData';
import { computeConnectionsFromTopics } from '@/domain/canvas/connections';
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
  connections: [], // Kept for compatibility but not used as source of truth
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
  // Map relatedTopicIds from DTO if present (convert numeric to string)
  relatedTopicIds: Array.isArray((dto as any).relatedTopicIds)
    ? (dto as any).relatedTopicIds.map((id: number) => String(id))
    : [],
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
  type: 'note',
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
  // Convert string ids to numeric for API
  relatedTopicIds: Array.isArray((topic as any).relatedTopicIds)
    ? (topic as any).relatedTopicIds
        .map((id: string) => parseInt(String(id).replace(/\D/g, '')))
        .filter((id: number) => !isNaN(id))
    : undefined,
});

// Editor state management
export interface EditorNode {
  id: string;
  topicId: string;
  position: { x: number; y: number };
  title: string;
  status: Topic['status'];
}

export interface EditorState {
  categories: Category[];
  selectedCategoryId: string | null;
  selectedRoadmapId: string | null;
  selectedTopicId: string | null;
  nodes: EditorNode[];
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

// ===== Helper Functions =====

/**
 * Parse numeric ID from string ID, handling various formats
 */
const parseNumericId = (id: string | number | undefined | null): number => {
  if (!id) return 0;
  const stringId = String(id); // Konwersja na string przed użyciem replace
  const parsed = parseInt(stringId.replace(/\D/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get current roadmap from global state
 */
const getCurrentRoadmap = (): Roadmap | undefined => {
  for (const cat of globalState.categories) {
    const roadmap = cat.roadmaps.find(r => r.id === globalState.selectedRoadmapId);
    if (roadmap) return roadmap;
  }
  return undefined;
};

// ===== API-based Actions =====

// Load all categories from API
const loadCategories = async () => {
  setState(prev => ({ ...prev, isLoading: true, error: null }));

  try {
    const available = await isApiAvailable();

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
  }));
};

const selectRoadmap = async (roadmapId: string | null) => {
  if (!roadmapId) {
    setState(prev => ({ ...prev, selectedRoadmapId: null, nodes: [] }));
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

      // Connections are now computed, not stored
      return {
        ...prev,
        selectedRoadmapId: roadmapId,
        selectedTopicId: null,
        nodes,
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
    const numericRoadmapId = parseNumericId(roadmapId);

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

  if (topicId) {
      loadTopicDetails(topicId);
    }
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
  const numericId = parseNumericId(categoryId);

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
  const numericId = parseNumericId(categoryId);

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
  const numericCategoryId = parseNumericId(categoryId);

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
  const numericId = parseNumericId(roadmapId);

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
      categoryId: parseNumericId(roadmap.categoryId),
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
  const numericId = parseNumericId(roadmapId);

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

  const numericRoadmapId = parseNumericId(selectedRoadmapId);

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
        relatedTopicIds: [],
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
};

const updateNode = async (nodeId: string, updates: Partial<Pick<EditorNode, 'title' | 'status'>>) => {
  const numericId = parseNumericId(nodeId);

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
  const numericId = parseNumericId(nodeId);

  try {
    await api.deleteTopic(numericId);
  } catch (err) {
    console.error('Failed to delete topic:', err);
  }

  setState(prev => {
    const { [nodeId]: _, ...remainingPositions } = prev.savedPositions;
    savePositions(remainingPositions);

    // Remove this topic from all other topics' relatedTopicIds
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics
          .filter(t => t.id !== nodeId)
          .map(t => ({
            ...t,
            relatedTopicIds: (t as any).relatedTopicIds?.filter((id: string) => id !== nodeId) || [],
          })),
      })),
    }));

    // Fire API updates for topics that had relations to the deleted topic
    const affectedTopicIds: number[] = [];
    for (const cat of prev.categories) {
      for (const roadmap of cat.roadmaps) {
        for (const topic of roadmap.topics) {
          if ((topic as any).relatedTopicIds?.includes(nodeId)) {
            const numericTopicId = parseNumericId(topic.id);
            if (numericTopicId) {
              affectedTopicIds.push(numericTopicId);
            }
          }
        }
      }
    }

    // Update affected topics via API
    for (const affectedId of affectedTopicIds) {
      const affectedTopic = newCategories
        .flatMap(c => c.roadmaps)
        .flatMap(r => r.topics)
        .find(t => parseNumericId(t.id) === affectedId);

      if (affectedTopic) {
        const relatedNumericIds = ((affectedTopic as any).relatedTopicIds || [])
          .map((id: string) => parseNumericId(id))
          .filter((id: number) => id !== 0);

        const updateDto: UpdateTopicDto = {
          id: affectedId,
          relatedTopicIds: relatedNumericIds,
        };
        api.updateTopic(affectedId, updateDto).catch(console.error);
      }
    }

    return {
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      selectedTopicId: prev.selectedTopicId === nodeId ? null : prev.selectedTopicId,
      categories: newCategories,
      savedPositions: remainingPositions,
    };
  });
};

/**
 * Add a bidirectional connection between two topics.
 * Updates relatedTopicIds on both topics and syncs to API.
 */
const addConnection = (fromId: string, toId: string, type: TopicConnection['type'] = 'suggested_order') => {
  // Prevent self-links
  if (fromId === toId) {
    console.warn('Cannot create self-referential connection');
    return;
  }

  // Update local state: add relatedTopicIds bidirectionally
  setState(prev => {
    const newCategories = prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => {
        if (r.id !== prev.selectedRoadmapId) return r;

        // Update topics' relatedTopicIds
        const updatedTopics = r.topics.map(t => {
          if (t.id === fromId) {
            const existing = new Set((t as any).relatedTopicIds || []);
            if (!existing.has(toId)) {
              existing.add(toId);
              return { ...t, relatedTopicIds: Array.from(existing), updatedAt: new Date() };
            }
          }
          if (t.id === toId) {
            const existing = new Set((t as any).relatedTopicIds || []);
            if (!existing.has(fromId)) {
              existing.add(fromId);
              return { ...t, relatedTopicIds: Array.from(existing), updatedAt: new Date() };
            }
          }
          return t;
        });

        return { ...r, topics: updatedTopics };
      }),
    }));

    return {
      ...prev,
      connectingFrom: null,
      categories: newCategories,
    };
  });

  // Fire-and-forget API updates: update both topics' relatedTopicIds (send numeric arrays)
  try {
    const numericFromId = parseNumericId(fromId);
    const numericToId = parseNumericId(toId);

    if (!numericFromId || !numericToId) {
      console.error('Invalid topic IDs for connection');
      return;
    }

    // Find current topics from globalState to compute correct related ids
    const allTopics = globalState.categories.flatMap(c => c.roadmaps.flatMap(r => r.topics));
    const sourceTopic = allTopics.find(t => t.id === fromId);

    // Call API to update both topics (fire-and-forget)
    const updateFromDto = mapTopicToUpdateDto(sourceTopic);
    api.updateTopic(numericFromId, updateFromDto).catch(console.error);
  } catch (error) {
    console.error('Error while updating relatedTopicIds for topics:', error);
  }
};

/**
 * Delete a connection between two topics.
 * Removes relatedTopicIds bidirectionally and syncs to API.
 */
const deleteConnection = (connectionIdOrFrom: string, toId?: string) => {
  let fromId: string;
  let targetId: string;

  // Support both connection ID and from/to pair
  if (toId) {
    fromId = connectionIdOrFrom;
    targetId = toId;
  } else {
    // Try to parse connection ID (format: conn-fromId-toId)
    const match = connectionIdOrFrom.match(/^conn-(.+)-(.+)$/);
    if (!match) {
      console.error('Invalid connection ID format');
      return;
    }
    fromId = match[1];
    targetId = match[2];
  }

  setState(prev => ({
    ...prev,
    categories: prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t => {
          if (t.id === fromId) {
            const existing = new Set((t as any).relatedTopicIds || []);
            existing.delete(targetId);
            return { ...t, relatedTopicIds: Array.from(existing), updatedAt: new Date() };
          }
          if (t.id === targetId) {
            const existing = new Set((t as any).relatedTopicIds || []);
            existing.delete(fromId);
            return { ...t, relatedTopicIds: Array.from(existing), updatedAt: new Date() };
          }
          return t;
        }),
      })),
    })),
  }));

  // Fire-and-forget API updates: remove relation from both topics
  try {
    const numericFromId = parseNumericId(fromId);
    const numericToId = parseNumericId(targetId);

    if (!numericFromId || !numericToId) {
      console.error('Invalid topic IDs for connection deletion');
      return;
    }

    const allTopics = globalState.categories.flatMap(c => c.roadmaps.flatMap(r => r.topics));
    const sourceTopic = allTopics.find(t => t.id === fromId);

    const updateFromDto = mapTopicToUpdateDto(sourceTopic);
    api.updateTopic(numericFromId, updateFromDto).catch(console.error);
  } catch (error) {
    console.error('Error while removing relatedTopicIds for topics:', error);
  }
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
  const numericTopicId = parseNumericId(topicId);

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
  const numericId = parseNumericId(questionId);

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
        topicId: parseNumericId(foundTopicId),
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
  const numericId = parseNumericId(questionId);

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

const loadTopicDetails = async (topicId: string) => {
  const numericId = parseNumericId(topicId);
  if (!numericId) return;

  setState(prev => ({ ...prev, isLoading: true }));

  try {
    const details: TopicDetailsDto = await api.getTopicById(numericId);

    // Scalamy 3 listy z API w jedną listę Resource[] dla frontendu
    const resources: Resource[] = [
      ...(details.notes || []).map(mapNoteToResource),
      ...(details.articles || []).map(mapArticleToResource),
      ...(details.videos || []).map(mapVideoToResource)
    ];

    // Opcjonalnie: Mapujemy też karty (pytania), jeśli są w details
    const questions = (details.cards || []).map(c => mapCardDtoToQuestion(c, topicId));

    setState(prev => {
      // Musimy znaleźć temat głęboko w strukturze i go zaktualizować
      const newCategories = prev.categories.map(c => ({
        ...c,
        roadmaps: c.roadmaps.map(r => ({
          ...r,
          topics: r.topics.map(t =>
            t.id === topicId
              ? {
                  ...t,
                  resources, // Nadpisujemy listę zasobów nowymi danymi z API
                  questions: questions.length > 0 ? questions : t.questions, // Aktualizujemy pytania
                  updatedAt: new Date()
                }
              : t
          )
        }))
      }));

      return {
        ...prev,
        categories: newCategories,
        isLoading: false
      };
    });
  } catch (err) {
    console.error('Failed to load topic details:', err);
    setState(prev => ({ ...prev, isLoading: false }));
  }
};

// ===== Resources (Notes, Articles, Videos) =====

const addResource = async (topicId: string, resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => {
  const numericTopicId = parseNumericId(topicId);
  let createdEntity: any;
  let newResource: Resource;

  try {
    if (resource.type === 'note') {
      const noteDto: NoteDto = {
        title: resource.title,           // Note wymaga title
        description: resource.content || '', // Note wymaga description (treść)
        topicId: numericTopicId,
      };
      // API zwraca utworzony obiekt z ID
      const response = await api.createNote(noteDto);
      // Musimy zmapować odpowiedź API z powrotem na Resource
      createdEntity = response; // Zakładając, że api.createNote zwraca obiekt, a nie void (warto sprawdzić w api/resources.ts czy zwraca response.json())
      // Jeśli api.createNote zwraca void (według obecnego kodu), musisz to zmienić w api/resources.ts, aby zwracało utworzony obiekt!

      // FIX: Zakładamy, że poprawisz api/resources.ts żeby zwracało obiekt
      newResource = mapNoteToResource(createdEntity);

    } else if (resource.type === 'article') {
      const articleDto: ArticleDto = {
        description: resource.title,     // Article: description to tytuł
        url: resource.url || '',
        topicId: numericTopicId,
      };
      const response = await api.createArticle(articleDto);
      newResource = mapArticleToResource(response);

    } else if (resource.type === 'video') {
      const videoDto: VideoDto = {
        description: resource.title,     // Video: description to tytuł
        url: resource.url || '',
        topicId: numericTopicId,
      };
      const response = await api.createVideo(videoDto);
      newResource = mapVideoToResource(response);
    }
  } catch (err) {
    console.error('Failed to create resource:', err);
    return;
  }

  // Aktualizacja stanu lokalnego
  setState(prev => ({
    ...prev,
    categories: prev.categories.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t =>
          t.id === topicId
            ? { ...t, resources: [...t.resources, newResource!], updatedAt: new Date() }
            : t
        ),
      })),
    })),
  }));

  return newResource!;
};

const updateResource = async (resourceId: string, updates: Partial<Resource>) => {
  const numericId = parseNumericId(resourceId);

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
      const topicId = parseNumericId(updates.topicId || foundResource.topicId);

      if (type === 'note') {
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
  const numericId = parseNumericId(resourceId);

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
    if (resourceType === 'note') {
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
    const numericId = parseNumericId(node.id);
    if (numericId) {
      topicsToUpdate.push({
        id: numericId,
        canvasPositionX: node.position.x,
        canvasPositionY: node.position.y,
      });
    }
  }

  if (topicsToUpdate.length > 0) {
    try {
      //await api.bulkUpdateTopics(topicsToUpdate);
    } catch (err) {
      console.error('Failed to bulk update topics:', err);
    }
  }

  // Still save positions locally as backup
  savePositions(globalState.savedPositions);
};

// Get categories for Learn view
const getCategories = () => globalState.categories;

/**
 * Get derived connections for the current roadmap.
 * Computes connections from topics' relatedTopicIds.
 */
const getDerivedConnections = (): EditorConnection[] => {
  const roadmap = getCurrentRoadmap();
  if (!roadmap) return [];
  return computeConnectionsFromTopics(roadmap.topics);
};

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
    connections: getDerivedConnections(), // Compute connections for UI
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
    loadTopicDetails,
    getDerivedConnections,
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