import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Roadmap, Topic } from '@/types/learning';
import { TopicDto } from '@/lib/api/types';

interface UseRoadmapDataReturn {
  roadmap: Roadmap | undefined;
  isLoading: boolean;
  error: unknown;
  getTopicPosition: (topic: Topic) => { x: number; y: number };
}

// Helper do mapowania DTO tematu na typ domenowy
const mapTopicDtoToTopic = (dto: TopicDto, roadmapId: string): Topic => ({
  id: String(dto.id),
  roadmapId: roadmapId,
  title: dto.title,
  description: dto.description,
  // Pozycja z backendu
  position: { x: dto.canvasPositionX || 0, y: dto.canvasPositionY || 0 },
  status: 'not_started', // Tutaj w przyszłości podepniesz postęp użytkownika
  questions: [],
  resources: [], // Resources można pobrać osobnym zapytaniem jeśli są ciężkie
  childTopicIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useRoadmapData = (roadmapId: string | undefined): UseRoadmapDataReturn => {
  const numericId = roadmapId ? parseInt(roadmapId.replace(/\D/g, '')) : NaN;
  const isValidId = !isNaN(numericId);

  // 1. Pobieranie metadanych roadmapy (tytuł, opis)
  const roadmapQuery = useQuery({
    queryKey: ['roadmap', roadmapId],
    queryFn: async () => {
      if (!isValidId) throw new Error('Invalid ID');
      const dto = await api.getRoadmapById(numericId);
      return dto;
    },
    enabled: isValidId,
    retry: 1, // Nie ponawiaj w nieskończoność jeśli 404
  });

  // 2. Pobieranie tematów dla roadmapy
  const topicsQuery = useQuery({
    queryKey: ['roadmap', roadmapId, 'topics'],
    queryFn: async () => {
      if (!isValidId) return [];
      const dtos = await api.getTopics(numericId);
      return dtos.map(dto => mapTopicDtoToTopic(dto, roadmapId!));
    },
    enabled: isValidId,
  });

  // Łączenie danych
  let roadmap: Roadmap | undefined = undefined;

  if (roadmapQuery.data) {
    roadmap = {
      id: String(roadmapQuery.data.id),
      categoryId: String(roadmapQuery.data.categoryId),
      title: roadmapQuery.data.title,
      description: roadmapQuery.data.description,
      topics: topicsQuery.data || [], // Podpinamy pobrane tematy
      connections: [],
      progress: 0, // Do pobrania z endpointu statystyk
      totalQuestions: 0,
      masteredQuestions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Funkcja pomocnicza do pozycji (teraz bierze po prostu z obiektu, bez store'a)
  const getTopicPosition = (topic: Topic) => {
    return topic.position || { x: 0, y: 0 };
  };

  return {
    roadmap,
    isLoading: roadmapQuery.isLoading || topicsQuery.isLoading,
    error: roadmapQuery.error || topicsQuery.error,
    getTopicPosition,
  };
};