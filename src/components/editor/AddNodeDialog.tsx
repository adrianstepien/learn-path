import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
}

export const AddNodeDialog = ({ isOpen, onClose, onAdd }: AddNodeDialogProps) => {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy temat</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Nazwa tematu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Dodaj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
