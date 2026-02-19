import { motion } from 'framer-motion';
import { Topic } from '@/types/learning';
import { cn } from '@/lib/utils';
import {
  getTopicProgress,
  statusColors,
  getStatusIndicatorColor
} from '@/pages/learn/roadmap/utils/topicProgress';

interface TopicNodeProps {
  topic: Topic;
  position: { x: number; y: number };
  onClick: () => void;
  isSelected: boolean;
}

/**
 * Presentational component for displaying a topic node in the roadmap
 * Follows SRP - only responsible for rendering topic node UI
 */
export const TopicNode = ({
  topic,
  position,
  onClick,
  isSelected
}: TopicNodeProps) => {
  const questionsCount = topic.questions.length;
  const resourcesCount = topic.resources.length;
  const progress = getTopicProgress(topic);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
      }}
      className={cn(
        'topic-node min-w-[180px] w-[180px] cursor-pointer rounded-xl border-2 bg-card p-4 shadow-md transition-all',
        statusColors[topic.status],
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <h4 className="font-semibold text-foreground mb-1 truncate">{topic.title}</h4>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{topic.description}</p>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{`Do nauki: ${topic.dueCards} / ${topic.totalCards} pytań`}</span>
          <span className="text-xs font-medium text-foreground">{topic.progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full gradient-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {questionsCount > 0 && (
            <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              🎯 {questionsCount}
            </span>
          )}
          {resourcesCount > 0 && (
            <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              📚 {resourcesCount}
            </span>
          )}
        </div>
        <span className={cn(
          'h-2 w-2 rounded-full',
          getStatusIndicatorColor(topic.status)
        )} />
      </div>
    </motion.div>
  );
};