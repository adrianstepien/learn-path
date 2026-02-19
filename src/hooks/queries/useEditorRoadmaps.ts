import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as api from '@/lib/api';
import type { Roadmap } from '@/types/learning';
import type { RoadmapDto } from '@/lib/api/types';
import { queryKeys } from './queryKeys';
import { mapRoadmapDtoToRoadmap, parseNumericId } from '@/domain/editorMappers';

export const useEditorRoadmaps = (categoryId: string | undefined) => {
  const numericCategoryId = categoryId ? parseNumericId(categoryId) : 0;

  return useQuery<Roadmap[]>({
    queryKey: queryKeys.roadmaps(categoryId || 'unknown'),
    enabled: !!numericCategoryId,
    queryFn: async () => {
      try {
        const dtos: RoadmapDto[] = await api.getRoadmaps(numericCategoryId);
        return dtos.map((dto) => mapRoadmapDtoToRoadmap(dto, []));
      } catch (error) {
        console.error('Failed to load roadmaps', error);
        toast.error('Nie udało się załadować roadmap');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};

