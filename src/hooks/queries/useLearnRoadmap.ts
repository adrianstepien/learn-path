import { useQuery } from '@tanstack/react-query';
import { getRoadmapsWithProgress } from '@/lib/api/learnProgress';
import { Roadmap } from '@/types/learning';

const mapRoadmapDtoToRoadmap = (dto: RoadmapDto, topics: Topic[] = []): Roadmap => ({
  id: String(dto.roadmapId),
  categoryId: String(dto.categoryId),
  title: dto.title,
  description: dto.description,
  topics,
  totalCards: dto.totalCards,
  dueCards: dto.dueCards,
  progress: dto.totalCards > 0
    ? Math.round(((dto.totalCards - dto.dueCards) / dto.totalCards) * 100)
    : 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useLearnRoadmap = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['roadmaps', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const numericId = parseInt(categoryId.replace(/\D/g, ''));
      const roadmapDtos = await getRoadmapsWithProgress(numericId);
      return roadmapDtos.map(dto => mapRoadmapDtoToRoadmap(dto, []));;
    },
    enabled: !!categoryId,
  });
};