import { useState, useCallback, useMemo } from 'react';
import { Category, Question, QuestionType, DifficultyLevel, ImportanceLevel } from '@/types/learning';
import { mockCategories } from '@/data/mockData';

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

export const useQuestionBankStore = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [filters, setFilters] = useState<QuestionFilters>(initialFilters);

  // Get all questions with their context (category, roadmap, topic info)
  const allQuestions = useMemo((): QuestionWithContext[] => {
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
  }, [categories]);

  // Filtered questions based on current filters
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          q.content.toLowerCase().includes(searchLower) ||
          q.answer.toLowerCase().includes(searchLower) ||
          q.topicTitle.toLowerCase().includes(searchLower) ||
          q.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.categoryId && q.categoryId !== filters.categoryId) return false;

      // Roadmap filter
      if (filters.roadmapId && q.roadmapId !== filters.roadmapId) return false;

      // Topic filter
      if (filters.topicId && q.topicId !== filters.topicId) return false;

      // Type filter
      if (filters.type && q.type !== filters.type) return false;

      // Difficulty filter
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;

      // Importance filter
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
      
      // Reset dependent filters
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

  const addQuestion = useCallback((
    topicId: string,
    question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>
  ) => {
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
  }, []);

  const updateQuestion = useCallback((questionId: string, updates: Partial<Question>) => {
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
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
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
  }, []);

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
    updateFilter,
    resetFilters,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  };
};
