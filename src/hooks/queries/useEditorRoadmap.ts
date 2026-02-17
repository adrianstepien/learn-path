import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as api from '@/lib/api';
import type { Roadmap, Topic, Category } from '@/types/learning';
import type {
  RoadmapDto,
  TopicDto,
  CreateTopicDto,
} from '@/lib/api/types';
import { editorKeys } from './editorQueryKeys';
import {
  mapRoadmapDtoToRoadmap,
  mapTopicDtoToTopic,
  parseNumericId,
} from '@/domain/editorMappers';
import { computeConnectionsFromTopics } from '@/domain/canvas/connections';

interface RoadmapWithGraph {
  roadmap: Roadmap | null;
  topics: Topic[];
  connections: ReturnType<typeof computeConnectionsFromTopics>;
}

export const useEditorRoadmap = (roadmapId: string | undefined) => {
  const queryClient = useQueryClient();
  const numericRoadmapId = roadmapId ? parseNumericId(roadmapId) : 0;

  const roadmapQuery = useQuery<Roadmap | null>({
    queryKey: editorKeys.roadmap(roadmapId || 'unknown'),
    enabled: !!numericRoadmapId,
    queryFn: async () => {
      // Fallback: search roadmap through categories if a direct endpoint is missing
      try {
        const categories = await api.getCategories();
        for (const cat of categories) {
          const roadmaps: RoadmapDto[] = await api.getRoadmaps(cat.id!);
          const found = roadmaps.find((r) => String(r.id) === roadmapId);
          if (found) {
            const topicsDtos: TopicDto[] = await api.getTopics(found.id!);
            const topics = topicsDtos.map((t) =>
              mapTopicDtoToTopic(t, String(found.id)),
            );
            return mapRoadmapDtoToRoadmap(found, topics);
          }
        }
        return null;
      } catch (error) {
        console.error('Failed to load roadmap', error);
        toast.error('Nie udało się załadować roadmapy');
        throw error;
      }
    },
  });

  const topicsQuery = useQuery<Topic[]>({
    queryKey: editorKeys.topics(roadmapId || 'unknown'),
    enabled: !!numericRoadmapId,
    queryFn: async () => {
      try {
        const dtos: TopicDto[] = await api.getTopics(numericRoadmapId);
        return dtos.map((dto) => mapTopicDtoToTopic(dto, roadmapId!));
      } catch (error) {
        console.error('Failed to load topics', error);
        toast.error('Nie udało się załadować tematów');
        throw error;
      }
    },
  });

  const connections = topicsQuery.data
    ? computeConnectionsFromTopics(topicsQuery.data)
    : [];

  // Optimistic position update
  const moveNodeMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      position: { x: number; y: number };
    }) => {
      const numericId = parseNumericId(payload.id);
      await api.updateTopicPosition(numericId, {
        canvasPositionX: payload.position.x,
        canvasPositionY: payload.position.y,
      });
    },
    onMutate: async (newPos) => {
      await queryClient.cancelQueries({
        queryKey: editorKeys.topics(roadmapId || 'unknown'),
      });

      const previousTopics = queryClient.getQueryData<Topic[]>(
        editorKeys.topics(roadmapId || 'unknown'),
      );

      queryClient.setQueryData<Topic[]>(
        editorKeys.topics(roadmapId || 'unknown'),
        (old) => {
          if (!old) return [];
          return old.map((t) =>
            t.id === newPos.id ? { ...t, position: newPos.position } : t,
          );
        },
      );

      return { previousTopics };
    },
    onError: (error, _newPos, context) => {
      console.error('Failed to move node', error);
      if (context?.previousTopics) {
        queryClient.setQueryData(
          editorKeys.topics(roadmapId || 'unknown'),
          context.previousTopics,
        );
      }
      toast.error('Nie udało się przenieść węzła');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topics(roadmapId || 'unknown'),
      });
    },
  });

  const addNodeMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      position: { x: number; y: number };
    }) => {
      const dto: CreateTopicDto = {
        title: payload.title,
        canvasPositionX: payload.position.x,
        canvasPositionY: payload.position.y,
        roadmapId: numericRoadmapId,
      };
      await api.createTopic(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topics(roadmapId || 'unknown'),
      });
    },
    onError: (error) => {
      console.error('Failed to create topic', error);
      toast.error('Nie udało się utworzyć tematu');
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      await api.deleteTopic(parseNumericId(nodeId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topics(roadmapId || 'unknown'),
      });
    },
    onError: (error) => {
      console.error('Failed to delete topic', error);
      toast.error('Nie udało się usunąć tematu');
    },
  });

  // Connection mutations operate via relatedTopicIds
  const addConnectionMutation = useMutation({
    mutationFn: async (payload: { from: string; to: string }) => {
      const topics =
        queryClient.getQueryData<Topic[]>(
          editorKeys.topics(roadmapId || 'unknown'),
        ) || [];
      const sourceTopic = topics.find((t) => t.id === payload.from);

      if (!sourceTopic) return;

      const currentRelated = sourceTopic.relatedTopicIds || [];
      const relatedNumericIds = [...new Set([...currentRelated, payload.to])]
        .map((id) => parseNumericId(id))
        .filter((id) => id !== 0);

      await api.updateTopic(parseNumericId(payload.from), {
        id: parseNumericId(payload.from),
        title: sourceTopic.title,
        canvasPositionX: sourceTopic.position.x,
        canvasPositionY: sourceTopic.position.y,
        roadmapId: sourceTopic.roadmapId,
        relatedTopicIds: relatedNumericIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topics(roadmapId || 'unknown'),
      });
    },
    onError: (error) => {
      console.error('Failed to add connection', error);
      toast.error('Nie udało się utworzyć połączenia');
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (payload: { from: string; to: string }) => {
      const topics =
        queryClient.getQueryData<Topic[]>(
          editorKeys.topics(roadmapId || 'unknown'),
        ) || [];
      const sourceTopic = topics.find((t) => t.id === payload.from);

      if (!sourceTopic) return;

      const currentRelated = sourceTopic.relatedTopicIds || [];
      const relatedNumericIds = currentRelated
        .filter((id) => id !== payload.to)
        .map((id) => parseNumericId(id));

      await api.updateTopic(parseNumericId(payload.from), {
        id: parseNumericId(payload.from),
        relatedTopicIds: relatedNumericIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topics(roadmapId || 'unknown'),
      });
    },
    onError: (error) => {
      console.error('Failed to remove connection', error);
      toast.error('Nie udało się usunąć połączenia');
    },
  });

  const result: RoadmapWithGraph = {
    roadmap: roadmapQuery.data ?? null,
    topics: topicsQuery.data ?? [],
    connections,
  };

  return {
    ...result,
    isLoading: roadmapQuery.isLoading || topicsQuery.isLoading,
    moveNode: moveNodeMutation.mutate,
    addNode: addNodeMutation.mutateAsync,
    deleteNode: deleteNodeMutation.mutate,
    addConnection: addConnectionMutation.mutate,
    deleteConnection: deleteConnectionMutation.mutate,
  };
};

// ===== Roadmap mutations (create/update/delete) =====

interface CreateRoadmapPayload {
  categoryId: string;
  title: string;
  description?: string;
}

export const useCreateRoadmapMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, title, description }: CreateRoadmapPayload) => {
      const dto: RoadmapDto = {
        title,
        description,
        categoryId: parseNumericId(categoryId),
      };
      await api.createRoadmap(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editorKeys.categories() });
    },
    onError: (error) => {
      console.error('Failed to create roadmap', error);
      toast.error('Nie udało się utworzyć roadmapy');
    },
  });
};

interface UpdateRoadmapPayload {
  id: string;
  title?: string;
  description?: string;
}

export const useUpdateRoadmapMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, description }: UpdateRoadmapPayload) => {
      const categories =
        queryClient.getQueryData<Category[]>(editorKeys.categories()) || [];
      let foundRoadmap: Roadmap | undefined;
      for (const cat of categories) {
        const r = cat.roadmaps.find((roadmap) => roadmap.id === id);
        if (r) {
          foundRoadmap = r;
          break;
        }
      }
      if (!foundRoadmap) return;

      const dto: RoadmapDto = {
        id: parseNumericId(id),
        title: title || foundRoadmap.title,
        description: description ?? foundRoadmap.description,
        categoryId: parseNumericId(foundRoadmap.categoryId),
      };

      await api.updateRoadmap(dto.id!, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editorKeys.categories() });
    },
    onError: (error) => {
      console.error('Failed to update roadmap', error);
      toast.error('Nie udało się zaktualizować roadmapy');
    },
  });
};

interface DeleteRoadmapPayload {
  id: string;
}

export const useDeleteRoadmapMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteRoadmapPayload) => {
      await api.deleteRoadmap(parseNumericId(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editorKeys.categories() });
    },
    onError: (error) => {
      console.error('Failed to delete roadmap', error);
      toast.error('Nie udało się usunąć roadmapy');
    },
  });
};

