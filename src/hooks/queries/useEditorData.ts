import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Topic, TopicDto } from '@/types/learning'; // lub z api/types

// Helper do mapowania (skopiowany lub zaimportowany z editorStore, docelowo powinien być w utils)
const mapTopicDtoToTopic = (dto: any, roadmapId: string): Topic => ({
  id: String(dto.id),
  roadmapId,
  title: dto.title,
  description: dto.description,
  position: { x: dto.canvasPositionX, y: dto.canvasPositionY },
  status: 'not_started', // Domyślny lub z DTO jeśli API to zwraca
  questions: [], // Wczytywane osobno lub zagnieżdżone w zależności od API
  resources: [],
  childTopicIds: [],
  relatedTopicIds: Array.isArray(dto.relatedTopicIds)
    ? dto.relatedTopicIds.map((id: number) => String(id))
    : [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useRoadmapTopics = (roadmapId: string | null) => {
  const numericId = roadmapId ? parseInt(roadmapId.replace(/\D/g, '')) : null;

  return useQuery({
    queryKey: ['roadmap-topics', roadmapId],
    queryFn: async () => {
      if (!numericId) return [];
      const dtos = await api.getTopics(numericId);
      return dtos.map(dto => mapTopicDtoToTopic(dto, roadmapId!));
    },
    enabled: !!numericId,
    staleTime: 1000 * 60 * 5, // Dane są świeże przez 5 minut
  });
};