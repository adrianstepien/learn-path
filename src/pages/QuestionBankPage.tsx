import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Database, BarChart3, BookOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { QuestionFilters } from '@/components/questions/QuestionFilters';
import { QuestionEditDialog } from '@/components/questions/QuestionEditDialog';
import { useQuestionBankStore, QuestionWithContext } from '@/stores/questionBankStore';
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

const QuestionBankPage = () => {
  const navigate = useNavigate();
  const store = useQuestionBankStore();
  
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithContext | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'add'>('edit');
  const [questionToDelete, setQuestionToDelete] = useState<QuestionWithContext | null>(null);

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

  const confirmDelete = () => {
    if (questionToDelete) {
      store.deleteQuestion(questionToDelete.id);
      toast.success('Pytanie zostało usunięte');
      setQuestionToDelete(null);
    }
  };

  const handleStudy = (question: QuestionWithContext) => {
    navigate(`/learn/study/${question.topicId}?questionId=${question.id}`);
  };

  const handleSaveQuestion = (questionId: string, updates: any) => {
    store.updateQuestion(questionId, updates);
    toast.success('Pytanie zostało zaktualizowane');
  };

  const handleAddQuestion = (topicId: string, question: any) => {
    store.addQuestion(topicId, question);
    toast.success('Pytanie zostało dodane');
  };

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
                <p className="text-2xl font-bold text-foreground">{store.stats.total}</p>
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
                <p className="text-2xl font-bold text-foreground">{store.stats.byType.open_ended}</p>
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
                <p className="text-2xl font-bold text-foreground">{store.stats.byDifficulty.beginner}</p>
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
                <p className="text-2xl font-bold text-foreground">{store.stats.byType.code_write}</p>
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
            filters={store.filters}
            categories={store.categories}
            availableRoadmaps={store.availableRoadmaps}
            availableTopics={store.availableTopics}
            onUpdateFilter={store.updateFilter}
            onResetFilters={store.resetFilters}
            totalCount={store.stats.total}
            filteredCount={store.stats.filtered}
          />
        </motion.div>

        {/* Questions grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {store.filteredQuestions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {store.filteredQuestions.map((question) => (
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
                {store.stats.total === 0
                  ? 'Nie masz jeszcze żadnych pytań. Dodaj pierwsze!'
                  : 'Żadne pytanie nie pasuje do wybranych filtrów.'
                }
              </p>
              {store.stats.total === 0 && (
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
          categories={store.categories}
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
