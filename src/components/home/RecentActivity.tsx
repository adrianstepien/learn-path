import { motion } from 'framer-motion';
import { BookOpen, Clock, PlayCircle } from 'lucide-react';
// Pamiętaj o imporcie DTO!
import { RecentlyStudiedDto } from '@/lib/api/types'; // Popraw ścieżkę według swojego projektu

interface RecentActivityProps {
  activities: RecentlyStudiedDto[];
}

const getActivityVisuals = (studyMode: string) => {
  switch (studyMode) {
    case 'FUTURE':
      return { icon: BookOpen, colors: 'text-primary bg-primary/10', title: 'Nauka materiału' };
    case 'SRS':
      return { icon: Clock, colors: 'text-warning bg-warning/10', title: 'Powtórka SRS' };
    default:
      return { icon: PlayCircle, colors: 'text-accent bg-accent/10', title: 'Sesja' };
  }
};

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  if (!activities || activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[200px] items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-md"
      >
        <p className="text-sm text-muted-foreground">Brak niedawnej aktywności</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-md"
    >
      <h3 className="mb-4 text-lg font-semibold text-foreground">Ostatnia aktywność</h3>
      <div className="space-y-3">
        {activities.map((item, index) => {
          const { icon: Icon, colors, title } = getActivityVisuals(item.studyMode as string);

          const formattedDate = new Date(item.lastStudiedAt).toLocaleDateString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <motion.div
              key={`${item.contextTitle}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.contextTitle}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{formattedDate}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};