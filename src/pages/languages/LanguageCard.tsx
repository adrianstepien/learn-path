import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LanguageSummaryDto } from '@/lib/api/languages';

interface LanguageCardProps {
  language: LanguageSummaryDto;
  delay: number;
}

export const LanguageCard = ({ language, delay }: LanguageCardProps) => {
  const navigate = useNavigate();
  const slug = language.code.toLowerCase();

  // Procent opanowania aktywnej puli fiszek (analogicznie do CategoryCard)
  const progress =
    language.activeFlashcards > 0
      ? Math.round(
          ((language.activeFlashcards - language.dueCards) / language.activeFlashcards) * 100
        )
      : 0;

  const handleOpenVocab = () => {
    navigate(`/languages/${slug}`);
  };

  const handleStartSrs = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/languages/${slug}/study?mode=SRS`);
  };

  const handleReviewFuture = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/languages/${slug}/study?mode=FUTURE`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:border-primary/20 hover:shadow-lg"
    >
      {/* Kliknięcie kafelka otwiera tabelę słówek języka */}
      <div
        onClick={handleOpenVocab}
        className="cursor-pointer p-4 pb-4 transition-all hover:bg-gradient-to-br hover:from-secondary/50 hover:to-transparent md:p-6"
      >
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 md:h-14 md:w-14">
            <span className="text-2xl md:text-3xl">{language.flag}</span>

            {language.dueCards > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>

        <h3 className="mb-1 text-base font-bold text-foreground md:text-lg">
          {language.name}
        </h3>
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground md:mb-4 md:text-sm">
          {language.description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {`Do nauki: ${language.dueCards} / ${language.activeFlashcards} fiszek`}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary md:w-20">
              <div
                className="h-2 rounded-full gradient-accent transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <span className="text-xs font-bold text-foreground">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Dolny pasek akcji */}
      <div className="border-t border-border/50 bg-gradient-to-b from-secondary/30 to-secondary/10 px-3 py-3 md:px-6 md:py-4">
        <div className="flex flex-row items-center gap-2">
          <Button
            disabled={language.activeFlashcards === 0}
            className={cn(
              'min-w-0 flex-1 px-2 transition-all duration-300 sm:px-4',
              language.dueCards > 0
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30 hover:bg-violet-700'
                : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
            onClick={handleStartSrs}
          >
            <Play className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" />
            <span className="truncate text-xs sm:text-sm">Ucz się (SRS)</span>
          </Button>

          <Button
            variant="outline"
            disabled={language.activeFlashcards === 0}
            className="shrink-0 border border-transparent px-2 transition-colors hover:border-primary/20 hover:bg-background hover:text-primary sm:px-3"
            onClick={handleReviewFuture}
          >
            <RotateCcw className="mr-1.5 h-4 w-4 shrink-0 sm:mr-2" />
            <span className="text-xs sm:text-sm">Powtórz</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};