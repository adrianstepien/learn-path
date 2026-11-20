import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  CefrLevel,
  VocabLearningStatus,
  VocabRowDto,
  VocabSource,
} from '@/lib/api/languages';
import {
  useLanguageVocab,
  useLanguageVocabMutations,
  useLanguages,
} from '@/hooks/queries/useLanguages';
import { VocabFlashcardDialog } from './components/VocabFlashcardDialog';

const SOURCE_OPTIONS: { value: VocabSource | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Wszystkie listy' },
  { value: 'NGSL', label: '1. NGSL' },
  { value: 'NGSL_SPOKEN', label: '2. NGSL Spoken' },
  { value: 'PHAVE', label: '3. PHaVE' },
  { value: 'NAWL', label: '4. NAWL' },
  { value: 'OXFORD_3000', label: '5. Oxford 3000' },
  { value: 'OXFORD_5000', label: '6. Oxford 5000' },
  { value: 'BSL', label: '7. BSL' },
  { value: 'CUSTOM', label: 'Własne' },
];

const CEFR_OPTIONS: { value: CefrLevel | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Wszystkie poziomy' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' },
];

const STATUS_OPTIONS: { value: VocabLearningStatus; label: string }[] = [
  { value: 'ALL', label: 'Wszystkie statusy' },
  { value: 'NOT_STARTED', label: 'Nowe (do dodania)' },
  { value: 'LEARNING', label: 'W nauce (FSRS)' },
  { value: 'KNOWN', label: 'Znane' },
];

const PAGE_SIZE = 25;

type ConfirmAction =
  | { type: 'remove-learning'; row: VocabRowDto }
  | { type: 'delete-custom'; row: VocabRowDto }
  | null;

const LanguageVocabPage = () => {
  const { langCode = 'en' } = useParams<{ langCode: string }>();
  const normalizedCode = langCode.toUpperCase();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(0, Number(searchParams.get('page') || 0));
  const queryParam = searchParams.get('q') || '';
  const sourceParam = (searchParams.get('source') || 'ALL') as VocabSource | 'ALL';
  const cefrParam = (searchParams.get('cefr') || 'ALL') as CefrLevel | 'ALL';
  const statusParam = (searchParams.get('status') || 'ALL') as VocabLearningStatus;

  const [searchInput, setSearchInput] = useState(queryParam);
  const [dialogVocab, setDialogVocab] = useState<VocabRowDto | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const { data: languages = [] } = useLanguages();
  const currentLang = languages.find((l) => l.code.toUpperCase() === normalizedCode);

  const { data: vocabPage, isLoading, isFetching, isError } = useLanguageVocab(
    normalizedCode,
    {
      page,
      size: PAGE_SIZE,
      q: queryParam,
      source: sourceParam,
      cefr: cefrParam,
      status: statusParam,
    }
  );

  const { deleteFlashcard, deleteCustomWord, toggleKnown } =
    useLanguageVocabMutations(normalizedCode);

  // Debounce wyszukiwarki -> zapis do URL i reset strony do 0
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput === queryParam) return;
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        next.set('q', searchInput.trim());
      } else {
        next.delete('q');
      }
      next.set('page', '0');
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, queryParam, searchParams, setSearchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'ALL') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '0');
    setSearchParams(next, { replace: true });
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const handleToggleKnown = async (row: VocabRowDto) => {
    try {
      await toggleKnown.mutateAsync({ vocabId: row.id, known: !row.isKnown });
    } catch {
      toast.error('Nie udało się zaktualizować statusu słówka.');
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'remove-learning') {
        const flashcardId = confirmAction.row.primaryFlashcardId;
        if (flashcardId) {
          await deleteFlashcard.mutateAsync({
            flashcardId,
            vocabId: confirmAction.row.id,
          });
          toast.success(`Usunięto "${confirmAction.row.lemma}" z nauki.`);
        }
      } else {
        await deleteCustomWord.mutateAsync(confirmAction.row.id);
        toast.success(`Usunięto własne słówko "${confirmAction.row.lemma}".`);
      }
    } catch {
      toast.error('Operacja nie powiodła się.');
    } finally {
      setConfirmAction(null);
    }
  };

  const rows = vocabPage?.content ?? [];
  const totalPages = vocabPage?.totalPages ?? 0;
  const totalElements = vocabPage?.totalElements ?? 0;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Nagłówek */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/languages')}
              aria-label="Powrót do języków"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                {currentLang?.flag && <span className="text-2xl">{currentLang.flag}</span>}
                <h1 className="text-xl font-bold text-foreground md:text-2xl">
                  {currentLang?.name ?? normalizedCode}
                </h1>
                <Badge variant="secondary">{totalElements} słówek</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Wybierz słówka do nauki FSRS-6 lub edytuj istniejące fiszki
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(`/languages/${langCode.toLowerCase()}/study?mode=SRS`)}
              disabled={(currentLang?.activeFlashcards ?? 0) === 0}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Ucz się (SRS{currentLang?.dueCards ? `: ${currentLang.dueCards}` : ''})
            </Button>
          </div>
        </div>

        {/* Pasek filtrów */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Szukaj słówka lub tłumaczenia..."
              className="pl-9 pr-8"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={sourceParam} onValueChange={(v) => updateFilter('source', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Lista" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={cefrParam} onValueChange={(v) => updateFilter('cefr', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Poziom CEFR" />
            </SelectTrigger>
            <SelectContent>
              {CEFR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusParam} onValueChange={(v) => updateFilter('status', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela słówek */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-destructive">
              Nie udało się pobrać listy słówek.
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Brak słówek spełniających wybrane filtry.
            </div>
          ) : (
            <div className={isFetching ? 'opacity-70 transition-opacity' : ''}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Słówko</TableHead>
                    <TableHead className="w-[150px]">Lista / CEFR</TableHead>
                    <TableHead>Znaczenie / Status</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const inLearning = row.flashcardCount > 0;

                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-semibold text-foreground">{row.lemma}</span>
                            {row.ipa && (
                              <span className="font-mono text-xs text-muted-foreground">
                                {row.ipa}
                              </span>
                            )}
                            {row.isCustom && (
                              <Badge variant="outline" className="text-[10px]">
                                Własne
                              </Badge>
                            )}
                          </div>
                          {row.pos && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{row.pos}</p>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[11px]">
                              {row.primarySource}
                            </Badge>
                            {row.cefr && (
                              <Badge variant="outline" className="text-[11px]">
                                {row.cefr}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {inLearning ? (
                            <span className="text-sm text-foreground">
                              {row.nativeMeaningPreview || 'W nauce'}
                            </span>
                          ) : row.isKnown ? (
                            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">
                              Znane
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nie w nauce</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {!inLearning ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setDialogVocab(row)}
                                >
                                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                                  Dodaj do nauki
                                </Button>
                                <Button
                                  size="sm"
                                  variant={row.isKnown ? 'secondary' : 'ghost'}
                                  onClick={() => handleToggleKnown(row)}
                                  title={row.isKnown ? 'Cofnij oznaczenie' : 'Oznacz jako znane'}
                                >
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  {row.isKnown ? 'Znane' : 'Znam'}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setDialogVocab(row)}
                                >
                                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                  {row.flashcardCount > 1
                                    ? `Pokaż fiszki (${row.flashcardCount})`
                                    : 'Pokaż fiszkę'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() =>
                                    setConfirmAction({ type: 'remove-learning', row })
                                  }
                                >
                                  Usuń z nauki
                                </Button>
                              </>
                            )}

                            {row.isCustom && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setConfirmAction({ type: 'delete-custom', row })}
                                title="Usuń własne słówko z katalogu"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Paginacja */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Strona <strong className="text-foreground">{page + 1}</strong> z{' '}
              <strong className="text-foreground">{totalPages}</strong> (łącznie {totalElements})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Poprzednia
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Następna
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Wspólny modal dla "Dodaj do nauki" i "Pokaż fiszkę" */}
      <VocabFlashcardDialog
        open={dialogVocab !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogVocab(null);
        }}
        vocab={dialogVocab}
        langCode={normalizedCode}
      />

      {/* Potwierdzenie usunięcia */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete-custom'
                ? 'Usunąć własne słówko?'
                : 'Usunąć słówko z nauki?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete-custom'
                ? `Słówko "${confirmAction.row.lemma}" wraz z fiszką i historią FSRS-6 zostanie trwale usunięte z systemu.`
                : `Fiszka dla "${confirmAction?.row.lemma}" oraz jej postęp FSRS-6 zostaną usunięte. Samo słówko pozostanie w katalogu.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default LanguageVocabPage;