import { SessionStatus, StudyMode } from './types';
import {
  CreateCustomVocabRequest,
  GenerateFlashcardAiRequest,
  GeneratedFlashcardDraftDto,
  LanguageReviewRequestDto,
  LanguageStudyCardDto,
  LanguageStudySessionResponseDto,
  LanguageSummaryDto,
  PageResponse,
  SaveVocabFlashcardRequest,
  VocabFlashcardDto,
  VocabListParams,
  VocabRowDto,
  VocabSentenceDto,
} from './languages';

const delay = (ms = 200) => new Promise((res) => setTimeout(res, ms));

let nextVocabId = 100;
let nextFlashcardId = 100;
let nextSentenceId = 100;

interface MockVocabItem {
  id: number;
  languageCode: string;
  lemma: string;
  primarySource: VocabRowDto['primarySource'];
  cefr: VocabRowDto['cefr'];
  pos: string | null;
  posCefrDetails: string | null;
  ipa: string | null;
  exampleHint: string | null;
  isCustom: boolean;
  isKnown: boolean;
}

let vocabStore: MockVocabItem[] = [
  {
    id: 1,
    languageCode: 'EN',
    lemma: 'postpone',
    primarySource: 'OXFORD_3000',
    cefr: 'B2',
    pos: 'verb',
    posCefrDetails: 'verb:B2',
    ipa: '/poʊstˈpoʊn/',
    exampleHint: null,
    isCustom: false,
    isKnown: false,
  },
  {
    id: 2,
    languageCode: 'EN',
    lemma: 'work out',
    primarySource: 'PHAVE',
    cefr: 'A2',
    pos: 'phrasal verb',
    posCefrDetails: null,
    ipa: '/wɜːrk aʊt/',
    exampleHint: 'exercise; find a solution or calculate; develop successfully',
    isCustom: false,
    isKnown: false,
  },
  {
    id: 3,
    languageCode: 'EN',
    lemma: 'abandon',
    primarySource: 'NGSL',
    cefr: 'B2',
    pos: 'verb',
    posCefrDetails: 'verb:B2',
    ipa: '/əˈbændən/',
    exampleHint: null,
    isCustom: false,
    isKnown: false,
  },
  {
    id: 4,
    languageCode: 'EN',
    lemma: 'allocate',
    primarySource: 'NAWL',
    cefr: 'C1',
    pos: 'verb',
    posCefrDetails: 'verb:C1',
    ipa: '/ˈæləkeɪt/',
    exampleHint: null,
    isCustom: false,
    isKnown: false,
  },
  {
    id: 5,
    languageCode: 'EN',
    lemma: 'water',
    primarySource: 'NGSL',
    cefr: 'A1',
    pos: 'noun, verb',
    posCefrDetails: 'noun:A1; verb:B1',
    ipa: '/ˈwɔːtər/',
    exampleHint: null,
    isCustom: false,
    isKnown: true,
  },
  {
    id: 6,
    languageCode: 'EN',
    lemma: 'boilerplate',
    primarySource: 'CUSTOM',
    cefr: 'B2',
    pos: 'noun',
    posCefrDetails: null,
    ipa: '/ˈbɔɪlərpleɪt/',
    exampleHint: null,
    isCustom: true,
    isKnown: false,
  },
];

let flashcardStore: VocabFlashcardDto[] = [
  {
    id: 10,
    vocabId: 1,
    languageCode: 'EN',
    targetWord: 'postpone',
    nativeMeaning: 'odłożyć na później (termin/spotkanie)',
    hint: 'p...',
    ipa: '/poʊstˈpoʊn/',
    trapNote: 'Łączy się z gerundium: postpone doing sth (nie "to do").',
    imageUrl: null,
    sentences: [
      {
        id: 1,
        sentenceNative: 'Musieliśmy **odłożyć** wdrożenie na przyszły tydzień.',
        sentenceTarget: 'We had to postpone the deployment until next week.',
        clozeTarget: 'We had to ________ the deployment until next week.',
      },
    ],
  },
  {
    id: 11,
    vocabId: 2,
    languageCode: 'EN',
    targetWord: 'work out',
    nativeMeaning: 'ćwiczyć (na siłowni)',
    hint: 'w... o...',
    ipa: '/wɜːrk aʊt/',
    trapNote: 'Bez dopełnienia = trenować; work sth out = rozwiązać coś.',
    imageUrl: null,
    sentences: [
      {
        id: 2,
        sentenceNative: 'Staram się **ćwiczyć** trzy razy w tygodniu.',
        sentenceTarget: 'I try to work out three times a week.',
        clozeTarget: 'I try to ________ three times a week.',
      },
    ],
  },
];

const dueFlashcardIds = new Set<number>([10, 11]);

export const languagesMockApi = {
  async getLanguages(): Promise<LanguageSummaryDto[]> {
    await delay();
    const enVocab = vocabStore.filter((v) => v.languageCode === 'EN');
    const enCards = flashcardStore.filter((f) => f.languageCode === 'EN');
    const dueCount = enCards.filter((f) => dueFlashcardIds.has(f.id)).length;

    return [
      {
        code: 'EN',
        name: 'Angielski',
        description: 'PL → EN · NGSL, PHaVE, NAWL, Oxford, BSL',
        flag: '🇺🇸',
        dueCards: dueCount,
        activeFlashcards: enCards.length,
        knownWords: enVocab.filter((v) => v.isKnown).length,
        totalCatalogWords: enVocab.length,
      },
    ];
  },

  async getLanguageVocab(
    langCode: string,
    params: VocabListParams = {}
  ): Promise<PageResponse<VocabRowDto>> {
    await delay();
    const code = langCode.toUpperCase();
    const q = params.q?.trim().toLowerCase() ?? '';

    const mapped: VocabRowDto[] = vocabStore
      .filter((v) => v.languageCode === code)
      .map((v) => {
        const cards = flashcardStore.filter((f) => f.vocabId === v.id);
        return {
          ...v,
          flashcardCount: cards.length,
          primaryFlashcardId: cards[0]?.id ?? null,
          nativeMeaningPreview: cards[0]?.nativeMeaning ?? null,
        };
      })
      .filter((row) => {
        if (params.source && params.source !== 'ALL' && row.primarySource !== params.source) {
          return false;
        }
        if (params.cefr && params.cefr !== 'ALL' && row.cefr !== params.cefr) {
          return false;
        }
        if (params.status === 'LEARNING' && row.flashcardCount === 0) return false;
        if (params.status === 'KNOWN' && !row.isKnown) return false;
        if (params.status === 'NOT_STARTED' && (row.flashcardCount > 0 || row.isKnown)) {
          return false;
        }
        if (q) {
          const hay = `${row.lemma} ${row.nativeMeaningPreview ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    const page = params.page ?? 0;
    const size = params.size ?? 25;
    const start = page * size;

    return {
      content: mapped.slice(start, start + size),
      page,
      size,
      totalElements: mapped.length,
      totalPages: Math.max(1, Math.ceil(mapped.length / size)),
    };
  },

  async createCustomVocab(
    langCode: string,
    payload: CreateCustomVocabRequest
  ): Promise<VocabRowDto> {
    await delay();
    const item: MockVocabItem = {
      id: ++nextVocabId,
      languageCode: langCode.toUpperCase(),
      lemma: payload.lemma.trim().toLowerCase(),
      primarySource: 'CUSTOM',
      cefr: payload.cefr ?? null,
      pos: payload.pos ?? null,
      posCefrDetails: null,
      ipa: payload.ipa ?? null,
      exampleHint: null,
      isCustom: true,
      isKnown: false,
    };
    vocabStore = [item, ...vocabStore];
    return {
      ...item,
      flashcardCount: 0,
      primaryFlashcardId: null,
      nativeMeaningPreview: null,
    };
  },

  async deleteCustomVocab(vocabId: number): Promise<void> {
    await delay();
    vocabStore = vocabStore.filter((v) => !(v.id === vocabId && v.isCustom));
    flashcardStore = flashcardStore.filter((f) => f.vocabId !== vocabId);
  },

  async setVocabKnown(vocabId: number, known: boolean): Promise<void> {
    await delay(100);
    vocabStore = vocabStore.map((v) => (v.id === vocabId ? { ...v, isKnown: known } : v));
  },

  async getFlashcardsForVocab(vocabId: number): Promise<VocabFlashcardDto[]> {
    await delay(150);
    return flashcardStore.filter((f) => f.vocabId === vocabId);
  },

  async createVocabFlashcard(payload: SaveVocabFlashcardRequest): Promise<VocabFlashcardDto> {
    await delay();
    const vocab = vocabStore.find((v) => v.id === payload.vocabId);
    const created: VocabFlashcardDto = {
      id: ++nextFlashcardId,
      vocabId: payload.vocabId,
      languageCode: vocab?.languageCode ?? 'EN',
      targetWord: payload.targetWord,
      nativeMeaning: payload.nativeMeaning,
      hint: payload.hint ?? null,
      ipa: payload.ipa ?? null,
      trapNote: payload.trapNote ?? null,
      imageUrl: payload.imageUrl ?? null,
      sentences: payload.sentences.map((s) => ({ ...s, id: s.id ?? ++nextSentenceId })),
    };
    flashcardStore = [...flashcardStore, created];
    dueFlashcardIds.add(created.id);
    return created;
  },

  async updateVocabFlashcard(
    flashcardId: number,
    payload: SaveVocabFlashcardRequest
  ): Promise<VocabFlashcardDto> {
    await delay();
    let updated!: VocabFlashcardDto;
    flashcardStore = flashcardStore.map((f) => {
      if (f.id !== flashcardId) return f;
      updated = {
        ...f,
        targetWord: payload.targetWord,
        nativeMeaning: payload.nativeMeaning,
        hint: payload.hint ?? null,
        ipa: payload.ipa ?? null,
        trapNote: payload.trapNote ?? null,
        imageUrl: payload.imageUrl ?? null,
        sentences: payload.sentences.map((s) => ({ ...s, id: s.id ?? ++nextSentenceId })),
      };
      return updated;
    });
    return updated;
  },

  async deleteVocabFlashcard(flashcardId: number): Promise<void> {
    await delay();
    flashcardStore = flashcardStore.filter((f) => f.id !== flashcardId);
    dueFlashcardIds.delete(flashcardId);
  },

  async generateFlashcardDraftWithAi(
    payload: GenerateFlashcardAiRequest
  ): Promise<GeneratedFlashcardDraftDto> {
    await delay(500);
    const vocab = vocabStore.find((v) => v.id === payload.vocabId);
    const word = vocab?.lemma ?? 'word';
    return {
      nativeMeaning: `[AI] znaczenie słowa "${word}"`,
      hint: `${word[0]}...`,
      trapNote: `[AI] Przykładowa uwaga o użyciu "${word}".`,
      sentences: [
        {
          sentenceNative: `To jest przykładowe zdanie ze słowem **${word}** wygenerowane przez mock AI.`,
          sentenceTarget: `This is a sample sentence using ${word} generated by mock AI.`,
          clozeTarget: `This is a sample sentence using ________ generated by mock AI.`,
        },
      ],
    };
  },

  async generateExtraSentenceWithAi(flashcardId: number): Promise<VocabSentenceDto> {
    await delay(500);
    const card = flashcardStore.find((f) => f.id === flashcardId);
    const word = card?.targetWord ?? 'word';
    const next: VocabSentenceDto = {
      id: ++nextSentenceId,
      sentenceNative: `[AI #${nextSentenceId}] Nowy kontekst użycia **${card?.nativeMeaning ?? word}**.`,
      sentenceTarget: `Here is another realistic context for ${word}.`,
      clozeTarget: `Here is another realistic context for ________.`,
    };
    flashcardStore = flashcardStore.map((f) =>
      f.id === flashcardId ? { ...f, sentences: [...f.sentences, next] } : f
    );
    return next;
  },

  async startLanguageStudySession(
    langCode: string,
    mode: StudyMode = StudyMode.SRS
  ): Promise<LanguageStudySessionResponseDto> {
    await delay();
    const code = langCode.toUpperCase();
    const pool = flashcardStore.filter(
      (f) => f.languageCode === code && (mode === StudyMode.FUTURE || dueFlashcardIds.has(f.id))
    );

    const cards: LanguageStudyCardDto[] = pool.map((f) => {
      const vocab = vocabStore.find((v) => v.id === f.vocabId);
      return {
        flashcardId: f.id,
        vocabId: f.vocabId,
        targetWord: f.targetWord,
        nativeMeaning: f.nativeMeaning,
        hint: f.hint ?? null,
        ipa: f.ipa ?? null,
        trapNote: f.trapNote ?? null,
        imageUrl: f.imageUrl ?? null,
        cefr: vocab?.cefr ?? null,
        primarySource: vocab?.primarySource ?? 'CUSTOM',
        sentence: f.sentences[0] ?? null,
      };
    });

    return { sessionId: Date.now(), cards };
  },

  async updateLanguageStudySession(
    _sessionId: number,
    _sessionStatus: SessionStatus
  ): Promise<void> {
    await delay(100);
  },

  async createLanguageReview(payload: LanguageReviewRequestDto): Promise<void> {
    await delay(100);
    if (payload.rating !== 'AGAIN') {
      dueFlashcardIds.delete(payload.flashcardId);
    }
  },
};