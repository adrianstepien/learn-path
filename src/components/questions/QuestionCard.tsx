import { motion } from 'framer-motion';
import {
  HelpCircle,
  CheckCircle2,
  Code,
  MessageSquare,
  ToggleLeft,
  Pencil,
  Trash2,
  Play,
  Tag,
  Folder,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuestionWithContext } from '@/stores/questionBankStore';
import { QuestionType, DifficultyLevel, ImportanceLevel } from '@/types/learning';
import { stripHtml } from '@/lib/utils';

interface QuestionCardProps {
  question: QuestionWithContext;
  onEdit: () => void;
  onDelete: () => void;
  onStudy: () => void;
}

const questionTypeIcons: Record<QuestionType, typeof HelpCircle> = {
  yes_no: ToggleLeft,
  single_answer: CheckCircle2,
  open_ended: MessageSquare,
  fill_blank: HelpCircle,
  code_write: Code,
  code_explain: Code,
  chronology: HelpCircle,
};

const questionTypeLabels: Record<QuestionType, string> = {
  yes_no: 'Tak/Nie',
  single_answer: 'Jednoznaczna',
  open_ended: 'Otwarte',
  fill_blank: 'Uzupełnij',
  code_write: 'Napisz kod',
  code_explain: 'Wyjaśnij kod',
  chronology: 'Chronologia',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  expert: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: 'Początkujący',
  intermediate: 'Średni',
  advanced: 'Zaawansowany',
  expert: 'Ekspert',
};

const importanceColors: Record<ImportanceLevel, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-purple-500/20 text-purple-400',
  critical: 'bg-red-500/20 text-red-400',
};

const importanceLabels: Record<ImportanceLevel, string> = {
  low: 'Niska',
  medium: 'Średnia',
  high: 'Wysoka',
  critical: 'Krytyczna',
};

export const QuestionCard = ({ question, onEdit, onDelete, onStudy }: QuestionCardProps) => {
  const TypeIcon = questionTypeIcons[question.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TypeIcon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {questionTypeLabels[question.type]}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStudy}>
            <Play className="h-4 w-4 text-green-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Question */}
      <p className="mb-3 text-sm leading-relaxed text-foreground line-clamp-3">
        {stripHtml(question.question)}
      </p>

      {/* Context info */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Folder className="h-3 w-3" />
          <span>{question.categoryName}</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Map className="h-3 w-3" />
          <span>{question.roadmapTitle}</span>
        </div>
        <span>•</span>
        <span className="text-primary">{question.topicTitle}</span>
      </div>

      {/* Tags and badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={difficultyColors[question.difficulty]}>
          {difficultyLabels[question.difficulty]}
        </Badge>
        <Badge variant="outline" className={importanceColors[question.importance]}>
          {importanceLabels[question.importance]}
        </Badge>
        {question.tags.slice(0, 3).map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs">
            <Tag className="mr-1 h-3 w-3" />
            {tag}
          </Badge>
        ))}
        {question.tags.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{question.tags.length - 3}
          </Badge>
        )}
      </div>
    </motion.div>
  );
};
