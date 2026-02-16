import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Roadmap, Topic } from '@/types/learning';

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

export const useRoadmapDetail = (roadmapId: string | undefined) => {
  const id = roadmapId ? parseInt(roadmapId.replace(/\D/g, '')) : null;

  return useQuery({
    queryKey: ['roadmap', roadmapId, 'full'],
    queryFn: async (): Promise<Roadmap | null> => {
      if (!id) return null;

      // Pobieramy podstawowe dane roadmapy i tematy równolegle
      const [roadmapDto, topicDtos] = await Promise.all([
        api.getRoadmap(id), // Zakładam, że masz api.getRoadmap
        api.getTopics(id)
      ]);

      // Mapujemy tematy, upewniając się, że pola questions/resources to zawsze tablice (FIX BŁĘDU .length)
      const mappedTopics: Topic[] = topicDtos.map(dto => mapTopicDtoToTopic(t, roadmapId));

      return {
        id: String(roadmapDto.id),
        title: roadmapDto.title,
        description: roadmapDto.description,
        topics: mappedTopics,
        connections: [],
        progress: 0,
        totalQuestions: topics.reduce((acc, t) => acc + t.questions.length, 0),
        masteredQuestions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Roadmap;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minut cache
  });
};