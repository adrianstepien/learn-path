import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  Award,
  BookOpen,
  Brain,
  Flame
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockUserStats } from '@/data/mockData';

const DashboardPage = () => {
  const { totalTimeMinutes, streakDays, masteredQuestions, answeredQuestions } = mockUserStats;
  const hoursSpent = Math.floor(totalTimeMinutes / 60);

  // Mock weekly data
  const weeklyData = [
    { day: 'Pon', questions: 12, minutes: 45 },
    { day: 'Wt', questions: 8, minutes: 30 },
    { day: 'Śr', questions: 15, minutes: 55 },
    { day: 'Czw', questions: 6, minutes: 25 },
    { day: 'Pt', questions: 20, minutes: 70 },
    { day: 'Sob', questions: 10, minutes: 35 },
    { day: 'Nd', questions: 5, minutes: 20 },
  ];

  const maxQuestions = Math.max(...weeklyData.map(d => d.questions));

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Przegląd Twojego postępu w nauce
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-primary" />
              <span className="text-xs text-success font-medium">+12% vs tydzień</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{hoursSpent}h</p>
            <p className="text-sm text-muted-foreground">Łączny czas nauki</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <Flame className="h-8 w-8 text-warning" />
              <span className="text-xs text-success font-medium">Rekord!</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{streakDays} dni</p>
            <p className="text-sm text-muted-foreground">Aktualna seria</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <Brain className="h-8 w-8 text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">{masteredQuestions}</p>
            <p className="text-sm text-muted-foreground">Opanowanych pytań</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-success" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {Math.round((masteredQuestions / answeredQuestions) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground">Skuteczność</p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Weekly Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-md"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Aktywność tygodniowa</h3>
            <div className="flex items-end justify-between gap-2 h-40">
              {weeklyData.map((item, index) => (
                <div key={item.day} className="flex flex-col items-center gap-2 flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.questions / maxQuestions) * 100}%` }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                    className="w-full rounded-t-lg gradient-primary min-h-[8px]"
                  />
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded gradient-primary" />
                <span className="text-muted-foreground">Pytania</span>
              </div>
            </div>
          </motion.div>

          {/* Topic Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-md"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Rozkład tematów</h3>
            <div className="space-y-4">
              {[
                { name: 'Docker', progress: 75, color: 'gradient-primary' },
                { name: 'REST API', progress: 60, color: 'gradient-accent' },
                { name: 'Git', progress: 90, color: 'bg-success' },
                { name: 'Kubernetes', progress: 25, color: 'bg-warning' },
                { name: 'Databases', progress: 40, color: 'bg-destructive' },
              ].map((topic, index) => (
                <motion.div
                  key={topic.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{topic.name}</span>
                    <span className="text-sm text-muted-foreground">{topic.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.progress}%` }}
                      transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                      className={`h-2 rounded-full ${topic.color}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-md"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Osiągnięcia</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Początkujący', desc: 'Odpowiedz na 10 pytań', icon: BookOpen, unlocked: true },
              { name: 'Seria tygodnia', desc: '7 dni nauki z rzędu', icon: Flame, unlocked: true },
              { name: 'Mistrz Docker', desc: 'Opanuj wszystkie pytania Docker', icon: Award, unlocked: false },
              { name: 'Maraton', desc: '100 pytań w jeden dzień', icon: Target, unlocked: false },
            ].map((achievement, index) => (
              <motion.div
                key={achievement.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`rounded-xl border p-4 text-center transition-all ${
                  achievement.unlocked 
                    ? 'border-warning/30 bg-warning/10' 
                    : 'border-border bg-secondary/50 opacity-50'
                }`}
              >
                <achievement.icon className={`mx-auto h-8 w-8 mb-2 ${
                  achievement.unlocked ? 'text-warning' : 'text-muted-foreground'
                }`} />
                <p className="font-medium text-foreground text-sm">{achievement.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{achievement.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
