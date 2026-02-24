import { motion } from 'framer-motion';
import { 
  BookOpen,
  Brain,
  Target,
  Clock,
  Flame,
  Loader2 // Dodano Loader
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/home/StatsCard';
import { ProgressRing } from '@/components/home/ProgressRing';
import { RecentActivity } from '@/components/home/RecentActivity';
import { DueReviewCard } from '@/components/home/DueReviewCard';
// Importujemy nowo utworzony hook (dostosuj ścieżkę do swojego projektu)
import { useAnalyticsSummary } from '@/hooks/queries/useAnalyticsSummary';

const MainPage = () => {
  // Pobieramy dane z API za pomocą React Query
  const { data: summary, isLoading, isError } = useAnalyticsSummary();

  // Obsługa ładowania
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
        {summary.cardsDueToday > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10"
          >
            <DueReviewCard count={summary.cardsDueToday} />
          </motion.div>
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
              subtitle="dni z rzędu"
              icon={Flame}
              variant="warning"
              delay={0.2}
            />
            <StatsCard
              title="Czas nauki"
              value={`${hoursSpent}h`}
              subtitle="łącznie"
              icon={Clock}
              delay={0.3}
            />
          </div>

          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-card backdrop-blur-sm"
          >
            <h3 className="mb-6 text-xl font-semibold text-foreground">Postęp ogólny</h3>
            <div className="flex flex-wrap items-center justify-around gap-12">
              <div className="text-center">
                <ProgressRing progress={overallProgress} size={140} label="ukończono" />
                <p className="mt-4 text-sm font-medium text-muted-foreground">Wszystkie pytania</p>
              </div>
              <div className="text-center">
                <ProgressRing progress={topicsProgress} size={140} label="tematów" />
                <p className="mt-4 text-sm font-medium text-muted-foreground">Opanowane tematy</p>
              </div>

              <div className="min-w-[250px] space-y-6">
                <div className="flex items-center gap-4">
                  <Target className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Cel tygodniowy</p>
                    {/* Ten element możesz ewentualnie podłączyć pod przyszły endpoint dla celów,
                        na ten moment zostawiłem statyczne 70% jak w Twoim pierwotnym kodzie */}
                    <div className="mt-2 h-3 w-full rounded-full bg-secondary">
                      <div className="h-3 w-[70%] rounded-full gradient-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity z wstrzykniętą listą `recentlyStudied` */}
          <RecentActivity activities={summary.recentlyStudied} />
        </div>
      </div>
    </MainLayout>
  );
};

export default MainPage;