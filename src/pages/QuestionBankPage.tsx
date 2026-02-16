import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Database, BarChart3, BookOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { QuestionFilters } from '@/components/questions/QuestionFilters';
import { QuestionEditDialog } from '@/components/questions/QuestionEditDialog';
// IMPORT Z NOWEGO HOOKA
import { useQuestionBank, QuestionWithContext } from '@/hooks/useQuestionBank';
import { QuestionType, DifficultyLevel, ImportanceLevel } from '@/types/learning';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// Definicja stanu filtrów
interface FilterState {
  search: string;
  categoryId: string | null;
  roadmapId: string | null;
  topicId: string | null;
  type: QuestionType | null;
  difficulty: DifficultyLevel | null;
  importance: ImportanceLevel | null;
}

const initialFilters: FilterState = {
  search: '',
  categoryId: null,
  roadmapId: null,
  topicId: null,
  type: null,
  difficulty: null,
  importance: null,
};

const QuestionBankPage = () => {
  const navigate = useNavigate();

  // 1. Użycie nowego hooka useQuestionBank
  // Zwracamy 'questions' zamiast 'allQuestions'
  const {
    questions,
    categories,
    isLoading,
    deleteQuestion,
    updateQuestion,
    addQuestion
  } = useQuestionBank();

  // 2. Lokalny stan filtrów i UI
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithContext | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'add'>('edit');
  const [questionToDelete, setQuestionToDelete] = useState<QuestionWithContext | null>(null);

  // 3. Logika filtrowania (używamy zmiennej 'questions')
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          q.question.toLowerCase().includes(searchLower) ||
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
  }, [questions, filters]);

  // 4. Logika pomocnicza dla dropdownów
  const availableRoadmaps = useMemo(() => {
    if (!filters.categoryId) {
      return categories.flatMap(c => c.roadmaps);
    }
    const category = categories.find(c => c.id === filters.categoryId);
    return category?.roadmaps || [];
  }, [categories, filters.categoryId]);

  const availableTopics = useMemo(() => {
    if (!filters.roadmapId) {
      return availableRoadmaps.flatMap(r => r.topics);
    }
    const roadmap = availableRoadmaps.find(r => r.id === filters.roadmapId);
    return roadmap?.topics || [];
  }, [availableRoadmaps, filters.roadmapId]);

  // 5. Statystyki (używamy zmiennej 'questions')
  const stats = useMemo(() => ({
    total: questions.length,
    filtered: filteredQuestions.length,
    byType: {
      open_ended: questions.filter(q => q.type === 'open_ended').length,
      code_write: questions.filter(q => q.type === 'code_write').length,
    },
    byDifficulty: {
      beginner: questions.filter(q => q.difficulty === 'beginner').length,
    },
  }), [questions, filteredQuestions]);

  // Handlery
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
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
  };

  const handleEdit = (question: QuestionWithContext) => {
    setEditingQuestion(question);
    setDialogMode('edit');
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    setDialogMode('add');
    setIsEditDialogOpen(true);
  };

  const handleDelete = (question: QuestionWithContext) => {
    setQuestionToDelete(question);
  };

  const confirmDelete = async () => {
    if (questionToDelete) {
      try {
        await deleteQuestion(questionToDelete.id);
        toast.success('Pytanie zostało usunięte');
        setQuestionToDelete(null);
      } catch (error) {
        toast.error('Błąd podczas usuwania pytania');
      }
    }
  };

  const handleStudy = (question: QuestionWithContext) => {
    navigate(`/learn/study/${question.topicId}?questionId=${question.id}`);
  };

  const handleSaveQuestion = async (questionId: string, updates: any) => {
    try {
      await updateQuestion({ id: questionId, data: updates });
      toast.success('Pytanie zostało zaktualizowane');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Błąd aktualizacji');
    }
  };

  const handleAddQuestion = async (topicId: string, question: any) => {
    try {
      await addQuestion({ topicId, data: question });
      toast.success('Pytanie zostało dodane');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Błąd dodawania');
    }
  };

  if (isLoading) {
      return (
          <MainLayout>
              <div className="flex items-center justify-center min-h-screen">
                  <div className="text-lg">Ładowanie danych...</div>
              </div>
          </MainLayout>
      )
  }

  return (
    <MainLayout>
      <div className="min-h-screen p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Baza pytań</h1>
              <p className="mt-1 text-muted-foreground">
                Zarządzaj wszystkimi pytaniami w systemie
              </p>
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj pytanie
            </Button>
          </div>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Wszystkich pytań</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.byType.open_ended}</p>
                <p className="text-xs text-muted-foreground">Pytań otwartych</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.byDifficulty.beginner}</p>
                <p className="text-xs text-muted-foreground">Dla początkujących</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Database className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.byType.code_write}</p>
                <p className="text-xs text-muted-foreground">Pytań z kodem</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <QuestionFilters
            filters={filters}
            categories={categories}
            availableRoadmaps={availableRoadmaps}
            availableTopics={availableTopics}
            onUpdateFilter={updateFilter}
            onResetFilters={() => setFilters(initialFilters)}
            totalCount={stats.total}
            filteredCount={stats.filtered}
          />
        </motion.div>

        {/* Questions grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {filteredQuestions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={() => handleEdit(question)}
                    onDelete={() => handleDelete(question)}
                    onStudy={() => handleStudy(question)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <div className="mb-4 text-6xl">📚</div>
              <h3 className="text-lg font-semibold text-foreground">Brak pytań</h3>
              <p className="mt-1 text-center text-muted-foreground">
                {stats.total === 0
                  ? 'Nie masz jeszcze żadnych pytań. Dodaj pierwsze!'
                  : 'Żadne pytanie nie pasuje do wybranych filtrów.'
                }
              </p>
              {stats.total === 0 && (
                <Button onClick={handleAdd} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Dodaj pierwsze pytanie
                </Button>
              )}
            </div>
          )}
        </motion.div>

        {/* Edit/Add Dialog */}
        <QuestionEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          question={editingQuestion}
          categories={categories}
          onSave={handleSaveQuestion}
          onAdd={handleAddQuestion}
          mode={dialogMode}
        />

        {/* Delete confirmation */}
        <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć pytanie?</AlertDialogTitle>
              <AlertDialogDescription>
                Czy na pewno chcesz usunąć to pytanie? Ta operacja jest nieodwracalna.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default QuestionBankPage;