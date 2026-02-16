import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Roadmap, Topic } from '@/types/learning';
import { RoadmapDto } from '@/lib/api/types';

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

export const useRoadmaps = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['roadmaps', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const numericId = parseInt(categoryId.replace(/\D/g, ''));
      if (isNaN(numericId)) return [];

      const roadmapDtos = await api.getRoadmaps(numericId);
      return roadmapDtos.map(dto => mapRoadmapDtoToRoadmap(dto, []));
    },
    enabled: !!categoryId, // Zapytanie działa tylko gdy mamy ID
  });
};