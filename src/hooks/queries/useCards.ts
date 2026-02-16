import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { isApiAvailable } from '@/lib/api/config';
import { CardDto } from '@/lib/api/types';
import { Question } from '@/types/learning';

// Klucze zapytań - warto trzymać je w obiekcie, żeby były spójne w całej apce
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  detail: (id: number) => [...cardKeys.all, 'detail', id] as const,
};

// Mapper (DTO -> Domain)
const mapCardDtoToQuestion = (dto: CardDto): Question => ({
  id: String(dto.id),
  topicId: String(dto.topicId),
  type: 'open_ended',
  question: dto.question,
  answer: dto.answer,
  difficulty: dto.difficulty === 1 ? 'beginner' : dto.difficulty === 2 ? 'intermediate' : dto.difficulty === 3 ? 'advanced' : 'expert',
  importance: dto.importance === 1 ? 'low' : dto.importance === 2 ? 'medium' : dto.importance === 3 ? 'high' : 'critical',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
});

// --- HOOKI ---

export const useCards = () => {
  return useQuery({
    queryKey: cardKeys.lists(),
    queryFn: async () => {
      const available = await isApiAvailable();
      if (!available) return [];
      const data = await api.getCards();
      return data.map(mapCardDtoToQuestion);
    },
  });
};

export const useCardMutations = () => {
  const queryClient = useQueryClient();

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const available = await isApiAvailable();
      if (!available) throw new Error("API unavailable");
      const numericId = parseInt(id.replace(/\D/g, ''));
      await api.deleteCard(numericId);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: cardKeys.lists() });
      const previousCards = queryClient.getQueryData<Question[]>(cardKeys.lists());
      queryClient.setQueryData<Question[]>(cardKeys.lists(), (old) => old ? old.filter((q) => q.id !== id) : []);
      return { previousCards };
    },
    onError: (err, id, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(cardKeys.lists(), context.previousCards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Question> }) => {
      const available = await isApiAvailable();
      if (!available) throw new Error("API unavailable");

      const cachedCards = queryClient.getQueryData<Question[]>(cardKeys.lists());
      const existingCard = cachedCards?.find(q => q.id === id);
      if (!existingCard) throw new Error("Card not found in cache");

      const numericId = parseInt(id.replace(/\D/g, ''));
      const cardDto: CardDto = {
        id: numericId,
        question: data.question !== undefined ? data.question : existingCard.question,
        answer: data.answer !== undefined ? data.answer : existingCard.answer,
        topicId: parseInt(existingCard.topicId.replace(/\D/g, '')),
        difficulty: data.difficulty ? (data.difficulty === 'beginner' ? 1 : data.difficulty === 'intermediate' ? 2 : data.difficulty === 'advanced' ? 3 : 4) : (existingCard.difficulty === 'beginner' ? 1 : existingCard.difficulty === 'intermediate' ? 2 : existingCard.difficulty === 'advanced' ? 3 : 4),
        importance: data.importance ? (data.importance === 'low' ? 1 : data.importance === 'medium' ? 2 : data.importance === 'high' ? 3 : 4) : (existingCard.importance === 'low' ? 1 : existingCard.importance === 'medium' ? 2 : existingCard.importance === 'high' ? 3 : 4),
      };

      await api.updateCard(numericId, cardDto);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: cardKeys.lists() });
      const previousCards = queryClient.getQueryData<Question[]>(cardKeys.lists());
      queryClient.setQueryData<Question[]>(cardKeys.lists(), (old) => {
        if (!old) return [];
        return old.map((q) => q.id === id ? { ...q, ...data, question: data.question !== undefined ? data.question : q.question, updatedAt: new Date() } : q);
      });
      return { previousCards };
    },
    onError: (err, newData, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(cardKeys.lists(), context.previousCards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });

  const addCard = useMutation({
    mutationFn: async ({ topicId, data }: { topicId: string, data: Partial<Question> }) => {
      const available = await isApiAvailable();
      if (!available) throw new Error("API unavailable");
      const numericTopicId = parseInt(topicId.replace(/\D/g, ''));
      const cardDto: Omit<CardDto, 'id'> = {
        question: data.question || '',
        answer: data.answer || '',
        topicId: numericTopicId,
        difficulty: data.difficulty === 'beginner' ? 1 : data.difficulty === 'intermediate' ? 2 : data.difficulty === 'advanced' ? 3 : 4,
        importance: data.importance === 'low' ? 1 : data.importance === 'medium' ? 2 : data.importance === 'high' ? 3 : 4,
      };
      await api.createCard(cardDto as CardDto);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });

  return {
    deleteCard: deleteCard.mutateAsync,
    updateCard: updateCard.mutateAsync,
    addCard: addCard.mutateAsync,
  };
};