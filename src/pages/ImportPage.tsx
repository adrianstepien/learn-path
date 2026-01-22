import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, 
  FileText, 
  Video, 
  Book, 
  Sparkles,
  Upload,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const ImportPage = () => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<null | {
    title: string;
    summary: string;
    suggestedQuestions: string[];
  }>(null);

  const handleProcess = async () => {
    if (!url.trim()) return;
    
    setIsProcessing(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setResult({
      title: 'Docker Tutorial for Beginners',
      summary: 'Ten materiał wprowadza podstawy konteneryzacji z Docker. Omawia kluczowe koncepcje: obrazy, kontenery, Dockerfile oraz Docker Compose. Szczególny nacisk położono na praktyczne aspekty pracy z kontenerami w środowisku deweloperskim.',
      suggestedQuestions: [
        'Wyjaśnij różnicę między obrazem Docker a kontenerem',
        'Jakie są główne komendy Docker do zarządzania kontenerami?',
        'Co to jest Dockerfile i jakie ma główne instrukcje?',
        'Jak działa Docker Compose i kiedy go używać?',
        'Jakie są best practices przy tworzeniu obrazów Docker?'
      ]
    });
    setIsProcessing(false);
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">Import materiałów</h1>
          <p className="mt-2 text-muted-foreground">
            Wklej link do filmu lub książki, a AI wygeneruje streszczenie i pytania
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-md mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Link2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Wklej link do materiału</h2>
              <p className="text-sm text-muted-foreground">YouTube, Vimeo, artykuły, PDF</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleProcess} disabled={!url.trim() || isProcessing}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Przetwarzam...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analizuj
                </>
              )}
            </Button>
          </div>

          {/* Supported formats */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="h-4 w-4" />
              YouTube / Vimeo
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Artykuły / Blogi
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Book className="h-4 w-4" />
              Książki / PDF
            </div>
          </div>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
              <h3 className="flex items-center gap-2 font-semibold text-foreground mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                Streszczenie AI
              </h3>
              <h4 className="text-lg font-medium text-foreground mb-2">{result.title}</h4>
              <p className="text-muted-foreground">{result.summary}</p>
            </div>

            {/* Suggested Questions */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
              <h3 className="font-semibold text-foreground mb-4">
                Sugerowane pytania ({result.suggestedQuestions.length})
              </h3>
              <div className="space-y-3">
                {result.suggestedQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-foreground">{question}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end gap-3">
              <Button variant="outline">
                Edytuj przed zapisem
              </Button>
              <Button>
                Przypisz do roadmapy
              </Button>
            </div>
          </motion.div>
        )}

        {/* Upload Alternative */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50 cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground mb-2">Lub przeciągnij plik tutaj</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX, TXT (max 10MB)</p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ImportPage;
