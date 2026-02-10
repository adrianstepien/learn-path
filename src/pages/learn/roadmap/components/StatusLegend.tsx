import { cn } from '@/lib/utils';
import { statusColors, statusLabels } from '@/pages/learn/roadmap/utils/topicProgress';
import { ProgressStatus } from '@/types/learning';

/**
 * Presentational component for displaying the status legend
 * Follows SRP - only responsible for rendering status indicators legend
 */
export const StatusLegend = () => {
  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-6 border-b border-border bg-card/50 px-4 md:px-6 py-2">
      {Object.entries(statusLabels).map(([status, label]) => (
        <div key={status} className="flex items-center gap-2">
          <div className={cn(
            'h-3 w-3 rounded-full border',
            statusColors[status as ProgressStatus]
          )} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
};