import { apiRequest } from './config';
import { SessionStatus, StudyMode } from './types';
import { ReviewRating } from '@/types/learning';
import { languagesMockApi } from './languages.mock';

const USE_MOCK_LANGUAGES = import.meta.env.VITE_MOCK_LANGUAGES === 'true';

export type VocabSource =
  | 'NGSL'
  | 'NGSL_SPOKEN'
  | 'PHAVE'
  | 'NAWL'
  | 'OXFORD_3000'
  | 'OXFORD_5000'
  | 'BSL'
  | 'CUSTOM';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type VocabLearningStatus = 'ALL' | 'NOT_STARTED' | 'LEARNING' | 'KNOWN';

export interface LanguageSummaryDto {
  code: string;              // np. 'EN', 'ES'
  name: string;              // np. 'Angielski'
  description: string;       // np. 'PL → EN · NGSL, PHaVE, Oxford'
  flag: string;              // np. '🇺🇸' lub '🇬🇧'
  dueCards: number;          // fiszki do powtórki dziś
  activeFlashcards: number;  // fiszki w nauce (FSRS-6)
  knownWords: number;        // oznaczone jako znane
  totalCatalogWords: number; // wszystkie słówka w katalogu
}

export interface VocabRowDto {
  id: number;
  languageCode: string;
  lemma: string;
  primarySource: VocabSource;
  cefr: CefrLevel | null;
  pos: string | null;
  posCefrDetails: string | null;
  ipa: string | null;
  exampleHint: string | null;
  isCustom: boolean;         // true => owner_user_id != null (można usunąć z katalogu)
  isKnown: boolean;
  flashcardCount: number;    // 0 => pokaż "Dodaj do nauki", >0 => "Pokaż fiszkę" + "Usuń z nauki"
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
  source?: VocabSource | 'ALL';
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
  vocabId: number;
}

export interface GeneratedFlashcardDraftDto {
  nativeMeaning: string;
  hint?: string | null;
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
  primarySource: VocabSource;
  sentence: VocabSentenceDto | null; // zdanie wybrane rotacyjnie po last_shown_at
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

// ===== JĘZYKI I KATALOG =====

export async function getLanguages(): Promise<LanguageSummaryDto[]> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.getLanguages();
  return apiRequest<LanguageSummaryDto[]>('/languages');
}

export async function getLanguageVocab(
  langCode: string,
  params: VocabListParams = {}
): Promise<PageResponse<VocabRowDto>> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.getLanguageVocab(langCode, params);

  const cleanParams: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 25,
  };
  if (params.q?.trim()) cleanParams.q = params.q.trim();
  if (params.source && params.source !== 'ALL') cleanParams.source = params.source;
  if (params.cefr && params.cefr !== 'ALL') cleanParams.cefr = params.cefr;
  if (params.status && params.status !== 'ALL') cleanParams.status = params.status;

  return apiRequest<PageResponse<VocabRowDto>>(
    `/languages/${langCode.toUpperCase()}/vocab`,
    { params: cleanParams }
  );
}

export async function createCustomVocab(
  langCode: string,
  payload: CreateCustomVocabRequest
): Promise<VocabRowDto> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.createCustomVocab(langCode, payload);
  return apiRequest<VocabRowDto>(`/languages/${langCode.toUpperCase()}/vocab`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomVocab(vocabId: number): Promise<void> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.deleteCustomVocab(vocabId);
  return apiRequest<void>(`/languages/vocab/${vocabId}`, {
    method: 'DELETE',
  });
}

export async function setVocabKnown(vocabId: number, known: boolean): Promise<void> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.setVocabKnown(vocabId, known);
  return apiRequest<void>(`/languages/vocab/${vocabId}/known`, {
    method: known ? 'PUT' : 'DELETE',
  });
}

// ===== FISZKI (DODAJ DO NAUKI / POKAŻ FISZKĘ / USUŃ Z NAUKI) =====

export async function getFlashcardsForVocab(vocabId: number): Promise<VocabFlashcardDto[]> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.getFlashcardsForVocab(vocabId);
  return apiRequest<VocabFlashcardDto[]>(`/languages/vocab/${vocabId}/flashcards`);
}

export async function createVocabFlashcard(
  payload: SaveVocabFlashcardRequest
): Promise<VocabFlashcardDto> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.createVocabFlashcard(payload);
  return apiRequest<VocabFlashcardDto>('/languages/flashcards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateVocabFlashcard(
  flashcardId: number,
  payload: SaveVocabFlashcardRequest
): Promise<VocabFlashcardDto> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.updateVocabFlashcard(flashcardId, payload);
  return apiRequest<VocabFlashcardDto>(`/languages/flashcards/${flashcardId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteVocabFlashcard(flashcardId: number): Promise<void> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.deleteVocabFlashcard(flashcardId);
  return apiRequest<void>(`/languages/flashcards/${flashcardId}`, {
    method: 'DELETE',
  });
}

// ===== AI (GENERACJA DO MODALU + KOLEJNE ZDANIA) =====

export async function generateFlashcardDraftWithAi(
  payload: GenerateFlashcardAiRequest
): Promise<GeneratedFlashcardDraftDto> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.generateFlashcardDraftWithAi(payload);
  return apiRequest<GeneratedFlashcardDraftDto>('/languages/ai/generate-flashcard', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateExtraSentenceWithAi(
  flashcardId: number
): Promise<VocabSentenceDto> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.generateExtraSentenceWithAi(flashcardId);
  return apiRequest<VocabSentenceDto>(
    `/languages/flashcards/${flashcardId}/sentences/generate`,
    { method: 'POST' }
  );
}

// ===== SESJE FSRS-6 =====

export async function startLanguageStudySession(
  langCode: string,
  mode: StudyMode = StudyMode.SRS
): Promise<LanguageStudySessionResponseDto> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.startLanguageStudySession(langCode, mode);
  return apiRequest<LanguageStudySessionResponseDto>(
    `/languages/${langCode.toUpperCase()}/sessions`,
    {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }
  );
}

export async function updateLanguageStudySession(
  sessionId: number,
  sessionStatus: SessionStatus
): Promise<void> {
  if (USE_MOCK_LANGUAGES) {
    return languagesMockApi.updateLanguageStudySession(sessionId, sessionStatus);
  }
  return apiRequest<void>(`/languages/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ sessionStatus }),
  });
}

export async function createLanguageReview(
  payload: LanguageReviewRequestDto
): Promise<void> {
  if (USE_MOCK_LANGUAGES) return languagesMockApi.createLanguageReview(payload);
  return apiRequest<void>('/languages/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}