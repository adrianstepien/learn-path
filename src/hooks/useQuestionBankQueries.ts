import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import * as api from '@/lib/api';
import { isApiAvailable } from '@/lib/api/config';
import { CardDto } from '@/lib/api/types';
import { Question, Category } from '@/types/learning';
import { mockCategories } from '@/data/mockData';

// --- Typy pomocnicze ---
export interface QuestionWithContext extends Question {
  categoryId: string;
  categoryName: string;
  roadmapId: string;
  roadmapTitle: string;
  topicTitle: string;
}

// --- Mappery (Przeniesione z store i dostosowane) ---

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

// --- Główna funkcja pobierająca drzewo kategorii ---
// To zastępuje logikę loadCategories ze store
const fetchFullCategoryTree = async (): Promise<Category[]> => {
  const available = await isApiAvailable();

  // Fallback do mocków, jeśli API jest niedostępne (zgodnie z logiką store)
  if (!available) {
    return mockCategories;
  }

  try {
    // 1. Pobierz kategorie
    const categoryDtos = await api.getCategories();

    // Mapowanie wstępne
    const categories: Category[] = categoryDtos.map(dto => ({
      id: String(dto.id),
      name: dto.title,
      description: dto.description,
      icon: dto.iconData || '📁',
      roadmaps: [],
      progress: 0,
      createdAt: new Date(),
    }));

    // 2. Pobierz Roadmapy dla każdej kategorii (równolegle)
    await Promise.all(categories.map(async (cat) => {
      try {
        const numericId = parseInt(cat.id.replace(/\D/g, ''));
        const roadmapDtos = await api.getRoadmaps(numericId);

        cat.roadmaps = roadmapDtos.map(dto => ({
          id: String(dto.id),
          categoryId: String(dto.categoryId),
          title: dto.title,
          description: dto.description,
          topics: [], // To wypełnimy w następnym kroku
          connections: [],
          progress: 0,
          totalQuestions: 0,
          masteredQuestions: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        // 3. Pobierz Tematy dla każdej roadmapy (równolegle)
        await Promise.all(cat.roadmaps.map(async (roadmap) => {
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
          } catch (err) {
            console.warn(`Failed to fetch topics for roadmap ${roadmap.id}`, err);
            // Zostawiamy puste tematy, nie przerywamy całego procesu
          }
        }));

      } catch (err) {
        console.warn(`Failed to fetch roadmaps for category ${cat.id}`, err);
        // Zostawiamy puste roadmapy
      }
    }));

    return categories;
  } catch (err) {
    console.error('Critical error fetching categories tree:', err);
    return mockCategories; // Ostateczny fallback w razie błędu API
  }
};

// --- Hooki ---

export const useQuestionBankData = () => {
  // 1. Pobieranie pełnego drzewa kategorii
  const categoriesQuery = useQuery({
    queryKey: ['categories-tree'],
    queryFn: fetchFullCategoryTree,
    staleTime: 1000 * 60 * 5, // Cache na 5 minut
    refetchOnWindowFocus: false,
  });

  // 2. Pobieranie kart (pytań)
  const cardsQuery = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const available = await isApiAvailable();
      if (!available) return []; // Jeśli brak API, store polegał na mockach wewnątrz kategorii

      const data = await api.getCards();
      return data.map(mapCardDtoToQuestion);
    },
  });

  // 3. Łączenie danych (Derived State)
  const questionsWithContext = useMemo((): QuestionWithContext[] => {
    const apiCards = cardsQuery.data || [];
    const categories = categoriesQuery.data || [];
    const isApiMode = cardsQuery.data && cardsQuery.data.length > 0;

    // SCENARIUSZ A: Mamy dane z API (Cards)
    if (isApiMode) {
      return apiCards.map(card => {
        let categoryId = '';
        let categoryName = '';
        let roadmapId = '';
        let roadmapTitle = '';
        let topicTitle = '';

        // Przeszukiwanie drzewa w celu znalezienia kontekstu dla pytania (Topic Title itp.)
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

    // SCENARIUSZ B: Fallback (Mock Data)
    // Jeśli nie mamy kart z API, wyciągamy pytania zaszyte w strukturze mockCategories
    // (Oryginalny store miał taką logikę w useMemo 'allQuestions')
    const questions: QuestionWithContext[] = [];

    for (const category of categories) {
      for (const roadmap of category.roadmaps) {
        for (const topic of roadmap.topics) {
          if (topic.questions) {
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
    }

    return questions;
  }, [cardsQuery.data, categoriesQuery.data]);

  return {
    questions: questionsWithContext,
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading || cardsQuery.isLoading,
    isError: categoriesQuery.isError || cardsQuery.isError,
    refetch: () => {
        categoriesQuery.refetch();
        cardsQuery.refetch();
    }
  };
};

export const useQuestionMutations = () => {
  const queryClient = useQueryClient();

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const numericId = parseInt(id.replace(/\D/g, ''));
      await api.deleteCard(numericId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Question> }) => {
      const available = await isApiAvailable();
      if (!available) throw new Error("API unavailable");
// 1. POBIERZ AKTUALNE DANE Z CACHE
      const cachedQuestions = queryClient.getQueryData<Question[]>(['cards']);
      const existingQuestion = cachedQuestions?.find(q => q.id === id);

      if (!existingQuestion) {
        throw new Error("Nie znaleziono pytania w pamięci podręcznej. Odśwież stronę.");
      }

      const numericId = parseInt(id.replace(/\D/g, ''));

      // 2. SCALANIE DANYCH (Istniejące + Nowe)
            // Jeśli data.content jest undefined (nie edytowano treści), użyj starej treści existingQuestion.content
            const updatedQuestion = data.question !== undefined ? data.question : existingQuestion.question;
            const updatedAnswer = data.answer !== undefined ? data.answer : existingQuestion.answer;
            const updatedDifficulty = data.difficulty || existingQuestion.difficulty;
            const updatedImportance = data.importance || existingQuestion.importance;

    // 3. BUDOWANIE PEŁNEGO DTO (Wymaganego przez Backend)
      const cardDto: CardDto = {
                id: numericId,
                // Teraz te pola na pewno nie będą null:
                question: updatedQuestion,
                answer: updatedAnswer,
                // TopicId bierzemy ze starego obiektu (bo przy edycji rzadko zmieniamy temat):
                topicId: parseInt(existingQuestion.topicId.replace(/\D/g, '')),

                difficulty: updatedDifficulty === 'beginner' ? 1 : updatedDifficulty === 'intermediate' ? 2 : updatedDifficulty === 'advanced' ? 3 : 4,
                importance: updatedImportance === 'low' ? 1 : updatedImportance === 'medium' ? 2 : updatedImportance === 'high' ? 3 : 4,
            };

      // Musimy rzutować na CardDto lub poprawić definicję api.updateCard
      await api.updateCard(numericId, cardDto);
    },
    onSuccess: () => {
      // Po sukcesie odświeżamy cache przez react-query
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    }
  });

  const addQuestionMutation = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  return {
    deleteQuestion: deleteQuestionMutation.mutateAsync,
    updateQuestion: updateQuestionMutation.mutateAsync,
    addQuestion: addQuestionMutation.mutateAsync,
  };
};