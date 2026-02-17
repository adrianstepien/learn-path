/*
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Topic, Roadmap, TopicConnection } from '@/types/learning';
import { TopicDto, UpdateTopicDto, CreateTopicDto } from '@/lib/api/types';
import { computeConnectionsFromTopics } from '@/domain/canvas/connections'; // Zakładam, że to istnieje na bazie importów ze starego pliku

// --- Helpers & Mappers ---

const mapTopicDtoToTopic = (dto: TopicDto, roadmapId: string): Topic => ({
  id: String(dto.id),
  roadmapId,
  title: dto.title,
  description: dto.description,
  position: { x: dto.canvasPositionX, y: dto.canvasPositionY },
  status: 'not_started', // Domyślny status, API może to rozszerzyć
  questions: [],
  resources: [],
  childTopicIds: [],
  relatedTopicIds: Array.isArray((dto as any).relatedTopicIds)
    ? (dto as any).relatedTopicIds.map((id: number) => String(id))
    : [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Helper do parsowania ID (string -> number) dla API
const parseId = (id: string | number | undefined | null): number => {
  if (!id) return 0;
  const str = String(id);
  return parseInt(str.replace(/\D/g, '')) || 0;
};

// --- Hook ---

export const useRoadmapGraph = (roadmapId: string | undefined) => {
  const queryClient = useQueryClient();
  const numericRoadmapId = roadmapId ? parseId(roadmapId) : 0;

  // 1. Pobieranie Roadmapy
  const roadmapQuery = useQuery({
    queryKey: ['roadmap', roadmapId],
    queryFn: async () => {
       // Tutaj normalnie byłoby api.getRoadmap(id), symulujemy pobranie z listy kategorii
       // w prawdziwym scenariuszu powinien być endpoint api.getRoadmap(id)
       const categories = await api.getCategories();
       for (const cat of categories) {
         const roadmaps = await api.getRoadmaps(cat.id!);
         const found = roadmaps.find(r => String(r.id) === roadmapId);
         if (found) return found;
       }
       throw new Error('Roadmap not found');
    },
    enabled: !!roadmapId,
  });

  // 2. Pobieranie Tematów (Węzłów)
  const topicsQuery = useQuery({
    queryKey: ['topics', roadmapId],
    queryFn: async () => {
      if (!numericRoadmapId) return [];
      const dtos = await api.getTopics(numericRoadmapId);
      return dtos.map(dto => mapTopicDtoToTopic(dto, roadmapId!));
    },
    enabled: !!numericRoadmapId,
  });

  // Obliczanie połączeń na podstawie tematów
  const connections = topicsQuery.data
    ? computeConnectionsFromTopics(topicsQuery.data)
    : [];

  // 3. Mutacja: Przesuwanie węzła (Optimistic UI)
  const moveNodeMutation = useMutation({
    mutationFn: async (payload: { id: string; position: { x: number; y: number } }) => {
      const numericId = parseId(payload.id);
      await api.updateTopic(numericId, {
        id: numericId,
        canvasPositionX: payload.position.x,
        canvasPositionY: payload.position.y
      });
    },
    onMutate: async (newPos) => {
      // Anuluj refetche, żeby nie nadpisały optymistycznego stanu
      await queryClient.cancelQueries({ queryKey: ['topics', roadmapId] });

      const previousTopics = queryClient.getQueryData<Topic[]>(['topics', roadmapId]);

      // Optymistyczna aktualizacja cache
      queryClient.setQueryData<Topic[]>(['topics', roadmapId], (old) => {
        if (!old) return [];
        return old.map((t) =>
          t.id === newPos.id ? { ...t, position: newPos.position } : t
        );
      });

      return { previousTopics };
    },
    onError: (err, newPos, context) => {
      // Rollback w przypadku błędu
      if (context?.previousTopics) {
        queryClient.setQueryData(['topics', roadmapId], context.previousTopics);
      }
    },
    onSettled: () => {
      // Opcjonalnie: odśwież dane po zakończeniu (można wyłączyć dla płynności jeśli backend jest pewny)
      // queryClient.invalidateQueries({ queryKey: ['topics', roadmapId] });
    },
  });

  // 4. Mutacja: Dodawanie węzła
  const addNodeMutation = useMutation({
    mutationFn: async (payload: { title: string; position: { x: number; y: number } }) => {
      const dto: CreateTopicDto = {
        title: payload.title,
        canvasPositionX: payload.position.x,
        canvasPositionY: payload.position.y,
        roadmapId: numericRoadmapId
      };
      await api.createTopic(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', roadmapId] });
    }
  });

  // 5. Mutacja: Usuwanie węzła
  const deleteNodeMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      await api.deleteTopic(parseId(nodeId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', roadmapId] });
    }
  });

  // 6. Mutacja: Dodawanie połączenia
  const addConnectionMutation = useMutation({
    mutationFn: async (payload: { from: string; to: string }) => {
      // Pobieramy aktualne dane, aby zaktualizować tablicę relatedTopicIds
      const topics = queryClient.getQueryData<Topic[]>(['topics', roadmapId]) || [];
      const sourceTopic = topics.find(t => t.id === payload.from);

      if (sourceTopic) {
        // Dodajemy ID do tablicy (zakładając API updateTopic przyjmuje listę ID)
        const currentRelated = sourceTopic.relatedTopicIds || [];
        // Mapujemy string ID na number ID dla API
        const relatedNumericIds = [...new Set([...currentRelated, payload.to])]
          .map(id => parseId(id))
          .filter(id => id !== 0);

        await api.updateTopic(parseId(payload.from), {
          id: parseId(payload.from),
          relatedTopicIds: relatedNumericIds
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', roadmapId] });
    }
  });

  // 7. Mutacja: Usuwanie połączenia
  const deleteConnectionMutation = useMutation({
    mutationFn: async (payload: { from: string; to: string }) => {
      const topics = queryClient.getQueryData<Topic[]>(['topics', roadmapId]) || [];
      const sourceTopic = topics.find(t => t.id === payload.from);

      if (sourceTopic) {
        const currentRelated = sourceTopic.relatedTopicIds || [];
        const relatedNumericIds = currentRelated
          .filter(id => id !== payload.to)
          .map(id => parseId(id));

        await api.updateTopic(parseId(payload.from), {
          id: parseId(payload.from),
          relatedTopicIds: relatedNumericIds
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', roadmapId] });
    }
  });

  return {
    roadmap: roadmapQuery.data,
    topics: topicsQuery.data || [],
    connections,
    isLoading: topicsQuery.isLoading || roadmapQuery.isLoading,
    moveNode: moveNodeMutation.mutate,
    addNode: addNodeMutation.mutateAsync,
    deleteNode: deleteNodeMutation.mutate,
    addConnection: addConnectionMutation.mutate,
    deleteConnection: deleteConnectionMutation.mutate,
  };
}; */
