import { useState, useEffect, useCallback, useMemo } from 'react';
import { Category, Question, QuestionType, DifficultyLevel, ImportanceLevel } from '@/types/learning';
import { mockCategories } from '@/data/mockData';
import * as api from '@/lib/api';
import { isApiAvailable } from '@/lib/api/config';
import { CardDto } from '@/lib/api/types';

export interface QuestionWithContext extends Question {
  categoryId: string;
  categoryName: string;
  roadmapId: string;
  roadmapTitle: string;
  topicTitle: string;
}

export interface QuestionFilters {
  search: string;
  categoryId: string | null;
  roadmapId: string | null;
  topicId: string | null;
  type: QuestionType | null;
  difficulty: DifficultyLevel | null;
  importance: ImportanceLevel | null;
}

const initialFilters: QuestionFilters = {
  search: '',
  categoryId: null,
  roadmapId: null,
  topicId: null,
  type: null,
  difficulty: null,
  importance: null,
};

// ===== DTO Mappers =====

const mapCardDtoToQuestion = (dto: CardDto): Question => ({
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

const mapQuestionToCardDto = (question: Partial<Question>, topicId: string): Omit<CardDto, 'id'> => ({
  question: question.content || '',
  answer: question.answer || '',
  difficulty: question.difficulty === 'beginner' ? 1 : question.difficulty === 'intermediate' ? 2 : question.difficulty === 'advanced' ? 3 : 4,
  importance: question.importance === 'low' ? 1 : question.importance === 'medium' ? 2 : question.importance === 'high' ? 3 : 4,
  topicId: parseInt(topicId.replace(/\D/g, '')),
});

export const useQuestionBankStore = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [cards, setCards] = useState<Question[]>([]);
  const [filters, setFilters] = useState<QuestionFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiMode, setIsApiMode] = useState(false);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    try {
      const available = await isApiAvailable();
      
      if (available) {
        const categoryDtos = await api.getCategories();
        const mappedCategories: Category[] = categoryDtos.map(dto => ({
          id: String(dto.id),
          name: dto.title,
          description: dto.description,
          icon: dto.iconData || '📁',
          roadmaps: [],
          progress: 0,
          createdAt: new Date(),
        }));
        
        // Load roadmaps for each category
        for (const cat of mappedCategories) {
          try {
            const numericId = parseInt(cat.id.replace(/\D/g, ''));
            const roadmapDtos = await api.getRoadmaps(numericId);
            cat.roadmaps = roadmapDtos.map(dto => ({
              id: String(dto.id),
              categoryId: String(dto.categoryId),
              title: dto.title,
              description: dto.description,
              topics: [],
              connections: [],
              progress: 0,
              totalQuestions: 0,
              masteredQuestions: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
            
            // Load topics for each roadmap
            for (const roadmap of cat.roadmaps) {
              try {
                const numericRoadmapId = parseInt(roadmap.id.replace(/\D/g, ''));
                const topicDtos = await api.getTopics(numericRoadmapId);
                roadmap.topics = topicDtos.map(dto => ({
                  id: String(dto.id),
                  roadmapId: roadmap.id,
                  title: dto.title,
                  description: dto.description,
                  position: { x: dto.canvasPositionX, y: dto.canvasPositionY },
                  status: 'not_started' as const,
                  questions: [],
                  resources: [],
                  childTopicIds: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }));
              } catch {
                // Keep empty topics
              }
            }
          } catch {
            // Keep empty roadmaps
          }
        }
        
        if (mappedCategories.length > 0) {
          setCategories(mappedCategories);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Load cards from API
  const loadCards = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const available = await isApiAvailable();
      
      if (available) {
        setIsApiMode(true);
        const cardDtos = await api.getCards();
        const mappedCards = cardDtos.map(mapCardDtoToQuestion);
        setCards(mappedCards);
      } else {
        setIsApiMode(false);
        // Fallback - cards from mock data are already in categories
      }
    } catch (err) {
      console.error('Failed to load cards:', err);
      setIsApiMode(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadCategories();
    loadCards();
  }, [loadCategories, loadCards]);

  // Get all questions with their context (from API cards or mock data)
  const allQuestions = useMemo((): QuestionWithContext[] => {
    if (isApiMode && cards.length > 0) {
      // Map cards to questions with context from categories
      return cards.map(card => {
        let categoryId = '';
        let categoryName = '';
        let roadmapId = '';
        let roadmapTitle = '';
        let topicTitle = '';

        // Find the topic context
        for (const category of categories) {
          for (const roadmap of category.roadmaps) {
            const topic = roadmap.topics.find(t => t.id === card.topicId);
            if (topic) {
              categoryId = category.id;
              categoryName = category.name;
              roadmapId = roadmap.id;
              roadmapTitle = roadmap.title;
              topicTitle = topic.title;
              break;
            }
          }
          if (topicTitle) break;
        }

        return {
          ...card,
          categoryId,
          categoryName,
          roadmapId,
          roadmapTitle,
          topicTitle: topicTitle || `Topic ${card.topicId}`,
        };
      });
    }
    
    // Fallback to mock data from categories
    const questions: QuestionWithContext[] = [];
    
    for (const category of categories) {
      for (const roadmap of category.roadmaps) {
        for (const topic of roadmap.topics) {
          for (const question of topic.questions) {
            questions.push({
              ...question,
              categoryId: category.id,
              categoryName: category.name,
              roadmapId: roadmap.id,
              roadmapTitle: roadmap.title,
              topicTitle: topic.title,
            });
          }
        }
      }
    }
    
    return questions;
  }, [categories, cards, isApiMode]);

  // Filtered questions based on current filters
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          q.content.toLowerCase().includes(searchLower) ||
          q.answer.toLowerCase().includes(searchLower) ||
          q.topicTitle.toLowerCase().includes(searchLower) ||
          q.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (filters.categoryId && q.categoryId !== filters.categoryId) return false;
      if (filters.roadmapId && q.roadmapId !== filters.roadmapId) return false;
      if (filters.topicId && q.topicId !== filters.topicId) return false;
      if (filters.type && q.type !== filters.type) return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
      if (filters.importance && q.importance !== filters.importance) return false;

      return true;
    });
  }, [allQuestions, filters]);

  // Get available roadmaps based on selected category
  const availableRoadmaps = useMemo(() => {
    if (!filters.categoryId) {
      return categories.flatMap(c => c.roadmaps);
    }
    const category = categories.find(c => c.id === filters.categoryId);
    return category?.roadmaps || [];
  }, [categories, filters.categoryId]);

  // Get available topics based on selected roadmap
  const availableTopics = useMemo(() => {
    if (!filters.roadmapId) {
      return availableRoadmaps.flatMap(r => r.topics);
    }
    const roadmap = availableRoadmaps.find(r => r.id === filters.roadmapId);
    return roadmap?.topics || [];
  }, [availableRoadmaps, filters.roadmapId]);

  const updateFilter = useCallback(<K extends keyof QuestionFilters>(
    key: K,
    value: QuestionFilters[K]
  ) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      if (key === 'categoryId') {
        newFilters.roadmapId = null;
        newFilters.topicId = null;
      } else if (key === 'roadmapId') {
        newFilters.topicId = null;
      }
      
      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const addQuestion = useCallback(async (
    topicId: string,
    question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>
  ) => {
    const cardDto = mapQuestionToCardDto(question, topicId);

    try {
      const available = await isApiAvailable();
      
      if (available) {
        await api.createCard(cardDto as CardDto);
        await loadCards(); // Refresh cards from API
        return;
      }
    } catch (err) {
      console.error('Failed to create card:', err);
    }

    // Fallback to local state
    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}`,
      topicId,
      createdAt: new Date(),
      updatedAt: new Date(),
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
    };

    setCategories(prev => prev.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t =>
          t.id === topicId
            ? { ...t, questions: [...t.questions, newQuestion], updatedAt: new Date() }
            : t
        ),
      })),
    })));

    return newQuestion;
  }, [loadCards]);

  const updateQuestion = useCallback(async (questionId: string, updates: Partial<Question>) => {
    try {
      const available = await isApiAvailable();
      
      if (available) {
        // Find the question to get topicId
        const question = allQuestions.find(q => q.id === questionId);
        if (question) {
          const numericId = parseInt(questionId.replace(/\D/g, ''));
          const cardDto: CardDto = {
            id: numericId,
            question: updates.content || question.content,
            answer: updates.answer || question.answer,
            difficulty: (updates.difficulty || question.difficulty) === 'beginner' ? 1 : 
                       (updates.difficulty || question.difficulty) === 'intermediate' ? 2 : 
                       (updates.difficulty || question.difficulty) === 'advanced' ? 3 : 4,
            importance: (updates.importance || question.importance) === 'low' ? 1 : 
                       (updates.importance || question.importance) === 'medium' ? 2 : 
                       (updates.importance || question.importance) === 'high' ? 3 : 4,
            topicId: parseInt(question.topicId.replace(/\D/g, '')),
          };
          await api.updateCard(numericId, cardDto);
          await loadCards();
          return;
        }
      }
    } catch (err) {
      console.error('Failed to update card:', err);
    }

    // Fallback to local state
    setCategories(prev => prev.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t => ({
          ...t,
          questions: t.questions.map(q =>
            q.id === questionId ? { ...q, ...updates, updatedAt: new Date() } : q
          ),
        })),
      })),
    })));
  }, [allQuestions, loadCards]);

  const deleteQuestion = useCallback(async (questionId: string) => {
    try {
      const available = await isApiAvailable();
      
      if (available) {
        const numericId = parseInt(questionId.replace(/\D/g, ''));
        await api.deleteCard(numericId);
        await loadCards();
        return;
      }
    } catch (err) {
      console.error('Failed to delete card:', err);
    }

    // Fallback to local state
    setCategories(prev => prev.map(c => ({
      ...c,
      roadmaps: c.roadmaps.map(r => ({
        ...r,
        topics: r.topics.map(t => ({
          ...t,
          questions: t.questions.filter(q => q.id !== questionId),
        })),
      })),
    })));
  }, [loadCards]);

  // Stats
  const stats = useMemo(() => ({
    total: allQuestions.length,
    filtered: filteredQuestions.length,
    byType: {
      yes_no: allQuestions.filter(q => q.type === 'yes_no').length,
      open_ended: allQuestions.filter(q => q.type === 'open_ended').length,
      code_write: allQuestions.filter(q => q.type === 'code_write').length,
      single_answer: allQuestions.filter(q => q.type === 'single_answer').length,
    },
    byDifficulty: {
      beginner: allQuestions.filter(q => q.difficulty === 'beginner').length,
      intermediate: allQuestions.filter(q => q.difficulty === 'intermediate').length,
      advanced: allQuestions.filter(q => q.difficulty === 'advanced').length,
      expert: allQuestions.filter(q => q.difficulty === 'expert').length,
    },
  }), [allQuestions, filteredQuestions]);

  return {
    categories,
    filters,
    allQuestions,
    filteredQuestions,
    availableRoadmaps,
    availableTopics,
    stats,
    isLoading,
    updateFilter,
    resetFilters,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    refreshCards: loadCards,
  };
};
