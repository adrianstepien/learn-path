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
        {/* Background gradient glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full gradient-glow opacity-50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">
            Witaj ponownie! 👋
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
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
              className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-card"
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
              className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-card"
            >
              <h3 className="mb-5 text-lg font-semibold font-display text-foreground">Rekomendowane</h3>
              <div className="space-y-3">
                <button className="w-full rounded-xl bg-secondary/60 p-4 text-left transition-all hover:bg-secondary hover:shadow-md hover:-translate-y-0.5 group border border-transparent hover:border-primary/20">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">Docker - Kontynuuj naukę</p>
                  <p className="text-sm text-muted-foreground mt-1">3 pytania pozostały</p>
                </button>
                <button className="w-full rounded-xl bg-secondary/60 p-4 text-left transition-all hover:bg-secondary hover:shadow-md hover:-translate-y-0.5 group border border-transparent hover:border-primary/20">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">REST API - Powtórka</p>
                  <p className="text-sm text-muted-foreground mt-1">5 pytań do przypomnienia</p>
                </button>
                <button className="w-full rounded-xl bg-secondary/60 p-4 text-left transition-all hover:bg-secondary hover:shadow-md hover:-translate-y-0.5 group border border-transparent hover:border-primary/20">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">Kubernetes - Nowy temat</p>
                  <p className="text-sm text-muted-foreground mt-1">Rozpocznij naukę</p>
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
