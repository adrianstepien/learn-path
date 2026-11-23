import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as languagesApi from '@/lib/api/languages';
import {
  CreateCustomVocabRequest,
  GenerateFlashcardAiRequest,
  SaveVocabFlashcardRequest,
  VocabListParams,
} from '@/lib/api/languages';
import { analyticsKeys } from './useAnalyticsSummary';

export const languageKeys = {
  all: ['languages'] as const,
  list: () => [...languageKeys.all, 'list'] as const,
  vocabAll: (langCode: string) =>
    [...languageKeys.all, langCode.toUpperCase(), 'vocab'] as const,
  vocabList: (langCode: string, params: VocabListParams) =>
    [...languageKeys.vocabAll(langCode), params] as const,
  vocabFlashcards: (vocabId: number) =>
    [...languageKeys.all, 'vocab-flashcards', vocabId] as const,
};

export const useLanguages = () => {
  return useQuery({
    queryKey: languageKeys.list(),
    queryFn: languagesApi.getLanguages,
    staleTime: 60_000,
  });
};

export const useLanguageVocab = (langCode: string, params: VocabListParams) => {
  return useQuery({
    queryKey: languageKeys.vocabList(langCode, params),
    queryFn: () => languagesApi.getLanguageVocab(langCode, params),
    enabled: Boolean(langCode),
    placeholderData: keepPreviousData,
  });
};

export const useVocabFlashcards = (vocabId: number | null, enabled: boolean) => {
  return useQuery({
    queryKey: languageKeys.vocabFlashcards(vocabId ?? -1),
    queryFn: () => languagesApi.getFlashcardsForVocab(vocabId!),
    enabled: enabled && vocabId !== null,
    refetchOnWindowFocus: false,
  });
};

export const useLanguageVocabMutations = (langCode: string) => {
  const queryClient = useQueryClient();

  const invalidateVocabAndSummary = (vocabId?: number) => {
    queryClient.invalidateQueries({ queryKey: languageKeys.vocabAll(langCode) });
    queryClient.invalidateQueries({ queryKey: languageKeys.list() });
    queryClient.invalidateQueries({ queryKey: analyticsKeys.summary() });
    if (vocabId !== undefined) {
      queryClient.invalidateQueries({ queryKey: languageKeys.vocabFlashcards(vocabId) });
    }
  };

  const createFlashcard = useMutation({
    mutationFn: (payload: SaveVocabFlashcardRequest) =>
      languagesApi.createVocabFlashcard(payload),
    onSuccess: (created) => invalidateVocabAndSummary(created.vocabId),
  });

  const updateFlashcard = useMutation({
    mutationFn: ({
      flashcardId,
      payload,
    }: {
      flashcardId: number;
      payload: SaveVocabFlashcardRequest;
    }) => languagesApi.updateVocabFlashcard(flashcardId, payload),
    onSuccess: (updated) => invalidateVocabAndSummary(updated.vocabId),
  });

  const deleteFlashcard = useMutation({
    mutationFn: ({ flashcardId }: { flashcardId: number; vocabId: number }) =>
      languagesApi.deleteVocabFlashcard(flashcardId),
    onSuccess: (_, variables) => invalidateVocabAndSummary(variables.vocabId),
  });

  const deleteAllFlashcardsForVocab = useMutation({
    mutationFn: (vocabId: number) => languagesApi.deleteAllFlashcardsForVocab(vocabId),
    onSuccess: (_, vocabId) => invalidateVocabAndSummary(vocabId),
  });

  const toggleKnown = useMutation({
    mutationFn: ({ vocabId, known }: { vocabId: number; known: boolean }) =>
      languagesApi.setVocabKnown(vocabId, known),
    onSuccess: (_, variables) => invalidateVocabAndSummary(variables.vocabId),
  });

  const createCustomWord = useMutation({
    mutationFn: (payload: CreateCustomVocabRequest) =>
      languagesApi.createCustomVocab(langCode, payload),
    onSuccess: () => invalidateVocabAndSummary(),
  });

  const deleteCustomWord = useMutation({
    mutationFn: (vocabId: number) => languagesApi.deleteCustomVocab(vocabId),
    onSuccess: () => invalidateVocabAndSummary(),
  });

  const generateDraftAi = useMutation({
    mutationFn: (payload: GenerateFlashcardAiRequest) =>
      languagesApi.generateFlashcardDraftWithAi(payload),
  });

  const generateExtraSentence = useMutation({
    mutationFn: ({ flashcardId }: { flashcardId: number; vocabId: number }) =>
      languagesApi.generateExtraSentenceWithAi(flashcardId),
    onSuccess: (_, { vocabId }) => {
      queryClient.invalidateQueries({ queryKey: languageKeys.vocabFlashcards(vocabId) });
    },
  });

  return {
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    deleteAllFlashcardsForVocab,
    toggleKnown,
    createCustomWord,
    deleteCustomWord,
    generateDraftAi,
    generateExtraSentence,
  };
};