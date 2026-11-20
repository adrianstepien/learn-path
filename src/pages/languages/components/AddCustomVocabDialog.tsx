import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CefrLevel, VocabRowDto } from '@/lib/api/languages';
import { useLanguageVocabMutations } from '@/hooks/queries/useLanguages';

interface AddCustomVocabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  langCode: string;
  onCreated: (created: VocabRowDto, openFlashcardEditor: boolean) => void;
}

const CEFR_VALUES: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const AddCustomVocabDialog = ({
  open,
  onOpenChange,
  langCode,
  onCreated,
}: AddCustomVocabDialogProps) => {
  const { createCustomWord } = useLanguageVocabMutations(langCode);

  const [lemma, setLemma] = useState('');
  const [pos, setPos] = useState('');
  const [cefr, setCefr] = useState<CefrLevel | 'NONE'>('NONE');
  const [ipa, setIpa] = useState('');
  const [openEditorAfter, setOpenEditorAfter] = useState(true);

  const reset = () => {
    setLemma('');
    setPos('');
    setCefr('NONE');
    setIpa('');
    setOpenEditorAfter(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lemma.trim();
    if (!cleaned) {
      toast.error('Wpisz słówko lub wyrażenie.');
      return;
    }

    try {
      const created = await createCustomWord.mutateAsync({
        lemma: cleaned,
        pos: pos.trim() || undefined,
        cefr: cefr === 'NONE' ? undefined : cefr,
        ipa: ipa.trim() || undefined,
      });
      toast.success(`Dodano słówko "${created.lemma}".`);
      reset();
      onOpenChange(false);
      onCreated(created, openEditorAfter);
    } catch {
      toast.error('Nie udało się dodać słówka.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Dodaj własne słówko ({langCode})</DialogTitle>
            <DialogDescription>
              Własne słówka można w dowolnym momencie trwale usunąć z katalogu. Jeśli hasło
              już istnieje w słowniku, otworzy się istniejący wpis.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="customLemma">Słówko / wyrażenie *</Label>
              <Input
                id="customLemma"
                autoFocus
                value={lemma}
                onChange={(e) => setLemma(e.target.value)}
                placeholder="np. boilerplate, take for granted"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customPos">Część mowy</Label>
                <Input
                  id="customPos"
                  value={pos}
                  onChange={(e) => setPos(e.target.value)}
                  placeholder="np. noun, verb, idiom"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Poziom CEFR</Label>
                <Select
                  value={cefr}
                  onValueChange={(v) => setCefr(v as CefrLevel | 'NONE')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcjonalny" />
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

            <div className="space-y-1.5">
              <Label htmlFor="customIpa">Wymowa IPA (opcjonalna)</Label>
              <Input
                id="customIpa"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                placeholder="/ˈbɔɪlərpleɪt/"
                className="font-mono"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="openEditorAfter"
                checked={openEditorAfter}
                onCheckedChange={(checked) => setOpenEditorAfter(checked === true)}
              />
              <Label htmlFor="openEditorAfter" className="cursor-pointer text-sm font-normal">
                Od razu otwórz edytor fiszki (dodaj do nauki)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={createCustomWord.isPending}>
              {createCustomWord.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Dodaj słówko
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};