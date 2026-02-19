import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as api from '@/lib/api';
import type { Roadmap, Topic } from '@/types/learning';
import type {
  RoadmapDto,
  CreateTopicDto,
} from '@/lib/api/types';
import { queryKeys } from './queryKeys';
import {
  mapRoadmapDtoToRoadmap,
  parseNumericId,
} from '@/domain/editorMappers';
import { computeConnectionsFromTopics } from '@/domain/canvas/connections';
import { useEditorTopics } from './useEditorTopics';

interface RoadmapWithGraph {
  roadmap: Roadmap | null;
  topics: Topic[];
  connections: ReturnType<typeof computeConnectionsFromTopics>;
}

export const useEditorRoadmap = (roadmapId: string | undefined) => {
  const queryClient = useQueryClient();
  const numericRoadmapId = roadmapId ? parseNumericId(roadmapId) : 0;

  const roadmapQuery = useQuery<Roadmap | null>({
    queryKey: queryKeys.roadmap(roadmapId || 'unknown'),
    enabled: !!numericRoadmapId,
    queryFn: async () => {
      try {
        const dto: RoadmapDto = await api.getRoadmapById(numericRoadmapId);
        return mapRoadmapDtoToRoadmap(dto, []);
      } catch (error) {
        console.error('Failed to load roadmap', error);
        toast.error('Nie udało się załadować roadmapy');
        throw error;
      }
    },
  });

  const topicsQuery = useEditorTopics(roadmapId);

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
        queryKey: queryKeys.topics(roadmapId || 'unknown'),
      });

      const previousTopics = queryClient.getQueryData<Topic[]>(
        queryKeys.topics(roadmapId || 'unknown'),
      );

      queryClient.setQueryData<Topic[]>(
        queryKeys.topics(roadmapId || 'unknown'),
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
          queryKeys.topics(roadmapId || 'unknown'),
          context.previousTopics,
        );
      }
      toast.error('Nie udało się przenieść węzła');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.topics(roadmapId || 'unknown'),
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
        queryKey: queryKeys.topics(roadmapId || 'unknown'),
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
        queryKey: queryKeys.topics(roadmapId || 'unknown'),
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
          queryKeys.topics(roadmapId || 'unknown'),
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
        queryKey: queryKeys.topics(roadmapId || 'unknown'),
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
          queryKeys.topics(roadmapId || 'unknown'),
        ) || [];
      const sourceTopic = topics.find((t) => t.id === payload.from);

      if (!sourceTopic) return;

      const currentRelated = sourceTopic.relatedTopicIds || [];
      const relatedNumericIds = currentRelated
        .filter((id) => id !== payload.to)
        .map((id) => parseNumericId(id));

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
        queryKey: queryKeys.topics(roadmapId || 'unknown'),
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
  icon: string;
  description?: string;
}

export const useCreateRoadmapMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, title, icon, description }: CreateRoadmapPayload) => {
      const dto: RoadmapDto = {
        title,
        description,
        iconData: icon,
        categoryId: parseNumericId(categoryId),
      };
      await api.createRoadmap(dto);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the roadmaps list for this category
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps(variables.categoryId) });
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
  icon?: string;
  description?: string;
}

export const useUpdateRoadmapMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, icon, description }: UpdateRoadmapPayload) => {
      // Get roadmap from cache before mutation
      const roadmap = queryClient.getQueryData<Roadmap | null>(
        queryKeys.roadmap(id),
      );
      
      if (!roadmap) {
        throw new Error('Roadmap not found in cache');
      }

      const dto: RoadmapDto = {
        id: parseNumericId(id),
        title: title || roadmap.title,
        description: description ?? roadmap.description,
        iconData: icon ?? roadmap.icon,
        categoryId: parseNumericId(roadmap.categoryId),
      };

      await api.updateRoadmap(dto.id!, dto);
      
      return { categoryId: roadmap.categoryId };
    },
    onSuccess: (_data, variables) => {
      // Invalidate the specific roadmap
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmap(variables.id) });
      // Invalidate the category's roadmaps list
      if (_data?.categoryId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps(_data.categoryId) });
      }
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
      // Get roadmap to know which category to invalidate before deletion
      const roadmap = queryClient.getQueryData<Roadmap | null>(
        queryKeys.roadmap(id),
      );
      const categoryId = roadmap?.categoryId;

      await api.deleteRoadmap(parseNumericId(id));

      return { categoryId };
    },
    onSuccess: (_data, variables) => {
      // Invalidate the specific roadmap
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmap(variables.id) });
      // Invalidate the category's roadmaps list
      if (_data?.categoryId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps(_data.categoryId) });
      }
    },
    onError: (error) => {
      console.error('Failed to delete roadmap', error);
      toast.error('Nie udało się usunąć roadmapy');
    },
  });
};

