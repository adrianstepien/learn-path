import { apiRequest } from './config';
import { SessionStatus, StudyMode } from './types';
import { ReviewRating } from '@/types/learning';
import { languagesMockApi } from './languages.mock';

const USE_MOCK_LANGUAGES = import.meta.env.VITE_MOCK_LANGUAGES === 'true';

export type VocabOriginFilter = 'ALL' | 'DICTIONARY' | 'CUSTOM';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type VocabLearningStatus = 'ALL' | 'NOT_STARTED' | 'LEARNING' | 'KNOWN';

export interface LanguageSummaryDto {
  code: string;
  name: string;
  description: string;
  dueCards: number;
  activeFlashcards: number;
  knownWords: number;
  totalCatalogWords: number;
}

export interface VocabRowDto {
  id: number;
  languageCode: string;
  lemma: string;
  cefr: CefrLevel | null;
  pos: string | null;
  posCefrDetails: string | null;
  ipa: string | null;
  exampleHint: string | null;
  isCustom: boolean;
  isKnown: boolean;
  flashcardCount: number;
  primaryFlashcardId: number | null;
  nativeMeaningPreview: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface VocabListParams {
  page?: number;
  size?: number;
  q?: string;
  origin?: VocabOriginFilter;
  cefr?: CefrLevel | 'ALL';
  status?: VocabLearningStatus;
}

export interface VocabSentenceDto {
  id?: number;
  sentenceNative: string;
  sentenceTarget: string;
  clozeTarget?: string | null;
}

export interface VocabFlashcardDto {
  id: number;
  vocabId: number;
  languageCode: string;
  targetWord: string;
  nativeMeaning: string;
  hint?: string | null;
  ipa?: string | null;
  trapNote?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  sentences: VocabSentenceDto[];
}

export interface SaveVocabFlashcardRequest {
  vocabId: number;
  targetWord: string;
  nativeMeaning: string;
  hint?: string | null;
  ipa?: string | null;
  trapNote?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  sentences: VocabSentenceDto[];
}

export interface GenerateFlashcardAiRequest {
  languageCode: string;
  vocabId?: number;
  targetWord?: string;
}

export interface GeneratedFlashcardDraftDto {
  nativeMeaning: string;
  hint?: string | null;
  ipa?: string | null;
  trapNote?: string | null;
  sentences: VocabSentenceDto[];
}

export interface CreateCustomVocabRequest {
  lemma: string;
  pos?: string;
  cefr?: CefrLevel;
  ipa?: string;
}

export interface LanguageStudyCardDto {
  flashcardId: number;
  vocabId: number;
  targetWord: string;
  nativeMeaning: string;
  hint?: string | null;
  ipa?: string | null;
  trapNote?: string | null;
  imageUrl?: string | null;
  cefr?: CefrLevel | null;
  isCustom: boolean;
  sentence: VocabSentenceDto | null;
}

export interface LanguageStudySessionResponseDto {
  sessionId: number;
  cards: LanguageStudyCardDto[];
}

export interface LanguageReviewRequestDto {
  flashcardId: number;
  sessionId: number;
  rating: ReviewRating;
  reviewStartedAt?: string;
  answerShownAt?: string;
}

const languagesHttpApi = {
  getLanguages: () => apiRequest<LanguageSummaryDto[]>('/languages'),

  getLanguageVocab: (langCode: string, params: VocabListParams = {}) => {
    const cleanParams: Record<string, string | number> = {
      page: params.page ?? 0,
      size: params.size ?? 25,
    };
    if (params.q?.trim()) cleanParams.q = params.q.trim();
    if (params.origin && params.origin !== 'ALL') cleanParams.origin = params.origin;
    if (params.cefr && params.cefr !== 'ALL') cleanParams.cefr = params.cefr;
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;

    return apiRequest<PageResponse<VocabRowDto>>(
      `/languages/${langCode.toUpperCase()}/vocab`,
      { params: cleanParams }
    );
  },

  createCustomVocab: (langCode: string, payload: CreateCustomVocabRequest) =>
    apiRequest<VocabRowDto>(`/languages/${langCode.toUpperCase()}/vocab`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteCustomVocab: (vocabId: number) =>
    apiRequest<void>(`/languages/vocab/${vocabId}`, { method: 'DELETE' }),

  setVocabKnown: (vocabId: number, known: boolean) =>
    apiRequest<void>(`/languages/vocab/${vocabId}/known`, {
      method: known ? 'PUT' : 'DELETE',
    }),

  getFlashcardsForVocab: (vocabId: number) =>
    apiRequest<VocabFlashcardDto[]>(`/languages/vocab/${vocabId}/flashcards`),

  deleteAllFlashcardsForVocab: (vocabId: number) =>
    apiRequest<void>(`/languages/vocab/${vocabId}/flashcards`, { method: 'DELETE' }),

  createVocabFlashcard: (payload: SaveVocabFlashcardRequest) =>
    apiRequest<VocabFlashcardDto>('/languages/flashcards', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateVocabFlashcard: (flashcardId: number, payload: SaveVocabFlashcardRequest) =>
    apiRequest<VocabFlashcardDto>(`/languages/flashcards/${flashcardId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteVocabFlashcard: (flashcardId: number) =>
    apiRequest<void>(`/languages/flashcards/${flashcardId}`, { method: 'DELETE' }),

  generateFlashcardDraftWithAi: (payload: GenerateFlashcardAiRequest) =>
    apiRequest<GeneratedFlashcardDraftDto>('/languages/ai/generate-flashcard', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  generateExtraSentenceWithAi: (flashcardId: number) =>
    apiRequest<VocabSentenceDto>(
      `/languages/flashcards/${flashcardId}/sentences/generate`,
      { method: 'POST' }
    ),

  startLanguageStudySession: (langCode: string, mode: StudyMode = StudyMode.SRS) =>
    apiRequest<LanguageStudySessionResponseDto>(
      `/languages/${langCode.toUpperCase()}/sessions`,
      { method: 'POST', body: JSON.stringify({ mode }) }
    ),

  updateLanguageStudySession: (sessionId: number, sessionStatus: SessionStatus) =>
    apiRequest<void>(`/languages/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ sessionStatus }),
    }),

  createLanguageReview: (payload: LanguageReviewRequestDto) =>
    apiRequest<void>('/languages/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

const client = USE_MOCK_LANGUAGES ? languagesMockApi : languagesHttpApi;

export const getLanguages = client.getLanguages;
export const getLanguageVocab = client.getLanguageVocab;
export const createCustomVocab = client.createCustomVocab;
export const deleteCustomVocab = client.deleteCustomVocab;
export const setVocabKnown = client.setVocabKnown;
export const getFlashcardsForVocab = client.getFlashcardsForVocab;
export const deleteAllFlashcardsForVocab = client.deleteAllFlashcardsForVocab;
export const createVocabFlashcard = client.createVocabFlashcard;
export const updateVocabFlashcard = client.updateVocabFlashcard;
export const deleteVocabFlashcard = client.deleteVocabFlashcard;
export const generateFlashcardDraftWithAi = client.generateFlashcardDraftWithAi;
export const generateExtraSentenceWithAi = client.generateExtraSentenceWithAi;
export const startLanguageStudySession = client.startLanguageStudySession;
export const updateLanguageStudySession = client.updateLanguageStudySession;
export const createLanguageReview = client.createLanguageReview;