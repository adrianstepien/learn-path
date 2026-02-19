import { useState, useEffect, useCallback } from 'react';
import { Category, Roadmap, Topic } from '@/types/learning';
import { mockCategories } from '@/data/mockData';
import * as api from '@/lib/api';
import { getCategoriesWithProgress, getRoadmapsWithProgress, getTopicsWithProgress } from '@/lib/api/learnProgress';
import { CategoryDto, RoadmapDto, TopicDto, LearnCategoryDto } from '@/lib/api/types';

// ===== DTO to Domain Mappers =====

const mapCategoryDtoToCategory = (dto: CategoryDto): Category => ({
  id: String(dto.categoryId),
  name: dto.title,
  description: dto.description,
  icon: dto.iconData || '📁',
  totalCards: dto.totalCards,
  dueCards: dto.dueCards,
  progress: dto.totalCards > 0
    ? Math.round(((dto.totalCards - dto.dueCards) / dto.totalCards) * 100)
    : 0,
});

const mapRoadmapDtoToRoadmap = (dto: RoadmapDto, topics: Topic[] = []): Roadmap => ({
  id: String(dto.id),
  categoryId: String(dto.categoryId),
  title: dto.title,
  description: dto.description,
  icon: dto.iconData || '📁',
  topics,
  connections: [],
  progress: 0,
  totalQuestions: topics.reduce((acc, t) => acc + t.questions.length, 0),
  masteredQuestions: 0,
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
        const categoryDtos = await getCategoriesWithProgress();
        const mappedCategories = categoryDtos.map(dto => mapCategoryDtoToCategory(dto));
        console.log(mappedCategories)
        setCategories(mappedCategories);
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
        const numericId = parseInt(categoryId.replace(/\D/g, ''));
        const roadmapDtos = await api.getRoadmaps(numericId);
        const mappedRoadmaps = roadmapDtos.map(dto => mapRoadmapDtoToRoadmap(dto, []));
        setRoadmaps(mappedRoadmaps);
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
  };
};
