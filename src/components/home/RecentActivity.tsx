import { motion } from 'framer-motion';
import { CheckCircle2, Clock, BookOpen, Target } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'completed' | 'started' | 'reviewed' | 'milestone';
  title: string;
  topic: string;
  time: string;
}

const mockActivity: ActivityItem[] = [
  { id: '1', type: 'completed', title: 'Ukończono pytanie', topic: 'Docker Basics', time: '5 min temu' },
  { id: '2', type: 'reviewed', title: 'Powtórka SRS', topic: 'REST API', time: '15 min temu' },
  { id: '3', type: 'started', title: 'Rozpoczęto temat', topic: 'Kubernetes', time: '1 godz. temu' },
  { id: '4', type: 'milestone', title: 'Osiągnięto cel', topic: '100 pytań', time: '2 godz. temu' },
  { id: '5', type: 'completed', title: 'Ukończono artykuł', topic: 'Git Workflows', time: '3 godz. temu' },
];

const activityIcons = {
  completed: CheckCircle2,
  started: BookOpen,
  reviewed: Clock,
  milestone: Target,
};

const activityColors = {
  completed: 'text-success bg-success/10',
  started: 'text-primary bg-primary/10',
  reviewed: 'text-warning bg-warning/10',
  milestone: 'text-accent bg-accent/10',
};

export const RecentActivity = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-md"
    >
      <h3 className="mb-4 text-lg font-semibold text-foreground">Ostatnia aktywność</h3>
      <div className="space-y-3">
        {mockActivity.map((item, index) => {
          const Icon = activityIcons[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${activityColors[item.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.topic}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
