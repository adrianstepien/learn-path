import { useQuery } from '@tanstack/react-query';
import { getRoadmapById } from '@/lib/api/roadmaps';
import { Roadmap, Topic } from '@/types/learning';
import { RoadmapDto, TopicDto } from '@/lib/api/types';
import { getTopicsWithProgress } from '@/lib/api/learnProgress';

interface UseLearnTopicReturn {
  roadmap: Roadmap | undefined;
  isLoading: boolean;
  isError: boolean;
  getTopicPosition: (topic: Topic) => { x: number; y: number };
}

/**
 * Custom hook to fetch roadmap data using TanStack Query
 * Accepts categoryId and roadmapId, fetches roadmaps and topics from API
 */
export const useLearnTopic = (
  roadmapId: string | undefined
): UseLearnTopicReturn => {
  // Parse categoryId to number for API call
  const numericRoadmapId = roadmapId ? Number(roadmapId) : undefined;

  // Fetch all roadmaps for the category
  const {
    data: roadmapDto,
    isLoading: isLoadingRoadmaps,
    isError: isErrorRoadmaps,
  } = useQuery<RoadmapDto>({
    queryKey: ['roadmaps', roadmapId],
    queryFn: async () => {
      if (!roadmapId) return [];
      return getRoadmapById(roadmapId);
    },
    enabled: !!roadmapId,
  });

  // Fetch topics for the roadmap
  const {
    data: topicDtos = [],
    isLoading: isLoadingTopics,
    isError: isErrorTopics,
  } = useQuery<TopicDto[]>({
    queryKey: ['topics', roadmapId],
    queryFn: async () => {
      if (!numericRoadmapId) return [];
      return getTopicsWithProgress(numericRoadmapId);
    },
    enabled: !!numericRoadmapId && !!roadmapDto,
  });

  // Map TopicDto to Topic
  const topics: Topic[] = topicDtos.map(dto => ({
    id: String(dto.topicId),
    roadmapId: roadmapId!,
    title: dto.title,
    description: dto.description,
    position: {
          x: Number(dto.canvasPositionX) || 0,
          y: Number(dto.canvasPositionY) || 0
        },
    relatedTopicIds: dto.relatedTopicIds?.map(String) || [],
    status: 'not_started' as const,
    questions: [],
    resources: [],
    childTopicIds: [],
    totalCards: dto.totalCards,
    dueCards: dto.dueCards,
    progress: dto.totalCards > 0
        ? Math.round(((dto.totalCards - dto.dueCards) / dto.totalCards) * 100)
        : 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Build Roadmap object
  const roadmap: Roadmap | undefined = roadmapDto
    ? {
        id: String(roadmapDto.id),
        categoryId: String(roadmapDto.categoryId),
        title: roadmapDto.title,
        description: roadmapDto.description,
        topics,
        connections: [],
        progress: 0,
        totalQuestions: topics.reduce((acc, t) => acc + t.questions.length, 0),
        masteredQuestions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    : undefined;

  const isLoading = isLoadingRoadmaps || isLoadingTopics;
  const isError = isErrorRoadmaps || isErrorTopics || (!isLoading && !roadmap);

  /**
   * Get position for a topic - simply return topic.position
   */
  const getTopicPosition = (topic: Topic): { x: number; y: number } => {
    return topic.position;
  };

  return {
    roadmap,
    isLoading,
    isError,
    getTopicPosition,
  };
};
