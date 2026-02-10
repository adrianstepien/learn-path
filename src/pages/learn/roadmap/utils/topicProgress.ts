import { Topic, ProgressStatus } from '@/types/learning';

/**
 * Calculate topic progress based on questions
 * Returns a percentage (0-100) of mastered questions
 */
export const getTopicProgress = (topic: Topic): number => {
  if (topic.questions.length === 0) return 0;
  const masteredQuestions = topic.questions.filter(q => q.repetitions > 0).length;
  return Math.round((masteredQuestions / topic.questions.length) * 100);
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

/**
 * Get status indicator color class
 */
export const getStatusIndicatorColor = (status: ProgressStatus): string => {
  const colorMap: Record<ProgressStatus, string> = {
    mastered: 'bg-success',
    in_progress: 'bg-primary',
    due_review: 'bg-warning',
    not_started: 'bg-muted-foreground',
  };
  return colorMap[status];
};