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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Resource } from '@/types/learning';
import { RichTextEditor } from '@/components/texteditor/RichTextEditor';
import { FileText, Video, Link } from 'lucide-react';

interface ResourceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resource?: Resource | null;
  onSave: (resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => void;
  mode: 'add' | 'edit';
  defaultType?: Resource['type'];
}

const resourceTypes: { value: Resource['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'note', label: 'Notatka (Tekst)', icon: <FileText className="h-4 w-4" /> },
  { value: 'article', label: 'Artykuł (link)', icon: <Link className="h-4 w-4" /> },
  { value: 'video', label: 'Video (link)', icon: <Video className="h-4 w-4" /> },
];

export const ResourceFormDialog = ({
  isOpen,
  onClose,
  resource,
  onSave,
  mode,
  defaultType = 'note',
}: ResourceFormDialogProps) => {
  const [type, setType] = useState<Resource['type']>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && resource) {
        setType(resource.type);
        setTitle(resource.title);
        setContent(resource.content || '');
        setUrl(resource.url || '');
        setEstimatedMinutes(resource.estimatedMinutes || 10);
      } else {
        // Reset for add mode with default type
        setType(defaultType);
        setTitle('');
        setContent('');
        setUrl('');
        setEstimatedMinutes(10);
      }
    }
  }, [isOpen, resource, mode, defaultType]);

  const handleSave = () => {
    if (!title.trim()) return;
    if (type !== 'note' && !url.trim()) return;

    onSave({
      type,
      title: title.trim(),
      content: type === 'note' ? content : undefined,
      url: type !== 'note' ? url.trim() : undefined,
      estimatedMinutes,
    });

    onClose();
  };

  const isValid = title.trim() && (type === 'note' || url.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edytuj materiał' : 'Dodaj nowy materiał'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Zmodyfikuj właściwości materiału edukacyjnego.'
              : 'Dodaj nowy materiał - notatkę, artykuł lub video.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type selection */}
          <div className="space-y-2">
            <Label>Typ materiału</Label>
            <Select value={type} onValueChange={(v) => setType(v as Resource['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      {t.icon}
                      <span>{t.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Tytuł *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nazwa materiału..."
            />
          </div>

          {/* Type-specific content */}
          {type === 'note' ? (
            <div className="space-y-2">
              <Label>Treść</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Napisz opis, notatki lub materiał edukacyjny..."
                minHeight="200px"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>URL {type === 'video' ? 'do video' : 'do artykułu'} *</Label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://example.com/article'}
              />
            </div>
          )}

          {/* Estimated time */}
          <div className="space-y-2">
            <Label>Szacowany czas (minuty)</Label>
            <Input
              type="number"
              min={1}
              max={999}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 10)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === 'edit' ? 'Zapisz zmiany' : 'Dodaj materiał'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
