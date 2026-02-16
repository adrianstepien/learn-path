// src/hooks/queries/useLearningContent.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/lib/api/categories';

import {
  getRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap
} from '@/lib/api/roadmaps';

import {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  // Zakładam, że łączenie tematów jest realizowane przez updateTopic lub dedykowaną funkcję.
  // Jeśli nie masz funkcji connect/disconnect w api/topics.ts,
  // musisz je dodać lub obsłużyć logikę połączeń inaczej.
  // Na razie użyję updateTopic jako placeholder dla pozycji.
} from '@/lib/api/topics';

import { CategoryDto, RoadmapDto, TopicDto, TopicDetailsDto, CreateTopicDto } from '@/lib/api/types';

// --- KLUCZE QUERY ---
export const learningKeys = {
  all: ['learning'] as const,
  categories: () => [...learningKeys.all, 'categories'] as const,
  roadmaps: (categoryId?: string) => [...learningKeys.all, 'roadmaps', categoryId] as const,
  topics: (roadmapId?: string) => [...learningKeys.all, 'topics', roadmapId] as const,
  topicDetails: (topicId?: string) => [...learningKeys.all, 'topic', topicId] as const,
};

// --- HOOKI DO POBIERANIA DANYCH ---

export const useCategories = () => {
  return useQuery({
    queryKey: learningKeys.categories(),
    queryFn: async () => {
      const res = await api.categories.getAll();
      return res;
    },
  });
};

export const useRoadmaps = (categoryId?: string) => {
  return useQuery({
    queryKey: learningKeys.roadmaps(categoryId),
    queryFn: async () => {
      if (!categoryId) return [];
      return api.roadmaps.getByCategory(categoryId);
    },
    enabled: !!categoryId,
  });
};

export const useTopics = (roadmapId?: string) => {
  return useQuery({
    queryKey: learningKeys.topics(roadmapId),
    queryFn: async () => {
      if (!roadmapId) return [];
      return api.topics.getByRoadmap(roadmapId);
    },
    enabled: !!roadmapId,
  });
};

export const useTopicDetails = (topicId?: string) => {
  return useQuery({
    queryKey: learningKeys.topicDetails(topicId),
    queryFn: async () => {
      if (!topicId) return null;
      return api.topics.getById(topicId);
    },
    enabled: !!topicId,
  });
};

// --- HOOK MUTACJI (CRUD) ---

export const useLearningMutations = () => {
  const queryClient = useQueryClient();

  // Helper do inwalidacji
  const invalidate = (keys: any[]) => queryClient.invalidateQueries({ queryKey: keys });

  return {
    // Kategorie
    createCategory: useMutation({
      mutationFn: api.categories.create,
      onSuccess: () => invalidate(learningKeys.categories()),
    }),
    updateCategory: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
        api.categories.update(id, data),
      onSuccess: () => invalidate(learningKeys.categories()),
    }),
    deleteCategory: useMutation({
      mutationFn: api.categories.delete,
      onSuccess: () => invalidate(learningKeys.categories()),
    }),

    // Roadmapy
    createRoadmap: useMutation({
      mutationFn: api.roadmaps.create,
      onSuccess: (_, variables) => invalidate(learningKeys.roadmaps(variables.categoryId)),
    }),
    updateRoadmap: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Roadmap> }) =>
        api.roadmaps.update(id, data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning', 'roadmaps'] }),
    }),
    deleteRoadmap: useMutation({
      mutationFn: api.roadmaps.delete,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning', 'roadmaps'] }),
    }),

    // Topiki (Węzły)
    createTopic: useMutation({
      mutationFn: api.topics.create,
      onSuccess: (_, vars) => invalidate(learningKeys.topics(vars.roadmapId)),
    }),
    updateTopic: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Topic> }) =>
        api.topics.update(id, data),
      onSuccess: (data) => {
        // Inwalidujemy listę i szczegóły
        invalidate(learningKeys.topics(data.roadmapId));
        invalidate(learningKeys.topicDetails(data.id));
      },
    }),
    deleteTopic: useMutation({
      mutationFn: api.topics.delete,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning', 'topics'] }),
    }),

    // Połączenia (Connections)
    // Zakładam, że połączenia są częścią API topics lub mają własny endpoint
    createConnection: useMutation({
        mutationFn: api.topics.connect, // Dostosuj do swojego API
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning', 'topics'] }),
    }),
    deleteConnection: useMutation({
        mutationFn: api.topics.disconnect, // Dostosuj do swojego API
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning', 'topics'] }),
    })
  };
};