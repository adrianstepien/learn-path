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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { Question, QuestionType, DifficultyLevel, ImportanceLevel } from '@/types/learning';
import { RichTextEditor } from './RichTextEditor';

interface QuestionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  question?: Question | null;
  onSave: (question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>) => void;
  mode: 'add' | 'edit';
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

export const QuestionFormDialog = ({
  isOpen,
  onClose,
  question,
  onSave,
  mode,
}: QuestionFormDialogProps) => {
  const [type, setType] = useState<QuestionType>('open_ended');
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [importance, setImportance] = useState<ImportanceLevel>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && question) {
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
        setType('open_ended');
        setContent('');
        setAnswer('');
        setHint('');
        setExplanation('');
        setDifficulty('beginner');
        setImportance('medium');
        setTags([]);
      }
      setNewTag('');
    }
  }, [isOpen, question, mode]);

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
    // Strip HTML to check if content is actually empty
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
    if (!stripHtml(content) || !stripHtml(answer)) return;

    onSave({
      type,
      content,
      answer,
      hint: hint || undefined,
      explanation: explanation || undefined,
      difficulty,
      importance,
      tags,
    });

    onClose();
  };

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
  const isValid = stripHtml(content) && stripHtml(answer);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edytuj pytanie' : 'Dodaj nowe pytanie'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Zmodyfikuj treść i właściwości pytania. Możesz używać formatowania tekstu, kolorów i obrazów.'
              : 'Utwórz nowe pytanie. Możesz używać formatowania tekstu, kolorów i obrazów.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type and difficulty row */}
          <div className="grid grid-cols-3 gap-3">
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

          {/* Content with rich editor */}
          <div className="space-y-2">
            <Label>Treść pytania *</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Wpisz treść pytania..."
              minHeight="120px"
            />
          </div>

          {/* Answer with rich editor */}
          <div className="space-y-2">
            <Label>Odpowiedź / Wzorzec *</Label>
            <RichTextEditor
              content={answer}
              onChange={setAnswer}
              placeholder="Wpisz oczekiwaną odpowiedź..."
              minHeight="100px"
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

          {/* Explanation with rich editor */}
          <div className="space-y-2">
            <Label>Wyjaśnienie (opcjonalnie)</Label>
            <RichTextEditor
              content={explanation}
              onChange={setExplanation}
              placeholder="Szczegółowe wyjaśnienie po udzieleniu odpowiedzi..."
              minHeight="80px"
            />
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
