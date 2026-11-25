import { useQuery } from '@tanstack/react-query';
import { getRoadmapsWithProgress } from '@/lib/api/learnProgress';
import { Roadmap, Topic } from '@/types/learning';
import { LearnRoadmapDto } from '@/lib/api/types';
import { learnKeys } from './learnQueryKeys';

const mapRoadmapDtoToRoadmap = (dto: LearnRoadmapDto, topics: Topic[] = []): Roadmap => ({
  id: String(dto.roadmapId),
  categoryId: String(dto.categoryId),
  title: dto.title,
  icon: dto.iconData,
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
  const numericId = categoryId ? Number(categoryId) : NaN;
  const isValidId = Number.isInteger(numericId) && numericId > 0;

  return useQuery({
    queryKey: learnKeys.categoryRoadmaps(categoryId ?? ''),
    queryFn: async () => {
      const roadmapDtos = await getRoadmapsWithProgress(numericId);
      return roadmapDtos
        .map((dto) => mapRoadmapDtoToRoadmap(dto, []))
        .sort((a, b) => a.title.localeCompare(b.title, 'pl', { sensitivity: 'base' }));
    },
    enabled: isValidId,
  });
};