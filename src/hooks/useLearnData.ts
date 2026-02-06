import { useState, useEffect, useCallback } from 'react';
import { Category, Roadmap, Topic } from '@/types/learning';
import { mockCategories } from '@/data/mockData';
import * as api from '@/lib/api';
import { isApiAvailable } from '@/lib/api/config';
import { CategoryDto, RoadmapDto, TopicDto } from '@/lib/api/types';

// ===== DTO to Domain Mappers =====

const mapCategoryDtoToCategory = (dto: CategoryDto): Category => ({
  id: String(dto.id),
  name: dto.title,
  description: dto.description,
  icon: dto.iconData || '📁',
  roadmaps: [],
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

interface UseLearnDataReturn {
  categories: Category[];
  roadmaps: Roadmap[];
  topics: Topic[];
  isLoading: boolean;
  error: string | null;
  selectedCategoryId: string | null;
  selectedRoadmapId: string | null;
  loadCategories: () => Promise<void>;
  loadRoadmaps: (categoryId: string) => Promise<void>;
  loadTopics: (roadmapId: string) => Promise<void>;
  selectCategory: (categoryId: string | null) => void;
  selectRoadmap: (roadmapId: string | null) => void;
  getCategoryById: (id: string) => Category | undefined;
  getRoadmapById: (id: string) => Roadmap | undefined;
}

export const useLearnData = (): UseLearnDataReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const categoryDtos = await api.getCategories();
        const mappedCategories = categoryDtos.map(dto => mapCategoryDtoToCategory(dto));
        setCategories(mappedCategories);
      } else {
        // Fallback to mock data
        console.log('API unavailable, using mock data');
        setCategories(mockCategories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Fallback to mock data on error
      setCategories(mockCategories);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRoadmaps = useCallback(async (categoryId: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedCategoryId(categoryId);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(categoryId.replace(/\D/g, ''));
        const roadmapDtos = await api.getRoadmaps(numericId);
        const mappedRoadmaps = roadmapDtos.map(dto => mapRoadmapDtoToRoadmap(dto, []));
        setRoadmaps(mappedRoadmaps);
      } else {
        // Fallback to mock data
        const category = mockCategories.find(c => c.id === categoryId);
        setRoadmaps(category?.roadmaps || []);
      }
    } catch (err) {
      console.error('Failed to load roadmaps:', err);
      // Fallback to mock data
      const category = mockCategories.find(c => c.id === categoryId);
      setRoadmaps(category?.roadmaps || []);
      setError(err instanceof Error ? err.message : 'Failed to load roadmaps');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTopics = useCallback(async (roadmapId: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedRoadmapId(roadmapId);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(roadmapId.replace(/\D/g, ''));
        const topicDtos = await api.getTopics(numericId);
        const mappedTopics = topicDtos.map(dto => mapTopicDtoToTopic(dto, roadmapId));
        setTopics(mappedTopics);
      } else {
        // Fallback to mock data
        let foundTopics: Topic[] = [];
        for (const cat of mockCategories) {
          const roadmap = cat.roadmaps.find(r => r.id === roadmapId);
          if (roadmap) {
            foundTopics = roadmap.topics;
            break;
          }
        }
        setTopics(foundTopics);
      }
    } catch (err) {
      console.error('Failed to load topics:', err);
      // Fallback to mock data
      let foundTopics: Topic[] = [];
      for (const cat of mockCategories) {
        const roadmap = cat.roadmaps.find(r => r.id === roadmapId);
        if (roadmap) {
          foundTopics = roadmap.topics;
          break;
        }
      }
      setTopics(foundTopics);
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    if (!categoryId) {
      setRoadmaps([]);
      setTopics([]);
    }
  }, []);

  const selectRoadmap = useCallback((roadmapId: string | null) => {
    setSelectedRoadmapId(roadmapId);
    if (!roadmapId) {
      setTopics([]);
    }
  }, []);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getRoadmapById = useCallback((id: string) => {
    return roadmaps.find(r => r.id === id);
  }, [roadmaps]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    roadmaps,
    topics,
    isLoading,
    error,
    selectedCategoryId,
    selectedRoadmapId,
    loadCategories,
    loadRoadmaps,
    loadTopics,
    selectCategory,
    selectRoadmap,
    getCategoryById,
    getRoadmapById,
  };
};
