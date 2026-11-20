import { motion } from 'framer-motion';
import { ArrowRight, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LanguageSummaryDto } from '@/lib/api/languages';

interface LanguageDueReviewCardProps {
  languages: LanguageSummaryDto[];
}

export const LanguageDueReviewCard = ({ languages }: LanguageDueReviewCardProps) => {
  const navigate = useNavigate();

  const dueLanguages = languages.filter((lang) => lang.dueCards > 0);
  const totalDue = dueLanguages.reduce((acc, lang) => acc + lang.dueCards, 0);

  if (totalDue === 0) return null;

  const isSingleLanguage = dueLanguages.length === 1;
  const primaryLang = dueLanguages[0];

  const getWordLabel = (count: number) => {
    if (count === 1) return 'słówko';
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'słówka';
    return 'słówek';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl gradient-accent p-6 shadow-lg"
    >
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/20" />
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Languages className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-foreground/80">Powtórka językowa</p>
            <p className="text-3xl font-bold text-primary-foreground">
              {totalDue} {getWordLabel(totalDue)}
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm text-primary-foreground/80">
          {isSingleLanguage
            ? `${primaryLang.name}: system SRS przygotował słówka do powtórki.`
            : 'Wybierz język, aby rozpocząć osobną sesję SRS.'}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2">
        {isSingleLanguage ? (
          <Button
            onClick={() => navigate(`/languages/${primaryLang.code.toLowerCase()}/study?mode=SRS`)}
            className="bg-white/20 text-primary-foreground hover:bg-white/30 backdrop-blur-sm"
          >
            Rozpocznij ({primaryLang.code})
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          dueLanguages.map((lang) => (
            <Button
              key={lang.code}
              onClick={() => navigate(`/languages/${lang.code.toLowerCase()}/study?mode=SRS`)}
              className="bg-white/20 text-primary-foreground hover:bg-white/30 backdrop-blur-sm"
            >
              {lang.name} ({lang.dueCards})
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ))
        )}
      </div>
    </motion.div>
  );
};