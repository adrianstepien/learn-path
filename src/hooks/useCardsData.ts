import { useState, useCallback } from 'react';
import { Question } from '@/types/learning';
import * as api from '@/lib/api';
import { isApiAvailable } from '@/lib/api/config';
import { CardDto } from '@/lib/api/types';
import { mockCategories } from '@/data/mockData';

// ===== DTO to Domain Mapper =====

export const mapCardDtoToQuestion = (dto: CardDto): Question => ({
  id: String(dto.id),
  topicId: String(dto.topicId),
  type: 'open_ended',
  content: dto.question,
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

export const mapQuestionToCardDto = (question: Question): CardDto => ({
  id: question.id ? parseInt(question.id.replace(/\D/g, '')) || undefined : undefined,
  question: question.content,
  answer: question.answer,
  difficulty: question.difficulty === 'beginner' ? 1 : question.difficulty === 'intermediate' ? 2 : question.difficulty === 'advanced' ? 3 : 4,
  importance: question.importance === 'low' ? 1 : question.importance === 'medium' ? 2 : question.importance === 'high' ? 3 : 4,
  topicId: parseInt(question.topicId.replace(/\D/g, '')),
});

// Get all mock questions for fallback
const getAllMockQuestions = (): Question[] => {
  const questions: Question[] = [];
  for (const category of mockCategories) {
    for (const roadmap of category.roadmaps) {
      for (const topic of roadmap.topics) {
        questions.push(...topic.questions);
      }
    }
  }
  return questions;
};

interface UseCardsDataReturn {
  cards: Question[];
  isLoading: boolean;
  error: string | null;
  loadAllCards: () => Promise<void>;
  loadCardsForTopic: (topicId: string) => Promise<void>;
  loadCardsToRepeat: () => Promise<void>;
  loadCardsToRepeatByCategory: (categoryId: string) => Promise<void>;
  loadCardsToRepeatByRoadmap: (roadmapId: string) => Promise<void>;
  loadCardsToRepeatByTopic: (topicId: string) => Promise<void>;
  loadCardForStudy: (cardId: string) => Promise<Question | null>;
  createCard: (card: Omit<CardDto, 'id'>) => Promise<void>;
  updateCard: (id: string, card: CardDto) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
}

export const useCardsData = (): UseCardsDataReturn => {
  const [cards, setCards] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const cardDtos = await api.getCards();
        const mappedCards = cardDtos.map(mapCardDtoToQuestion);
        setCards(mappedCards);
      } else {
        // Fallback to mock data
        setCards(getAllMockQuestions());
      }
    } catch (err) {
      console.error('Failed to load cards:', err);
      setCards(getAllMockQuestions());
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCardsForTopic = useCallback(async (topicId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(topicId.replace(/\D/g, ''));
        const cardDtos = await api.getCardsInTopic(numericId);
        const mappedCards = cardDtos.map(mapCardDtoToQuestion);
        setCards(mappedCards);
      } else {
        // Fallback to mock data
        const allQuestions = getAllMockQuestions();
        setCards(allQuestions.filter(q => q.topicId === topicId));
      }
    } catch (err) {
      console.error('Failed to load cards for topic:', err);
      const allQuestions = getAllMockQuestions();
      setCards(allQuestions.filter(q => q.topicId === topicId));
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCardsToRepeat = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const cardDtos = await api.getCardsToRepeat();
        const mappedCards = cardDtos.map(mapCardDtoToQuestion);
        setCards(mappedCards);
      } else {
        setCards(getAllMockQuestions());
      }
    } catch (err) {
      console.error('Failed to load cards to repeat:', err);
      setCards(getAllMockQuestions());
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCardsToRepeatByCategory = useCallback(async (categoryId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(categoryId.replace(/\D/g, ''));
        const cardDtos = await api.getCardsToRepeatByCategory(numericId);
        const mappedCards = cardDtos.map(mapCardDtoToQuestion);
        setCards(mappedCards);
      } else {
        // Fallback - get questions from category
        const category = mockCategories.find(c => c.id === categoryId);
        const questions: Question[] = [];
        if (category) {
          for (const roadmap of category.roadmaps) {
            for (const topic of roadmap.topics) {
              questions.push(...topic.questions);
            }
          }
        }
        setCards(questions);
      }
    } catch (err) {
      console.error('Failed to load cards by category:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCardsToRepeatByRoadmap = useCallback(async (roadmapId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(roadmapId.replace(/\D/g, ''));
        const cardDtos = await api.getCardsToRepeatByRoadmap(numericId);
        const mappedCards = cardDtos.map(mapCardDtoToQuestion);
        setCards(mappedCards);
      } else {
        // Fallback - get questions from roadmap
        const questions: Question[] = [];
        for (const category of mockCategories) {
          const roadmap = category.roadmaps.find(r => r.id === roadmapId);
          if (roadmap) {
            for (const topic of roadmap.topics) {
              questions.push(...topic.questions);
            }
            break;
          }
        }
        setCards(questions);
      }
    } catch (err) {
      console.error('Failed to load cards by roadmap:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCardsToRepeatByTopic = useCallback(async (topicId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(topicId.replace(/\D/g, ''));
        const cardDtos = await api.getCardsToRepeatByTopic(numericId);
        const mappedCards = cardDtos.map(mapCardDtoToQuestion);
        setCards(mappedCards);
      } else {
        const allQuestions = getAllMockQuestions();
        setCards(allQuestions.filter(q => q.topicId === topicId));
      }
    } catch (err) {
      console.error('Failed to load cards by topic:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCardForStudy = useCallback(async (cardId: string): Promise<Question | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(cardId.replace(/\D/g, ''));
        const cardDto = await api.getCardForStudy(numericId);
        return mapCardDtoToQuestion(cardDto);
      } else {
        const allQuestions = getAllMockQuestions();
        return allQuestions.find(q => q.id === cardId) || null;
      }
    } catch (err) {
      console.error('Failed to load card for study:', err);
      setError(err instanceof Error ? err.message : 'Failed to load card');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCard = useCallback(async (card: Omit<CardDto, 'id'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        await api.createCard(card as CardDto);
        await loadAllCards(); // Refresh
      } else {
        // Local fallback - just add to state
        const newQuestion = mapCardDtoToQuestion({ ...card, id: Date.now() });
        setCards(prev => [...prev, newQuestion]);
      }
    } catch (err) {
      console.error('Failed to create card:', err);
      setError(err instanceof Error ? err.message : 'Failed to create card');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCards]);

  const updateCard = useCallback(async (id: string, card: CardDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(id.replace(/\D/g, ''));
        await api.updateCard(numericId, card);
        await loadAllCards(); // Refresh
      } else {
        // Local fallback
        setCards(prev => prev.map(c => 
          c.id === id ? mapCardDtoToQuestion({ ...card, id: parseInt(id) }) : c
        ));
      }
    } catch (err) {
      console.error('Failed to update card:', err);
      setError(err instanceof Error ? err.message : 'Failed to update card');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadAllCards]);

  const deleteCard = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(id.replace(/\D/g, ''));
        await api.deleteCard(numericId);
      }
      // Always remove from local state
      setCards(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete card:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete card');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    cards,
    isLoading,
    error,
    loadAllCards,
    loadCardsForTopic,
    loadCardsToRepeat,
    loadCardsToRepeatByCategory,
    loadCardsToRepeatByRoadmap,
    loadCardsToRepeatByTopic,
    loadCardForStudy,
    createCard,
    updateCard,
    deleteCard,
  };
};
