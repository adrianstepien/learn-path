import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Question, QuestionType, DifficultyLevel, ImportanceLevel, Category, Roadmap, Topic } from '@/types/learning';
import { QuestionWithContext } from '@/stores/questionBankStore';

interface QuestionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionWithContext | null;
  categories: Category[];
  onSave: (questionId: string, updates: Partial<Question>) => void;
  onAdd: (topicId: string, question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>) => void;
  mode: 'edit' | 'add';
}

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'yes_no', label: 'Tak/Nie' },
  { value: 'single_answer', label: 'Jednoznaczna odpowiedź' },
  { value: 'open_ended', label: 'Pytanie otwarte' },
  { value: 'fill_blank', label: 'Uzupełnij lukę' },
  { value: 'code_write', label: 'Napisz kod' },
  { value: 'code_explain', label: 'Wyjaśnij kod' },
  { value: 'chronology', label: 'Uporządkuj chronologicznie' },
];

const difficultyLevels: { value: DifficultyLevel; label: string }[] = [
  { value: 'beginner', label: 'Początkujący' },
  { value: 'intermediate', label: 'Średnio zaawansowany' },
  { value: 'advanced', label: 'Zaawansowany' },
  { value: 'expert', label: 'Ekspert' },
];

const importanceLevels: { value: ImportanceLevel; label: string }[] = [
  { value: 'low', label: 'Niska' },
  { value: 'medium', label: 'Średnia' },
  { value: 'high', label: 'Wysoka' },
  { value: 'critical', label: 'Krytyczna' },
];

export const QuestionEditDialog = ({
  isOpen,
  onClose,
  question,
  categories,
  onSave,
  onAdd,
  mode,
}: QuestionEditDialogProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [type, setType] = useState<QuestionType>('open_ended');
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [importance, setImportance] = useState<ImportanceLevel>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Get available roadmaps and topics based on selection
  const availableRoadmaps: Roadmap[] = selectedCategoryId
    ? categories.find(c => c.id === selectedCategoryId)?.roadmaps || []
    : [];

  const availableTopics: Topic[] = selectedRoadmapId
    ? availableRoadmaps.find(r => r.id === selectedRoadmapId)?.topics || []
    : [];

  // Reset form when dialog opens/closes or question changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && question) {
        setSelectedCategoryId(question.categoryId);
        setSelectedRoadmapId(question.roadmapId);
        setSelectedTopicId(question.topicId);
        setType(question.type);
        setContent(question.content);
        setAnswer(question.answer);
        setHint(question.hint || '');
        setExplanation(question.explanation || '');
        setDifficulty(question.difficulty);
        setImportance(question.importance);
        setTags([...question.tags]);
      } else {
        // Reset for add mode
        setSelectedCategoryId(categories[0]?.id || '');
        setSelectedRoadmapId('');
        setSelectedTopicId('');
        setType('open_ended');
        setContent('');
        setAnswer('');
        setHint('');
        setExplanation('');
        setDifficulty('beginner');
        setImportance('medium');
        setTags([]);
      }
    }
  }, [isOpen, question, mode, categories]);

  // Update roadmap selection when category changes
  useEffect(() => {
    if (mode === 'add') {
      setSelectedRoadmapId('');
      setSelectedTopicId('');
    }
  }, [selectedCategoryId, mode]);

  // Update topic selection when roadmap changes
  useEffect(() => {
    if (mode === 'add') {
      setSelectedTopicId('');
    }
  }, [selectedRoadmapId, mode]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!content.trim() || !answer.trim()) return;

    if (mode === 'edit' && question) {
      onSave(question.id, {
        type,
        content: content.trim(),
        answer: answer.trim(),
        hint: hint.trim() || undefined,
        explanation: explanation.trim() || undefined,
        difficulty,
        importance,
        tags,
      });
    } else if (mode === 'add' && selectedTopicId) {
      onAdd(selectedTopicId, {
        type,
        content: content.trim(),
        answer: answer.trim(),
        hint: hint.trim() || undefined,
        explanation: explanation.trim() || undefined,
        difficulty,
        importance,
        tags,
      });
    }

    onClose();
  };

  const isValid = content.trim() && answer.trim() && (mode === 'edit' || selectedTopicId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edytuj pytanie' : 'Dodaj nowe pytanie'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Zmodyfikuj treść i właściwości pytania'
              : 'Utwórz nowe pytanie i przypisz je do tematu'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Location selection (only for add mode or shown as info for edit) */}
          {mode === 'add' ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Roadmapa</Label>
                <Select 
                  value={selectedRoadmapId} 
                  onValueChange={setSelectedRoadmapId}
                  disabled={!selectedCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoadmaps.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temat</Label>
                <Select 
                  value={selectedTopicId} 
                  onValueChange={setSelectedTopicId}
                  disabled={!selectedRoadmapId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTopics.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : question && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{question.categoryName}</span>
                {' → '}
                <span className="font-medium text-foreground">{question.roadmapTitle}</span>
                {' → '}
                <span className="font-medium text-primary">{question.topicTitle}</span>
              </p>
            </div>
          )}

          {/* Question type */}
          <div className="space-y-2">
            <Label>Typ pytania</Label>
            <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Treść pytania *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Wpisz treść pytania..."
              rows={3}
            />
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label>Odpowiedź / Wzorzec *</Label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Wpisz oczekiwaną odpowiedź..."
              rows={3}
            />
          </div>

          {/* Hint */}
          <div className="space-y-2">
            <Label>Podpowiedź (opcjonalnie)</Label>
            <Input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Dodatkowa wskazówka dla użytkownika..."
            />
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label>Wyjaśnienie (opcjonalnie)</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Szczegółowe wyjaśnienie po udzieleniu odpowiedzi..."
              rows={2}
            />
          </div>

          {/* Difficulty and importance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Poziom trudności</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ważność</Label>
              <Select value={importance} onValueChange={(v) => setImportance(v as ImportanceLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {importanceLevels.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tagi</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Dodaj tag..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="secondary" onClick={handleAddTag}>
                Dodaj
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === 'edit' ? 'Zapisz zmiany' : 'Dodaj pytanie'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
