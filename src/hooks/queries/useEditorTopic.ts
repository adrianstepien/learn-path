import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as api from '@/lib/api';
import type { Question, Resource } from '@/types/learning';
import type {
  TopicDetailsDto,
  NoteDto,
  ArticleDto,
  VideoDto,
  CardDto,
} from '@/lib/api/types';
import { editorKeys } from './editorQueryKeys';
import {
  mapArticleToResource,
  mapCardDtoToQuestion,
  mapNoteToResource,
  mapVideoToResource,
  parseNumericId,
} from '@/domain/editorMappers';

interface TopicDetails {
  resources: Resource[];
  questions: Question[];
}

export const useEditorTopic = (topicId: string | null | undefined) => {
  const numericId = topicId ? parseNumericId(topicId) : 0;

  return useQuery<TopicDetails>({
    queryKey: editorKeys.topicDetails(topicId || 'unknown'),
    enabled: !!numericId,
    queryFn: async () => {
      try {
        const details: TopicDetailsDto = await api.getTopicById(numericId);

        const resources: Resource[] = [
          ...(details.notes || ([] as NoteDto[])).map(mapNoteToResource),
          ...(details.articles || ([] as ArticleDto[])).map(
            mapArticleToResource,
          ),
          ...(details.videos || ([] as VideoDto[])).map(mapVideoToResource),
        ];

        const questions: Question[] = (details.cards || ([] as CardDto[])).map(
          (c) => mapCardDtoToQuestion(c, String(topicId)),
        );

        return { resources, questions };
      } catch (error) {
        console.error('Failed to load topic details', error);
        toast.error('Nie udało się załadować szczegółów tematu');
        throw error;
      }
    },
  });
};

// ===== Mutations: Questions =====

interface AddQuestionPayload {
  topicId: string;
  question: Omit<
    Question,
    'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'
  >;
}

export const useAddQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ topicId, question }: AddQuestionPayload) => {
      const numericTopicId = parseNumericId(topicId);

      const cardDto: CardDto = {
        question: question.content,
        answer: question.answer,
        difficulty:
          question.difficulty === 'beginner'
            ? 1
            : question.difficulty === 'intermediate'
            ? 2
            : question.difficulty === 'advanced'
            ? 3
            : 4,
        importance:
          question.importance === 'low'
            ? 1
            : question.importance === 'medium'
            ? 2
            : question.importance === 'high'
            ? 3
            : 4,
        topicId: numericTopicId,
      };

      await api.createCard(cardDto);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topicDetails(variables.topicId),
      });
    },
    onError: (error) => {
      console.error('Failed to create card', error);
      toast.error('Nie udało się dodać pytania');
    },
  });
};

interface UpdateQuestionPayload {
  topicId: string;
  questionId: string;
  updates: Partial<Question>;
}

export const useUpdateQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topicId,
      questionId,
      updates,
    }: UpdateQuestionPayload) => {
      const numericId = parseNumericId(questionId);
      const details = queryClient.getQueryData<TopicDetails>(
        editorKeys.topicDetails(topicId),
      );

      const existing = details?.questions.find((q) => q.id === questionId);
      if (!existing) return;

      const cardDto: CardDto = {
        id: numericId,
        question: updates.content || existing.content,
        answer: updates.answer || existing.answer,
        difficulty:
          (updates.difficulty || existing.difficulty) === 'beginner'
            ? 1
            : (updates.difficulty || existing.difficulty) === 'intermediate'
            ? 2
            : (updates.difficulty || existing.difficulty) === 'advanced'
            ? 3
            : 4,
        importance:
          (updates.importance || existing.importance) === 'low'
            ? 1
            : (updates.importance || existing.importance) === 'medium'
            ? 2
            : (updates.importance || existing.importance) === 'high'
            ? 3
            : 4,
        topicId: parseNumericId(topicId),
      };

      await api.updateCard(numericId, cardDto);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topicDetails(variables.topicId),
      });
    },
    onError: (error) => {
      console.error('Failed to update card', error);
      toast.error('Nie udało się zaktualizować pytania');
    },
  });
};

interface DeleteQuestionPayload {
  topicId: string;
  questionId: string;
}

export const useDeleteQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId }: DeleteQuestionPayload) => {
      const numericId = parseNumericId(questionId);
      await api.deleteCard(numericId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topicDetails(variables.topicId),
      });
    },
    onError: (error) => {
      console.error('Failed to delete card', error);
      toast.error('Nie udało się usunąć pytania');
    },
  });
};

// ===== Mutations: Resources =====

interface AddResourcePayload {
  topicId: string;
  resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>;
}

export const useAddResourceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ topicId, resource }: AddResourcePayload) => {
      const numericTopicId = parseNumericId(topicId);

      if (resource.type === 'note') {
        const noteDto: NoteDto = {
          title: resource.title,
          description: resource.content || '',
          topicId: numericTopicId,
        };
        await api.createNote(noteDto);
      } else if (resource.type === 'article') {
        const articleDto: ArticleDto = {
          description: resource.title,
          url: resource.url || '',
          topicId: numericTopicId,
        };
        await api.createArticle(articleDto);
      } else if (resource.type === 'video') {
        const videoDto: VideoDto = {
          description: resource.title,
          url: resource.url || '',
          topicId: numericTopicId,
        };
        await api.createVideo(videoDto);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topicDetails(variables.topicId),
      });
    },
    onError: (error) => {
      console.error('Failed to create resource', error);
      toast.error('Nie udało się dodać materiału');
    },
  });
};

interface UpdateResourcePayload {
  topicId: string;
  resourceId: string;
  updates: Partial<Resource>;
}

export const useUpdateResourceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topicId,
      resourceId,
      updates,
    }: UpdateResourcePayload) => {
      const numericId = parseNumericId(resourceId);

      const details = queryClient.getQueryData<TopicDetails>(
        editorKeys.topicDetails(topicId),
      );

      const found = details?.resources.find((r) => r.id === resourceId);
      if (!found) return;

      const type = updates.type || found.type;
      const tId = parseNumericId(updates.topicId || found.topicId);

      if (type === 'note') {
        const noteDto: NoteDto = {
          title: updates.title || found.title,
          description: updates.content || found.content || '',
          topicId: tId,
        };
        await api.updateNote(numericId, noteDto);
      } else if (type === 'article') {
        const articleDto: ArticleDto = {
          description: updates.title || found.title,
          url: updates.url || found.url || '',
          topicId: tId,
        };
        await api.updateArticle(numericId, articleDto);
      } else if (type === 'video') {
        const videoDto: VideoDto = {
          description: updates.title || found.title,
          url: updates.url || found.url || '',
          topicId: tId,
        };
        await api.updateVideo(numericId, videoDto);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topicDetails(variables.topicId),
      });
    },
    onError: (error) => {
      console.error('Failed to update resource', error);
      toast.error('Nie udało się zaktualizować materiału');
    },
  });
};

interface DeleteResourcePayload {
  topicId: string;
  resourceId: string;
}

export const useDeleteResourceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ topicId, resourceId }: DeleteResourcePayload) => {
      const numericId = parseNumericId(resourceId);

      const details = queryClient.getQueryData<TopicDetails>(
        editorKeys.topicDetails(topicId),
      );
      const found = details?.resources.find((r) => r.id === resourceId);
      if (!found) return;

      if (found.type === 'note') {
        await api.deleteNote(numericId);
      } else if (found.type === 'article') {
        await api.deleteArticle(numericId);
      } else if (found.type === 'video') {
        await api.deleteVideo(numericId);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: editorKeys.topicDetails(variables.topicId),
      });
    },
    onError: (error) => {
      console.error('Failed to delete resource', error);
      toast.error('Nie udało się usunąć materiału');
    },
  });
};

