import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as api from '@/lib/api';
import type { Topic } from '@/types/learning';
import type { TopicDto } from '@/lib/api/types';
import { queryKeys } from './queryKeys';
import { mapTopicDtoToTopic, parseNumericId } from '@/domain/editorMappers';

export const useEditorTopics = (roadmapId: string | undefined) => {
  const numericRoadmapId = roadmapId ? parseNumericId(roadmapId) : 0;

  return useQuery<Topic[]>({
    queryKey: queryKeys.topics(roadmapId || 'unknown'),
    enabled: !!numericRoadmapId,
    queryFn: async () => {
      try {
        const dtos: TopicDto[] = await api.getTopics(numericRoadmapId);
        return dtos.map((dto) => mapTopicDtoToTopic(dto, String(roadmapId)));
      } catch (error) {
        console.error('Failed to load topics', error);
        toast.error('Nie udało się załadować tematów');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};

