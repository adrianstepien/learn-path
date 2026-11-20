import { useEffect, useState } from 'react';
import {
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { uploadImageToServer } from '@/lib/api/cards';
import {
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
  vocab: VocabRowDto | null;
  langCode: string;
}

const emptySentence = (): VocabSentenceDto => ({
  sentenceNative: '',
  sentenceTarget: '',
  clozeTarget: '',
});

export const VocabFlashcardDialog = ({
  open,
  onOpenChange,
  vocab,
  langCode,
}: VocabFlashcardDialogProps) => {
  const hasExisting = (vocab?.flashcardCount ?? 0) > 0;
  const { data: existingCards = [], isLoading: isLoadingCards } = useVocabFlashcards(
    vocab?.id ?? null,
    open && hasExisting
  );

  const {
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    generateDraftAi,
    generateExtraSentence,
  } = useLanguageVocabMutations(langCode);

  // null = tryb tworzenia nowej fiszki; number = edycja fiszki o podanym id
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  const [targetWord, setTargetWord] = useState('');
  const [nativeMeaning, setNativeMeaning] = useState('');
  const [hint, setHint] = useState('');
  const [ipa, setIpa] = useState('');
  const [trapNote, setTrapNote] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sentences, setSentences] = useState<VocabSentenceDto[]>([emptySentence()]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fillFormFromCard = (card: VocabFlashcardDto) => {
    setActiveCardId(card.id);
    setTargetWord(card.targetWord);
    setNativeMeaning(card.nativeMeaning);
    setHint(card.hint ?? '');
    setIpa(card.ipa ?? '');
    setTrapNote(card.trapNote ?? '');
    setImageUrl(card.imageUrl ?? null);
    setSentences(card.sentences.length > 0 ? card.sentences : [emptySentence()]);
  };

  const resetFormForCreate = (row: VocabRowDto) => {
    setActiveCardId(null);
    setTargetWord(row.lemma);
    setNativeMeaning('');
    setHint(row.lemma ? `${row.lemma[0]}...` : '');
    setIpa(row.ipa ?? '');
    setTrapNote('');
    setImageUrl(null);
    setSentences([emptySentence()]);
  };

  useEffect(() => {
    if (!open || !vocab) return;
    if (hasExisting) {
      if (existingCards.length > 0) {
        fillFormFromCard(existingCards[0]);
      }
    } else {
      resetFormForCreate(vocab);
    }
  }, [open, vocab, hasExisting, existingCards]);

  const handleGenerateWithAi = async () => {
    if (!vocab) return;
    try {
      const draft = await generateDraftAi.mutateAsync(vocab.id);
      setNativeMeaning(draft.nativeMeaning);
      if (draft.hint !== undefined && draft.hint !== null) setHint(draft.hint);
      if (draft.trapNote !== undefined && draft.trapNote !== null) setTrapNote(draft.trapNote);
      if (draft.sentences.length > 0) setSentences(draft.sentences);
      toast.success('Wygenerowano propozycję fiszki. Sprawdź pola przed zapisem.');
    } catch {
      toast.error('Nie udało się wygenerować treści przez AI.');
    }
  };

  const handleGenerateExtraSentence = async () => {
    if (!activeCardId) return;
    try {
      const sentence = await generateExtraSentence.mutateAsync(activeCardId);
      setSentences((prev) => [...prev, sentence]);
      toast.success('Dodano nowe zdanie z AI.');
    } catch {
      toast.error('Nie udało się wygenerować kolejnego zdania.');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageToServer(file);
      setImageUrl(uploadedUrl);
      toast.success('Zdjęcie wgrane.');
    } catch {
      toast.error('Nie udało się wgrać zdjęcia.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const updateSentence = (index: number, field: keyof VocabSentenceDto, value: string) => {
    setSentences((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const removeSentence = (index: number) => {
    setSentences((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [emptySentence()]));
  };

  const handleSave = async () => {
    if (!vocab) return;
    if (!targetWord.trim() || !nativeMeaning.trim()) {
      toast.error('Wypełnij słówko docelowe i polskie znaczenie.');
      return;
    }

    const validSentences = sentences
      .map((s) => ({
        id: s.id,
        sentenceNative: s.sentenceNative.trim(),
        sentenceTarget: s.sentenceTarget.trim(),
        clozeTarget: s.clozeTarget?.trim() || null,
      }))
      .filter((s) => s.sentenceNative && s.sentenceTarget);

    const payload = {
      vocabId: vocab.id,
      targetWord: targetWord.trim(),
      nativeMeaning: nativeMeaning.trim(),
      hint: hint.trim() || null,
      ipa: ipa.trim() || null,
      trapNote: trapNote.trim() || null,
      imageUrl,
      sentences: validSentences,
    };

    try {
      if (activeCardId === null) {
        await createFlashcard.mutateAsync(payload);
        toast.success(`Dodano "${targetWord.trim()}" do nauki FSRS-6.`);
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

  const isSaving = createFlashcard.isPending || updateFlashcard.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span>{vocab?.lemma}</span>
                {vocab?.cefr && <Badge variant="outline">{vocab.cefr}</Badge>}
                {vocab?.primarySource && (
                  <Badge variant="secondary">{vocab.primarySource}</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {vocab?.posCefrDetails || vocab?.pos || 'Konfiguracja fiszki PL → obcy'}
              </DialogDescription>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGenerateWithAi}
              disabled={generateDraftAi.isPending || !vocab}
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

        {/* Przełącznik znaczeń dla słów wieloznacznych */}
        {existingCards.length > 0 && vocab && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
            {existingCards.map((card, idx) => (
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
              onClick={() => resetFormForCreate(vocab)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Kolejne znaczenie
            </Button>
          </div>
        )}

        {vocab?.exampleHint && (
          <div className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
            <strong className="text-foreground">Zakres znaczeń z korpusu:</strong>{' '}
            {vocab.exampleHint}
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
                <Label htmlFor="nativeMeaning">Znaczenie po polsku (przód karty) *</Label>
                <Input
                  id="nativeMeaning"
                  value={nativeMeaning}
                  onChange={(e) => setNativeMeaning(e.target.value)}
                  placeholder="np. odłożyć na później (termin)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetWord">Słówko docelowe (tył karty) *</Label>
                <Input
                  id="targetWord"
                  value={targetWord}
                  onChange={(e) => setTargetWord(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="hint">Podpowiedź (opcjonalna)</Label>
                <Input
                  id="hint"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="np. p... / czasownik"
                />
              </div>

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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trapNote">Kolokacje / pułapka (opcjonalna)</Label>
              <Textarea
                id="trapNote"
                rows={2}
                value={trapNote}
                onChange={(e) => setTrapNote(e.target.value)}
                placeholder="np. postpone + -ing (nie 'to'); fałszywy przyjaciel..."
              />
            </div>

            {/* Sekcja zdjęcia */}
            <div className="space-y-2">
              <Label>Zdjęcie skojarzeniowe (opcjonalne)</Label>
              {imageUrl ? (
                <div className="relative inline-block overflow-hidden rounded-xl border border-border">
                  <img
                    src={imageUrl}
                    alt={targetWord}
                    className="max-h-40 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    <span>{isUploadingImage ? 'Wgrywanie...' : 'Dodaj zdjęcie'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingImage}
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Pula zdań kontekstowych (1:N) */}
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
                  <Input
                    value={s.clozeTarget ?? ''}
                    onChange={(e) => updateSentence(idx, 'clozeTarget', e.target.value)}
                    placeholder="Wersja z luką (opcjonalna), np. We need to ________ the meeting."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>
            {activeCardId !== null && (
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
            <Button type="button" onClick={handleSave} disabled={isSaving || isUploadingImage}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {activeCardId === null ? 'Zapisz i dodaj do nauki' : 'Zapisz zmiany'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};