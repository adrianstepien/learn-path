import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguages } from '@/hooks/queries/useLanguages';
import { LanguageCard } from './components/LanguageCard';

const LanguageSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
    <div className="mb-4 flex items-center justify-between">
      <Skeleton className="h-12 w-12 rounded-xl md:h-14 md:w-14" />
      <Skeleton className="h-5 w-5" />
    </div>
    <Skeleton className="mb-2 h-6 w-1/2" />
    <Skeleton className="mb-4 h-4 w-full" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-2 w-20" />
    </div>
  </div>
);

const LanguagesPage = () => {
  const { data: languages = [], isLoading, isError } = useLanguages();

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Header spójny z LearnPageHeader */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 md:h-12 md:w-12">
              <Languages className="h-5 w-5 text-primary md:h-6 md:w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground md:text-2xl">Języki</h1>
              <p className="text-sm text-muted-foreground">
                Wybierz język, aby przeglądać słownictwo lub rozpocząć powtórkę
              </p>
            </div>
          </div>
        </motion.div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2].map((i) => (
              <LanguageSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="py-12 text-center">
            <p className="font-medium text-destructive">
              Nie udało się pobrać listy języków.
            </p>
          </div>
        )}

        {!isLoading && !isError && languages.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Brak skonfigurowanych języków w bazie.</p>
          </div>
        )}

        {!isLoading && !isError && languages.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {languages.map((language, index) => (
              <LanguageCard
                key={language.code}
                language={language}
                delay={index * 0.05}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LanguagesPage;