import { motion } from 'framer-motion';
import { 
  BookOpen,
  Brain,
  Target,
  Clock,
  Flame,
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/home/StatsCard';
import { ProgressRing } from '@/components/home/ProgressRing';
import { RecentActivity } from '@/components/home/RecentActivity';
import { RetentionAndForecastSection } from '@/components/home/RetentionAndForecastSection';
import { DueReviewCard } from '@/components/home/DueReviewCard';
import { useAnalyticsSummary } from '@/hooks/queries/useAnalyticsSummary';
// Dodaj importy u góry MainPage.tsx:
import { LanguageDueReviewCard } from '@/components/home/LanguageDueReviewCard';
import { useLanguages } from '@/hooks/queries/useLanguages';
import { cn } from '@/lib/utils';

const MainPage = () => {
  // Pobieramy dane z API za pomocą React Query
  const { data: summary, isLoading, isError } = useAnalyticsSummary();
const { data: languages = [] } = useLanguages();


  const getDaysLabel = (days: number) => {
    if (days === 1) return 'dzień z rzędu';
    return 'dni z rzędu';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Obsługa błędów / braku danych
  if (isError || !summary) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] w-full items-center justify-center">
          <p className="text-destructive font-medium">Nie udało się pobrać statystyk.</p>
        </div>
      </MainLayout>
    );
  }
const hasKnowledgeDue = summary.cardsDueToday > 0;
const hasLanguageDue = languages.some((lang) => lang.dueCards > 0);
const hasAnyDue = hasKnowledgeDue || hasLanguageDue;
const hasBothDue = hasKnowledgeDue && hasLanguageDue;
  // Przeliczanie danych z DTO
  const hoursSpent = Math.floor(summary.timeSpentLearningSeconds / 3600);

  // Zabezpieczenie przed dzieleniem przez zero dla ProgressRingów
  const overallProgress = summary.cardsTotal > 0
    ? Math.round((summary.cardsLearned / summary.cardsTotal) * 100)
    : 0;

  const topicsProgress = summary.topicsTotal > 0
    ? Math.round((summary.topicsCompleted / summary.topicsTotal) * 100)
    : 0;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Background gradient glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full blur-3xl gradient-glow opacity-50" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        </div>

        {/* Header - Wyśrodkowany */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-10 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-foreground md:text-5xl">
            Witaj ponownie! 👋
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Kontynuuj naukę i rozwijaj swoje umiejętności
          </p>
        </motion.div>

        {/* DUE REVIEW CARD - renderowane warunkowo, gdy są karty do powtórki */}
        {hasAnyDue && (
          <div
            className={cn(
              'mb-10 grid gap-4',
              hasBothDue ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            )}
          >
            {hasKnowledgeDue && <DueReviewCard count={summary.cardsDueToday} />}
            {hasLanguageDue && <LanguageDueReviewCard languages={languages} />}
          </div>
        )}

        {/* Zawartość główna w jednej kolumnie */}
        <div className="space-y-8">
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Tematy"
              value={`${summary.topicsCompleted}/${summary.topicsTotal}`}
              subtitle="opanowanych"
              icon={BookOpen}
              variant="primary"
              delay={0}
            />
            <StatsCard
              title="Pytania"
              value={summary.cardsLearned}
              subtitle={`z ${summary.cardsTotal}`}
              icon={Brain}
              variant="accent"
              delay={0.1}
            />
            <StatsCard
              title="Seria dni"
              value={summary.currentStreakDays}
              subtitle={getDaysLabel(summary.currentStreakDays)}
              icon={Flame}
              variant="warning"
              delay={0.2}
            />
            <StatsCard
              title="Czas nauki"
              value={`${hoursSpent}h`}
              subtitle="łącznie"
              icon={Clock}
              variant="success"
              delay={0.3}
            />
          </div>
          <RetentionAndForecastSection
            trueRetention={summary.trueRetention}
            workloadForecast={summary.workloadForecast}
          />
          {/* Recent Activity z wstrzykniętą listą `recentlyStudied` */}
          <RecentActivity activities={summary.recentlyStudied} />
        </div>
      </div>
    </MainLayout>
  );
};

export default MainPage;