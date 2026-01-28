import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Category, Roadmap, Topic, QuestionType, DifficultyLevel, ImportanceLevel } from '@/types/learning';
import { QuestionFilters as Filters } from '@/stores/questionBankStore';

interface QuestionFiltersProps {
  filters: Filters;
  categories: Category[];
  availableRoadmaps: Roadmap[];
  availableTopics: Topic[];
  onUpdateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'yes_no', label: 'Tak/Nie' },
  { value: 'single_answer', label: 'Jednoznaczna' },
  { value: 'open_ended', label: 'Otwarte' },
  { value: 'fill_blank', label: 'Uzupełnij' },
  { value: 'code_write', label: 'Napisz kod' },
  { value: 'code_explain', label: 'Wyjaśnij kod' },
  { value: 'chronology', label: 'Chronologia' },
];

const difficultyLevels: { value: DifficultyLevel; label: string }[] = [
  { value: 'beginner', label: 'Początkujący' },
  { value: 'intermediate', label: 'Średni' },
  { value: 'advanced', label: 'Zaawansowany' },
  { value: 'expert', label: 'Ekspert' },
];

const importanceLevels: { value: ImportanceLevel; label: string }[] = [
  { value: 'low', label: 'Niska' },
  { value: 'medium', label: 'Średnia' },
  { value: 'high', label: 'Wysoka' },
  { value: 'critical', label: 'Krytyczna' },
];

export const QuestionFilters = ({
  filters,
  categories,
  availableRoadmaps,
  availableTopics,
  onUpdateFilter,
  onResetFilters,
  totalCount,
  filteredCount,
}: QuestionFiltersProps) => {
  const hasActiveFilters = 
    filters.search || 
    filters.categoryId || 
    filters.roadmapId || 
    filters.topicId ||
    filters.type || 
    filters.difficulty || 
    filters.importance;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj pytań..."
          value={filters.search}
          onChange={(e) => onUpdateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {/* Category */}
        <Select
          value={filters.categoryId || 'all'}
          onValueChange={(v) => onUpdateFilter('categoryId', v === 'all' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kategoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Roadmap */}
        <Select
          value={filters.roadmapId || 'all'}
          onValueChange={(v) => onUpdateFilter('roadmapId', v === 'all' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Roadmapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie roadmapy</SelectItem>
            {availableRoadmaps.map(r => (
              <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Topic */}
        <Select
          value={filters.topicId || 'all'}
          onValueChange={(v) => onUpdateFilter('topicId', v === 'all' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Temat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie tematy</SelectItem>
            {availableTopics.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(v) => onUpdateFilter('type', v === 'all' ? null : v as QuestionType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie typy</SelectItem>
            {questionTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty */}
        <Select
          value={filters.difficulty || 'all'}
          onValueChange={(v) => onUpdateFilter('difficulty', v === 'all' ? null : v as DifficultyLevel)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Trudność" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie poziomy</SelectItem>
            {difficultyLevels.map(d => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Importance */}
        <Select
          value={filters.importance || 'all'}
          onValueChange={(v) => onUpdateFilter('importance', v === 'all' ? null : v as ImportanceLevel)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ważność" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie poziomy</SelectItem>
            {importanceLevels.map(i => (
              <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filters summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Wyświetlono <span className="font-medium text-foreground">{filteredCount}</span> z{' '}
            <span className="font-medium text-foreground">{totalCount}</span> pytań
          </span>
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Wyczyść filtry
          </Button>
        )}
      </div>
    </div>
  );
};
