import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Play, 
  Shuffle, 
  Clock,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Topic } from '@/types/learning';
import { cn } from '@/lib/utils';

interface TopicSlidePanelProps {
  topic: Topic;
  onClose: () => void;
}

const statusLabels = {
  not_started: 'Nierozpoczęty',
  in_progress: 'W trakcie',
  mastered: 'Opanowany',
  due_review: 'Do powtórki',
};

const statusColors = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/20 text-primary',
  mastered: 'bg-success/20 text-success',
  due_review: 'bg-warning/20 text-warning',
};

export const TopicSlidePanel = ({ topic, onClose }: TopicSlidePanelProps) => {
  const navigate = useNavigate();

  const descriptions = topic.resources.filter(r => r.type === 'description');
  const articles = topic.resources.filter(r => r.type === 'article');
  const videos = topic.resources.filter(r => r.type === 'video');

  const handleStartLearning = () => {
    navigate(`/learn/study/${topic.id}`);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-border bg-card shadow-xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <span className={cn(
                'mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusColors[topic.status]
              )}>
                {statusLabels[topic.status]}
              </span>
              <h2 className="text-2xl font-bold text-foreground">{topic.title}</h2>
              {topic.description && (
                <p className="mt-2 text-muted-foreground">{topic.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="border-b border-border p-6">
          <Button onClick={handleStartLearning} className="w-full mb-3" size="lg">
            <Play className="mr-2 h-5 w-5" />
            Ucz się w ramach tematu
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Pytania do powtórki
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              <Shuffle className="mr-2 h-4 w-4" />
              Losowe pytanie
            </Button>
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-6 space-y-6">
          {/* Descriptions */}
          {descriptions.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <FileText className="h-4 w-4 text-primary" />
                Własne opisy ({descriptions.length})
              </h3>
              <div className="space-y-3">
                {descriptions.map(desc => (
                  <div key={desc.id} className="rounded-lg border border-border bg-secondary/50 p-4">
                    <h4 className="font-medium text-foreground mb-2">{desc.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">{desc.content}</p>
                    <button className="mt-2 text-xs text-primary hover:underline">
                      Rozwiń pełny opis
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Articles */}
          {articles.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <BookOpen className="h-4 w-4 text-accent" />
                Artykuły ({articles.length})
              </h3>
              <div className="space-y-2">
                {articles.map(article => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{article.title}</p>
                      {article.estimatedMinutes && (
                        <p className="text-xs text-muted-foreground">~{article.estimatedMinutes} min</p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Video className="h-4 w-4 text-warning" />
                Video ({videos.length})
              </h3>
              <div className="space-y-2">
                {videos.map(video => (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
                  >
                    <div className="h-16 w-24 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                      {video.thumbnail && (
                        <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{video.title}</p>
                      {video.estimatedMinutes && (
                        <p className="text-xs text-muted-foreground">{video.estimatedMinutes} min</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Questions */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <HelpCircle className="h-4 w-4 text-destructive" />
              Pytania ({topic.questions.length})
            </h3>
            {topic.questions.length > 0 ? (
              <div className="space-y-2">
                {topic.questions.map(question => (
                  <button
                    key={question.id}
                    onClick={() => navigate(`/learn/study/${topic.id}?question=${question.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/50 p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground line-clamp-2">{question.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground capitalize">{question.difficulty}</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{question.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Brak pytań w tym temacie</p>
            )}
          </section>
        </div>
      </motion.div>
    </>
  );
};
