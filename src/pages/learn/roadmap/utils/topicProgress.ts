import { Topic, ProgressStatus } from '@/types/learning';

/**
 * Calculate topic progress based on questions
 * Returns a percentage (0-100) of mastered questions
 */
export const getProgressStatus = (progress: number): ProgressStatus => {
  if (progress === 0) return 'not_started';
  if (progress === 100) return 'mastered';
  return 'in_progress';
};

/**
 * Status color mappings for different progress states
 */
export const statusColors: Record<ProgressStatus, string> = {
  not_started: 'bg-secondary border-border',
  in_progress: 'bg-primary/20 border-primary',
  mastered: 'bg-success/20 border-success',
  due_review: 'bg-warning/20 border-warning',
};

/**
 * Status label translations
 */
export const statusLabels: Record<ProgressStatus, string> = {
  not_started: 'Nierozpoczęty',
  in_progress: 'W trakcie',
  mastered: 'Opanowany',
  due_review: 'Do powtórki',
};