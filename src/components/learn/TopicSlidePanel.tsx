import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Topic } from '@/types/learning';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface MaterialDialogProps {
  material: { id: string; title: string; content?: string } | null;
  onClose: () => void;
}

const MaterialDialog = ({ material, onClose }: MaterialDialogProps) => {
  if (!material) return null;

  return (
    <Dialog open={!!material} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{material.title}</DialogTitle>
        </DialogHeader>
        <div 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: material.content || '' }}
        />
      </DialogContent>
    </Dialog>
  );
};

interface DescriptionDialogProps {
  topic: Topic | null;
  onClose: () => void;
}

const DescriptionDialog = ({ topic, onClose }: DescriptionDialogProps) => {
  if (!topic) return null;

  // Get the main description from resources if available
  const descriptionResource = topic.resources.find(r => r.type === 'description');
  const hasContent = topic.description || descriptionResource?.content;

  return (
    <Dialog open={!!topic} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{topic.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {topic.description && (
            <p className="text-muted-foreground">{topic.description}</p>
          )}
          {descriptionResource?.content && (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: descriptionResource.content }}
            />
          )}
          {!hasContent && (
            <p className="text-muted-foreground text-center py-8">
              Ten temat nie ma jeszcze opisu.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const TopicSlidePanel = ({ topic, onClose }: TopicSlidePanelProps) => {
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: string; title: string; content?: string } | null>(null);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    materials: true,
    articles: true,
    videos: true,
    questions: true,
  });

  const descriptions = topic.resources.filter(r => r.type === 'description');
  const articles = topic.resources.filter(r => r.type === 'article');
  const videos = topic.resources.filter(r => r.type === 'video');

  const handleStartLearning = () => {
    navigate(`/learn/study/${topic.id}`);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ 
    section, 
    icon: Icon, 
    label, 
    count, 
    iconColor 
  }: { 
    section: string; 
    icon: any; 
    label: string; 
    count: number; 
    iconColor: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between py-2 text-left"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className={cn('h-4 w-4', iconColor)} />
        {label} ({count})
      </h3>
      <ChevronDown className={cn(
        'h-4 w-4 text-muted-foreground transition-transform',
        expandedSections[section] && 'rotate-180'
      )} />
    </button>
  );

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
        className="fixed right-0 top-0 z-50 h-full w-full md:max-w-lg overflow-y-auto border-l border-border bg-card shadow-xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <span className={cn(
                'mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusColors[topic.status]
              )}>
                {statusLabels[topic.status]}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{topic.title}</h2>
              {topic.description && (
                <button
                  onClick={() => setShowDescriptionDialog(true)}
                  className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Zobacz pełny opis
                  <ChevronRight className="h-3 w-3" />
                </button>
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
        <div className="border-b border-border p-4 md:p-6">
          <Button onClick={handleStartLearning} className="w-full mb-3" size="lg">
            <Play className="mr-2 h-5 w-5" />
            Ucz się w ramach tematu
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Do powtórki
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              <Shuffle className="mr-2 h-4 w-4" />
              Losowe
            </Button>
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Own Materials */}
          <section className="rounded-xl border border-border bg-secondary/20 p-4">
            <SectionHeader 
              section="materials" 
              icon={FileText} 
              label="Własne materiały" 
              count={descriptions.length}
              iconColor="text-primary"
            />
            <AnimatePresence>
              {expandedSections.materials && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {descriptions.length > 0 ? (
                    descriptions.map(desc => (
                      <button
                        key={desc.id}
                        onClick={() => setSelectedMaterial({ id: desc.id, title: desc.title, content: desc.content })}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{desc.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Kliknij, aby otworzyć</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">Brak własnych materiałów</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Articles */}
          <section className="rounded-xl border border-border bg-secondary/20 p-4">
            <SectionHeader 
              section="articles" 
              icon={BookOpen} 
              label="Artykuły" 
              count={articles.length}
              iconColor="text-accent"
            />
            <AnimatePresence>
              {expandedSections.articles && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {articles.length > 0 ? (
                    articles.map(article => (
                      <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{article.title}</p>
                          {article.estimatedMinutes && (
                            <p className="text-xs text-muted-foreground">~{article.estimatedMinutes} min</p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">Brak artykułów</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Videos */}
          <section className="rounded-xl border border-border bg-secondary/20 p-4">
            <SectionHeader 
              section="videos" 
              icon={Video} 
              label="Filmy" 
              count={videos.length}
              iconColor="text-warning"
            />
            <AnimatePresence>
              {expandedSections.videos && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {videos.length > 0 ? (
                    videos.map(video => (
                      <a
                        key={video.id}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary"
                      >
                        <div className="h-12 w-20 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Video className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{video.title}</p>
                          {video.estimatedMinutes && (
                            <p className="text-xs text-muted-foreground">{video.estimatedMinutes} min</p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">Brak filmów</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Questions */}
          <section className="rounded-xl border border-border bg-secondary/20 p-4">
            <SectionHeader 
              section="questions" 
              icon={HelpCircle} 
              label="Pytania" 
              count={topic.questions.length}
              iconColor="text-destructive"
            />
            <AnimatePresence>
              {expandedSections.questions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {topic.questions.length > 0 ? (
                    topic.questions.map(question => (
                      <button
                        key={question.id}
                        onClick={() => navigate(`/learn/study/${topic.id}?question=${question.id}`)}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground line-clamp-2 text-sm">{question.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground capitalize">{question.difficulty}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{question.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">Brak pytań w tym temacie</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </motion.div>

      {/* Material Dialog */}
      <MaterialDialog 
        material={selectedMaterial} 
        onClose={() => setSelectedMaterial(null)} 
      />

      {/* Description Dialog */}
      <DescriptionDialog
        topic={showDescriptionDialog ? topic : null}
        onClose={() => setShowDescriptionDialog(false)}
      />
    </>
  );
};
