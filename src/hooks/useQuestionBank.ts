import { useMemo } from 'react';
import { useCards, useCardMutations } from './queries/useCards';
import { useCategoriesTree } from './queries/useCategoriesTree';
import { Question } from '@/types/learning';

export interface QuestionWithContext extends Question {
  categoryId: string;
  categoryName: string;
  roadmapId: string;
  roadmapTitle: string;
  topicTitle: string;
}

export const useQuestionBank = () => {
  // 1. Pobieramy dane z wyspecjalizowanych hooków
  const { data: cards, isLoading: isCardsLoading, isError: isCardsError } = useCards();
  const { data: categories, isLoading: isTreeLoading, isError: isTreeError } = useCategoriesTree();

  // Pobieramy mutacje
  const { deleteCard, updateCard, addCard } = useCardMutations();

  // 2. Łączymy dane (logika specyficzna dla tego widoku)
  const questionsWithContext = useMemo((): QuestionWithContext[] => {
    const apiCards = cards || [];
    const tree = categories || [];

    // SCENARIUSZ A: Mamy karty pobrane z API (Cards)
    if (apiCards.length > 0) {
      return apiCards.map(card => {
        let categoryId = '';
        let categoryName = '';
        let roadmapId = '';
        let roadmapTitle = '';
        let topicTitle = '';

        // Szukamy kontekstu w drzewie (żeby wyświetlić nazwy zamiast ID)
        for (const category of tree) {
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

    // SCENARIUSZ B: Fallback (Brak kart z API, szukamy wewnątrz struktury drzewa - dla mocków)
    const gatheredQuestions: QuestionWithContext[] = []; // Zmieniłem nazwę zmiennej na unikalną, by uniknąć błędów

    if (tree.length > 0) {
       for (const category of tree) {
        for (const roadmap of category.roadmaps) {
          for (const topic of roadmap.topics) {
            // Sprawdzamy czy w temacie są zaszyte pytania (struktura mock)
            if (topic.questions && Array.isArray(topic.questions)) {
              for (const question of topic.questions) {
                gatheredQuestions.push({
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
      }
    }

    return gatheredQuestions;
  }, [cards, categories]);

  return {
    questions: questionsWithContext,
    categories: categories || [],
    isLoading: isCardsLoading || isTreeLoading,
    isError: isCardsError || isTreeError,
    // Eksportujemy mutacje pod nazwami zgodnymi z widokiem
    deleteQuestion: deleteCard,
    updateQuestion: updateCard,
    addQuestion: addCard,
  };
};