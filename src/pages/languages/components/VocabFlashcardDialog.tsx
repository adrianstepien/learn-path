import { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { RichTextEditor } from '@/components/texteditor/RichTextEditor';
import {
  CefrLevel,
  VocabFlashcardDto,
  VocabRowDto,
  VocabSentenceDto,
} from '@/lib/api/languages';
import {
  useLanguageVocabMutations,
  useVocabFlashcards,
} from '@/hooks/queries/useLanguages';

interface VocabFlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'custom' | 'vocab';
  vocab: VocabRowDto | null;
  langCode: string;
}

const CEFR_VALUES: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const emptySentence = (): VocabSentenceDto => ({
  sentenceNative: '',
  sentenceTarget: '',
});

const normalizeRichText = (html: string): string | null => {
  const trimmed = html.trim();
  if (!trimmed || trimmed === '<p></p>') return null;
  return trimmed;
};

export const VocabFlashcardDialog = ({
  open,
  onOpenChange,
  mode,
  vocab,
  langCode,
}: VocabFlashcardDialogProps) => {
  const isCustomMode = mode === 'custom';
  const hasExisting = !isCustomMode && (vocab?.flashcardCount ?? 0) > 0;

  const {
    data: existingCards,
    isLoading: isLoadingCards,
    isSuccess: isCardsSuccess,
  } = useVocabFlashcards(vocab?.id ?? null, open && hasExisting);

  const {
    createCustomWord,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    generateDraftAi,
    generateExtraSentence,
  } = useLanguageVocabMutations(langCode);

  const initializedForRef = useRef<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [resolvedVocabId, setResolvedVocabId] = useState<number | null>(vocab?.id ?? null);
  const [editorKey, setEditorKey] = useState(0);

  const [targetWord, setTargetWord] = useState('');
  const [nativeMeaning, setNativeMeaning] = useState('');
  const [ipa, setIpa] = useState('');
  const [customPos, setCustomPos] = useState('');
  const [customCefr, setCustomCefr] = useState<CefrLevel | 'NONE'>('NONE');
  const [trapNote, setTrapNote] = useState('');
  const [sentences, setSentences] = useState<VocabSentenceDto[]>([emptySentence()]);

  const fillFormFromCard = (card: VocabFlashcardDto) => {
    setActiveCardId(card.id);
    setResolvedVocabId(card.vocabId);
    setTargetWord(card.targetWord);
    setNativeMeaning(card.nativeMeaning);
    setIpa(card.ipa ?? '');
    setTrapNote(card.trapNote ?? '');
    setSentences(
      card.sentences.length > 0
        ? card.sentences.map(({ id, sentenceNative, sentenceTarget }) => ({
            id,
            sentenceNative,
            sentenceTarget,
          }))
        : [emptySentence()]
    );
    setEditorKey((k) => k + 1);
  };

  const resetForm = (row: VocabRowDto | null) => {
    setActiveCardId(null);
    setResolvedVocabId(row?.id ?? null);
    setTargetWord(row?.lemma ?? '');
    setNativeMeaning('');
    setIpa(row?.ipa ?? '');
    setCustomPos('');
    setCustomCefr('NONE');
    setTrapNote('');
    setSentences([emptySentence()]);
    setEditorKey((k) => k + 1);
  };

  useEffect(() => {
    if (!open) {
      initializedForRef.current = null;
      return;
    }

    const initKey = isCustomMode
      ? 'custom'
      : `${vocab?.id ?? 'none'}-${hasExisting ? 'edit' : 'create'}`;

    if (initializedForRef.current === initKey) return;

    if (isCustomMode) {
      resetForm(null);
      initializedForRef.current = initKey;
      return;
    }

    if (!vocab) return;

    if (!hasExisting) {
      resetForm(vocab);
      initializedForRef.current = initKey;
      return;
    }

    if (isCardsSuccess && existingCards) {
      if (existingCards.length > 0) {
        fillFormFromCard(existingCards[0]);
      } else {
        resetForm(vocab);
      }
      initializedForRef.current = initKey;
    }
  }, [open, isCustomMode, vocab, hasExisting, isCardsSuccess, existingCards]);

  const handleGenerateWithAi = async () => {
    const word = targetWord.trim();
    if (!word) {
      toast.error('Najpierw wpisz słówko docelowe.');
      return;
    }

    try {
      const draft = await generateDraftAi.mutateAsync({
        languageCode: langCode,
        vocabId: isCustomMode ? undefined : vocab?.id,
        targetWord: word,
      });
      setNativeMeaning(draft.nativeMeaning);
      if (draft.ipa && !ipa.trim()) setIpa(draft.ipa);
      if (draft.trapNote) {
        setTrapNote(draft.trapNote);
        setEditorKey((k) => k + 1);
      }
      if (draft.sentences.length > 0) {
        setSentences(
          draft.sentences.map(({ id, sentenceNative, sentenceTarget }) => ({
            id,
            sentenceNative,
            sentenceTarget,
          }))
        );
      }
      toast.success('Wygenerowano propozycję fiszki. Sprawdź pola przed zapisem.');
    } catch {
      toast.error('Nie udało się wygenerować treści przez AI.');
    }
  };

  const handleGenerateExtraSentence = async () => {
    if (!activeCardId || !resolvedVocabId) return;
    try {
      const sentence = await generateExtraSentence.mutateAsync({
        flashcardId: activeCardId,
        vocabId: resolvedVocabId,
      });
      setSentences((prev) => [
        ...prev,
        {
          id: sentence.id,
          sentenceNative: sentence.sentenceNative,
          sentenceTarget: sentence.sentenceTarget,
        },
      ]);
      toast.success('Dodano nowe zdanie z AI.');
    } catch {
      toast.error('Nie udało się wygenerować kolejnego zdania.');
    }
  };

  const updateSentence = (index: number, field: keyof VocabSentenceDto, value: string) => {
    setSentences((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const removeSentence = (index: number) => {
    setSentences((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : [emptySentence()]
    );
  };

  const handleSave = async () => {
    const cleanedTarget = targetWord.trim();
    const cleanedNative = nativeMeaning.trim();
    if (!cleanedTarget || !cleanedNative) {
      toast.error('Wypełnij słówko docelowe i polskie znaczenie.');
      return;
    }

    const validSentences = sentences
      .map((s) => ({
        id: s.id,
        sentenceNative: s.sentenceNative.trim(),
        sentenceTarget: s.sentenceTarget.trim(),
      }))
      .filter((s) => s.sentenceNative && s.sentenceTarget);

    try {
      let targetVocabId = vocab?.id;

      if (isCustomMode) {
        const createdVocab = await createCustomWord.mutateAsync({
          lemma: cleanedTarget,
          pos: customPos.trim() || undefined,
          cefr: customCefr === 'NONE' ? undefined : customCefr,
          ipa: ipa.trim() || undefined,
        });
        targetVocabId = createdVocab.id;
      }

      if (!targetVocabId) return;

      const payload = {
        vocabId: targetVocabId,
        targetWord: cleanedTarget,
        nativeMeaning: cleanedNative,
        ipa: ipa.trim() || null,
        trapNote: normalizeRichText(trapNote),
        sentences: validSentences,
      };

      if (activeCardId === null) {
        await createFlashcard.mutateAsync(payload);
        toast.success(`Dodano "${cleanedTarget}" do nauki FSRS-6.`);
      } else {
        await updateFlashcard.mutateAsync({ flashcardId: activeCardId, payload });
        toast.success('Zapisano zmiany w fiszce.');
      }
      onOpenChange(false);
    } catch {
      toast.error('Nie udało się zapisać fiszki.');
    }
  };

  const handleDeleteCurrentCard = async () => {
    if (!vocab || activeCardId === null) return;
    try {
      await deleteFlashcard.mutateAsync({ flashcardId: activeCardId, vocabId: vocab.id });
      toast.success('Usunięto fiszkę z nauki.');
      onOpenChange(false);
    } catch {
      toast.error('Nie udało się usunąć fiszki.');
    }
  };

  const cardsList = existingCards ?? [];
  const isSaving =
    createCustomWord.isPending || createFlashcard.isPending || updateFlashcard.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span>{isCustomMode ? 'Nowe własne słówko' : vocab?.lemma}</span>
                {!isCustomMode && vocab?.cefr && (
                  <Badge variant="outline">{vocab.cefr}</Badge>
                )}
                {!isCustomMode && vocab && (
                  <Badge variant="secondary">
                    {vocab.isCustom ? 'Własne' : 'Słownik'}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isCustomMode
                  ? `Dodaj słówko (${langCode}) i od razu utwórz fiszkę FSRS-6`
                  : vocab?.posCefrDetails || vocab?.pos || 'Konfiguracja fiszki PL → obcy'}
              </DialogDescription>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGenerateWithAi}
              disabled={generateDraftAi.isPending || !targetWord.trim()}
            >
              {generateDraftAi.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
              )}
              Generuj z AI
            </Button>
          </div>
        </DialogHeader>

        {!isCustomMode && cardsList.length > 0 && vocab && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
            {cardsList.map((card, idx) => (
              <Button
                key={card.id}
                type="button"
                size="sm"
                variant={activeCardId === card.id ? 'default' : 'outline'}
                onClick={() => fillFormFromCard(card)}
              >
                Znaczenie {idx + 1}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant={activeCardId === null ? 'default' : 'ghost'}
              onClick={() => resetForm(vocab)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Kolejne znaczenie
            </Button>
          </div>
        )}

        {!isCustomMode && vocab?.exampleHint && (
          <div className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
            <strong className="text-foreground">Zakres znaczeń:</strong> {vocab.exampleHint}
          </div>
        )}

        {isLoadingCards ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="targetWord">Słówko docelowe (tył karty) *</Label>
                <Input
                  id="targetWord"
                  autoFocus={isCustomMode}
                  value={targetWord}
                  onChange={(e) => setTargetWord(e.target.value)}
                  placeholder="np. boilerplate, postpone"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nativeMeaning">Znaczenie po polsku (przód karty) *</Label>
                <Input
                  id="nativeMeaning"
                  autoFocus={!isCustomMode}
                  value={nativeMeaning}
                  onChange={(e) => setNativeMeaning(e.target.value)}
                  placeholder="np. odłożyć na później (termin)"
                />
              </div>
            </div>

            {isCustomMode && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="customPos">Część mowy (opcjonalna)</Label>
                  <Input
                    id="customPos"
                    value={customPos}
                    onChange={(e) => setCustomPos(e.target.value)}
                    placeholder="np. noun, verb, idiom"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Poziom CEFR (opcjonalny)</Label>
                  <Select
                    value={customCefr}
                    onValueChange={(v) => setCustomCefr(v as CefrLevel | 'NONE')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Brak" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Brak</SelectItem>
                      {CEFR_VALUES.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ipa">Wymowa IPA</Label>
              <Input
                id="ipa"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                placeholder="/poʊstˈpoʊn/"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Dodatkowe informacje</Label>
              <RichTextEditor
                key={editorKey}
                content={trapNote}
                onChange={setTrapNote}
                placeholder="np. postpone + -ing (nie 'to'); wklej zdjęcie przez Ctrl+V..."
                minHeight="110px"
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Zdania kontekstowe (pogrubiaj cel przez **tekst**)</Label>
                <div className="flex items-center gap-2">
                  {activeCardId !== null && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateExtraSentence}
                      disabled={generateExtraSentence.isPending}
                    >
                      {generateExtraSentence.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      )}
                      Dogeneruj zdanie (AI)
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSentences((prev) => [...prev, emptySentence()])}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Dodaj ręcznie
                  </Button>
                </div>
              </div>

              {sentences.map((s, idx) => (
                <div
                  key={s.id ?? idx}
                  className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Zdanie #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSentence(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input
                    value={s.sentenceNative}
                    onChange={(e) => updateSentence(idx, 'sentenceNative', e.target.value)}
                    placeholder="Zdanie po polsku, np. Musimy **odłożyć** spotkanie."
                  />
                  <Input
                    value={s.sentenceTarget}
                    onChange={(e) => updateSentence(idx, 'sentenceTarget', e.target.value)}
                    placeholder="Zdanie w języku docelowym, np. We need to postpone the meeting."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>
            {!isCustomMode && activeCardId !== null && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteCurrentCard}
                disabled={deleteFlashcard.isPending}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Usuń tę fiszkę
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {activeCardId === null ? 'Zapisz i dodaj do nauki' : 'Zapisz zmiany'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};