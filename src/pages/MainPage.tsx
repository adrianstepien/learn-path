import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Target, 
  Clock, 
  TrendingUp,
  Flame
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/home/StatsCard';
import { ProgressRing } from '@/components/home/ProgressRing';
import { RecentActivity } from '@/components/home/RecentActivity';
import { DueReviewCard } from '@/components/home/DueReviewCard';
import { mockUserStats } from '@/data/mockData';

const Index = () => {
  const { 
    totalTopics, 
    masteredTopics, 
    totalQuestions, 
    masteredQuestions,
    dueForReview,
    streakDays,
    totalTimeMinutes 
  } = mockUserStats;

  const overallProgress = Math.round((masteredQuestions / totalQuestions) * 100);
  const hoursSpent = Math.floor(totalTimeMinutes / 60);

  return (
    <MainLayout>
          <div className="p-4 md:p-8 max-w-7xl mx-auto"> {/* Centrowanie całego widoku */}

        {/* Background gradient glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full gradient-glow opacity-50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        </div>

          {/* Header - Wyśrodkowany */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
            className="relative mb-10 text-center"
        >
            <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground">
            Witaj ponownie! 👋
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Kontynuuj naukę i rozwijaj swoje umiejętności
          </p>
        </motion.div>

          {/* DUE REVIEW CARD - Na środku, szeroka */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10"
          >
            <DueReviewCard count={dueForReview} className="w-full" />
          </motion.div>

          {/* Zawartość główna w jednej kolumnie */}
          <div className="space-y-8">

            {/* Stats Row - teraz 4 kolumny na dużych ekranach */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Tematy"
                value={`${masteredTopics}/${totalTopics}`}
                subtitle="opanowanych"
                icon={BookOpen}
                variant="primary"
                delay={0}
              />
              <StatsCard
                title="Pytania"
                value={masteredQuestions}
                subtitle={`z ${totalQuestions}`}
                icon={Brain}
                variant="accent"
                delay={0.1}
              />
              <StatsCard
                title="Seria dni"
                value={streakDays}
                subtitle="dni z rzędu"
                icon={Flame}
                variant="warning"
                trend={{ value: 40, isPositive: true }}
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

            {/* Progress Overview - rozciągnięty na całość */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 shadow-card"
            >
              <h3 className="mb-6 text-xl font-semibold text-foreground">Postęp ogólny</h3>
              <div className="flex flex-wrap items-center justify-around gap-12">
                <div className="text-center">
                  <ProgressRing progress={overallProgress} size={140} label="ukończono" />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">Wszystkie pytania</p>
                </div>
                <div className="text-center">
                  <ProgressRing progress={Math.round((masteredTopics / totalTopics) * 100)} size={140} label="tematów" />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">Opanowane tematy</p>
                </div>

                <div className="space-y-6 min-w-[250px]">
                  <div className="flex items-center gap-4">
                    <Target className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Cel tygodniowy</p>
                      <div className="mt-2 h-3 w-full rounded-full bg-secondary">
                        <div className="h-3 w-[70%] rounded-full gradient-primary" />
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Recent Activity */}
            <RecentActivity />
          </div>
      </div>
    </MainLayout>
  );
};

export default Index;
