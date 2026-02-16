// src/pages/learn/roadmap/hooks/useRoadmapData.ts
import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Roadmap, Topic } from '@/types/learning';
import { TopicDto } from '@/lib/api/types';

interface UseRoadmapDataReturn {
  roadmap: Roadmap | undefined;
  isLoading: boolean;
  isError: boolean;
  getTopicPosition: (topic: Topic) => { x: number; y: number };
}

// Mapper z DTO na typ domenowy
const mapTopicDtoToTopic = (dto: TopicDto, roadmapId: string): Topic => ({
  id: String(dto.id),
  roadmapId: roadmapId,
  title: dto.title,
  description: dto.description,
  position: { x: dto.canvasPositionX || 0, y: dto.canvasPositionY || 0 }, // Pozycja z bazy
  status: 'not_started',
  questions: [],
  resources: [],
  childTopicIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useRoadmapData = (categoryId: string | undefined, roadmapId: string | undefined): UseRoadmapDataReturn => {
  // Parsowanie ID (zakładając że mogą przyjść jako np. "roadmap-1" lub po prostu "1")
  const numericCatId = categoryId ? parseInt(categoryId.replace(/\D/g, '')) : NaN;
  const numericRoadmapId = roadmapId ? parseInt(roadmapId.replace(/\D/g, '')) : NaN;

  // 1. Pobieramy listę roadmap w kategorii, aby znaleźć tę jedną i wziąć jej tytuł/opis
  // (Robimy to, bo API nie ma endpointu getRoadmapById)
  const { data: roadmapMeta, isLoading: isMetaLoading, isError: isMetaError } = useQuery({
    queryKey: ['roadmaps', categoryId],
    queryFn: async () => {
      const roadmaps = await api.getRoadmaps(numericCatId);
      return roadmaps.find(r => r.id === numericRoadmapId);
    },
    enabled: !isNaN(numericCatId) && !isNaN(numericRoadmapId),
  });

  // 2. Pobieramy tematy dla tej roadmapy
  const { data: topics = [], isLoading: isTopicsLoading, isError: isTopicsError } = useQuery({
    queryKey: ['topics', roadmapId],
    queryFn: async () => {
      const dtos = await api.getTopics(numericRoadmapId);
      return dtos.map(dto => mapTopicDtoToTopic(dto, String(numericRoadmapId)));
    },
    enabled: !isNaN(numericRoadmapId),
  });

  // 3. Składamy pełny obiekt
  const roadmap: Roadmap | undefined = roadmapMeta ? {
    id: String(roadmapMeta.id),
    categoryId: String(roadmapMeta.categoryId),
    title: roadmapMeta.title,
    description: roadmapMeta.description,
    topics: topics,
    connections: [],
    progress: 0,
    totalQuestions: 0,
    masteredQuestions: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } : undefined;

  // Prosty getter pozycji - bierze to co przyszło z API w obiekcie topic
  const getTopicPosition = (topic: Topic) => topic.position;

  return {
    roadmap,
    isLoading: isMetaLoading || isTopicsLoading,
    isError: isMetaError || isTopicsError || (!isMetaLoading && !roadmapMeta),
    getTopicPosition,
  };
};