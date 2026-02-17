import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Roadmap, Topic } from '@/types/learning';
import { RoadmapDto, TopicDto } from '@/lib/api/types';

interface UseRoadmapDataReturn {
  roadmap: Roadmap | undefined;
  isLoading: boolean;
  isError: boolean;
  getTopicPosition: (topic: Topic) => { x: number; y: number };
}

/**
 * Custom hook to fetch roadmap data using TanStack Query
 * Accepts categoryId and roadmapId, fetches roadmaps and topics from API
 */
export const useRoadmapData = (
  categoryId: string | undefined,
  roadmapId: string | undefined
): UseRoadmapDataReturn => {
  // Parse categoryId to number for API call
  const numericCategoryId = categoryId ? parseInt(categoryId.replace(/\D/g, '')) : undefined;

  // Fetch all roadmaps for the category
  const {
    data: roadmapDtos = [],
    isLoading: isLoadingRoadmaps,
    isError: isErrorRoadmaps,
  } = useQuery<RoadmapDto[]>({
    queryKey: ['roadmaps', categoryId],
    queryFn: async () => {
      if (!numericCategoryId) return [];
      return api.getRoadmaps(numericCategoryId);
    },
    enabled: !!numericCategoryId,
  });

  // Find the specific roadmap by roadmapId
  const roadmapDto = roadmapDtos.find(dto => String(dto.id) === roadmapId);

  // Parse roadmapId to number for topics API call
  const numericRoadmapId = roadmapId ? parseInt(roadmapId.replace(/\D/g, '')) : undefined;

  // Fetch topics for the roadmap
  const {
    data: topicDtos = [],
    isLoading: isLoadingTopics,
    isError: isErrorTopics,
  } = useQuery<TopicDto[]>({
    queryKey: ['topics', roadmapId],
    queryFn: async () => {
      if (!numericRoadmapId) return [];
      console.log(api.getTopics(numericRoadmapId));
      return api.getTopics(numericRoadmapId);
    },
    enabled: !!numericRoadmapId && !!roadmapDto,
  });

  // Map TopicDto to Topic
  const topics: Topic[] = topicDtos.map(dto => ({
    id: String(dto.id),
    roadmapId: roadmapId!,
    title: dto.title,
    description: dto.description,
    position: { x: dto.canvasPositionX, y: dto.canvasPositionY },
    status: 'not_started' as const,
    questions: [],
    resources: [],
    childTopicIds: [],
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
    console.log(topic.position)
    return topic.position;
  };

  return {
    roadmap,
    isLoading,
    isError,
    getTopicPosition,
  };
};
