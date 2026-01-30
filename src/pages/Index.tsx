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
      <div className="p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Witaj ponownie! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kontynuuj naukę i rozwijaj swoje umiejętności
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Row */}
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

            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-md"
            >
              <h3 className="mb-6 text-lg font-semibold text-foreground">Postęp ogólny</h3>
              <div className="flex flex-wrap items-center justify-around gap-8">
                <div className="text-center">
                  <ProgressRing progress={overallProgress} label="ukończono" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Wszystkie pytania</p>
                </div>
                <div className="text-center">
                  <ProgressRing progress={Math.round((masteredTopics / totalTopics) * 100)} size={100} label="tematów" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Opanowane tematy</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Cel tygodniowy</p>
                      <p className="text-xs text-muted-foreground">35/50 pytań</p>
                    </div>
                    <div className="h-2 w-24 rounded-full bg-secondary">
                      <div className="h-2 w-[70%] rounded-full gradient-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Skuteczność</p>
                      <p className="text-xs text-muted-foreground">87% poprawnych</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <RecentActivity />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Due Review */}
            <DueReviewCard count={dueForReview} />

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-md"
            >
              <h3 className="mb-4 text-lg font-semibold text-foreground">Rekomendowane</h3>
              <div className="space-y-3">
                <button className="w-full rounded-lg bg-secondary p-4 text-left transition-all hover:bg-secondary/80 hover:shadow-md">
                  <p className="font-medium text-foreground">Docker - Kontynuuj naukę</p>
                  <p className="text-sm text-muted-foreground">3 pytania pozostały</p>
                </button>
                <button className="w-full rounded-lg bg-secondary p-4 text-left transition-all hover:bg-secondary/80 hover:shadow-md">
                  <p className="font-medium text-foreground">REST API - Powtórka</p>
                  <p className="text-sm text-muted-foreground">5 pytań do przypomnienia</p>
                </button>
                <button className="w-full rounded-lg bg-secondary p-4 text-left transition-all hover:bg-secondary/80 hover:shadow-md">
                  <p className="font-medium text-foreground">Kubernetes - Nowy temat</p>
                  <p className="text-sm text-muted-foreground">Rozpocznij naukę</p>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
