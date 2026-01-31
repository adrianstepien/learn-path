import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Video, 
  Link, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  BookOpen,
  ExternalLink,
  Pencil,
  NotebookPen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Topic, Question, Resource } from '@/types/learning';
import { cn } from '@/lib/utils';
import { QuestionFormDialog } from './QuestionFormDialog';
import { ResourceFormDialog } from './ResourceFormDialog';

interface TopicEditPanelProps {
  topic: Topic;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTopic: (updates: Partial<Topic>) => void;
  onAddQuestion: (question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>) => void;
  onUpdateQuestion?: (questionId: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddResource: (resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => void;
  onUpdateResource?: (resourceId: string, updates: Partial<Resource>) => void;
  onDeleteResource: (resourceId: string) => void;
}

const questionTypeLabels: Record<Question['type'], string> = {
  yes_no: 'Tak/Nie',
  single_answer: 'Odpowiedź jednoznaczna',
  open_ended: 'Otwarte',
  fill_blank: 'Uzupełnianie',
  code_write: 'Napisz kod',
  code_explain: 'Wyjaśnij kod',
  chronology: 'Chronologia',
};

const difficultyLabels: Record<Question['difficulty'], string> = {
  beginner: 'Początkujący',
  intermediate: 'Średni',
  advanced: 'Zaawansowany',
  expert: 'Ekspert',
};

export const TopicEditPanel = ({
  topic,
  isOpen,
  onClose,
  onUpdateTopic,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
}: TopicEditPanelProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [expandedSections, setExpandedSections] = useState<string[]>(['own_materials', 'articles', 'videos', 'questions']);
  
  // Dialog states
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionDialogMode, setQuestionDialogMode] = useState<'add' | 'edit'>('add');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [resourceDialogMode, setResourceDialogMode] = useState<'add' | 'edit'>('add');
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceDialogType, setResourceDialogType] = useState<Resource['type']>('description');

  // Sync title when topic changes
  useEffect(() => {
    setTitle(topic.title);
    setEditingTitle(false);
  }, [topic.id, topic.title]);

  // Filter resources by type
  const ownMaterials = topic.resources.filter(r => r.type === 'description');
  const articles = topic.resources.filter(r => r.type === 'article');
  const videos = topic.resources.filter(r => r.type === 'video');

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleSaveTitle = () => {
    if (title.trim() && title !== topic.title) {
      onUpdateTopic({ title: title.trim() });
    }
    setEditingTitle(false);
  };

  // Question handlers
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionDialogMode('add');
    setQuestionDialogOpen(true);
  };

  const handleOpenEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionDialogMode('edit');
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = (questionData: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>) => {
    if (questionDialogMode === 'add') {
      onAddQuestion(questionData);
    } else if (editingQuestion && onUpdateQuestion) {
      onUpdateQuestion(editingQuestion.id, questionData);
    }
  };

  // Resource handlers
  const handleOpenAddResource = (type: Resource['type']) => {
    setEditingResource(null);
    setResourceDialogMode('add');
    setResourceDialogType(type);
    setResourceDialogOpen(true);
  };

  const handleOpenEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setResourceDialogMode('edit');
    setResourceDialogType(resource.type);
    setResourceDialogOpen(true);
  };

  const handleSaveResource = (resourceData: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => {
    if (resourceDialogMode === 'add') {
      onAddResource(resourceData);
    } else if (editingResource && onUpdateResource) {
      onUpdateResource(editingResource.id, resourceData);
    }
  };

  // Strip HTML for preview
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

  const ResourceItem = ({ resource }: { resource: Resource }) => (
    <div className="group flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors">
      {resource.type === 'description' && <NotebookPen className="h-4 w-4 text-primary flex-shrink-0" />}
      {resource.type === 'article' && <Link className="h-4 w-4 text-accent flex-shrink-0" />}
      {resource.type === 'video' && <Video className="h-4 w-4 text-warning flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{resource.title}</p>
        {resource.type === 'description' && resource.content && (
          <p className="text-xs text-muted-foreground truncate">
            {stripHtml(resource.content).substring(0, 50)}...
          </p>
        )}
        {resource.url && (
          <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Otwórz link
          </a>
        )}
        {resource.estimatedMinutes && (
          <p className="text-xs text-muted-foreground">{resource.estimatedMinutes} min</p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleOpenEditResource(resource)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => onDeleteResource(resource.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full md:max-w-xl bg-card shadow-xl"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {editingTitle ? (
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                        className="h-8 text-lg font-semibold"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="group flex cursor-pointer items-center gap-2"
                        onClick={() => setEditingTitle(true)}
                      >
                        <h2 className="text-lg font-semibold text-foreground">{topic.title}</h2>
                        <Edit3 className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Opis tematu</label>
                      <Textarea
                        value={topic.description || ''}
                        onChange={(e) => onUpdateTopic({ description: e.target.value })}
                        placeholder="Dodaj opis tematu..."
                        rows={3}
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Status</label>
                      <Select
                        value={topic.status}
                        onValueChange={(value: Topic['status']) => onUpdateTopic({ status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Nie rozpoczęty</SelectItem>
                          <SelectItem value="in_progress">W trakcie</SelectItem>
                          <SelectItem value="mastered">Opanowany</SelectItem>
                          <SelectItem value="due_review">Do powtórki</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Own Materials Section */}
                    <Collapsible
                      open={expandedSections.includes('own_materials')}
                      onOpenChange={() => toggleSection('own_materials')}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-primary/10 p-3 hover:bg-primary/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <NotebookPen className="h-4 w-4 text-primary" />
                          <span className="font-medium">Własne materiały</span>
                          <Badge variant="secondary">{ownMaterials.length}</Badge>
                        </div>
                        {expandedSections.includes('own_materials') ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {ownMaterials.map((resource) => (
                          <ResourceItem key={resource.id} resource={resource} />
                        ))}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleOpenAddResource('description')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj własny materiał
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Articles Section */}
                    <Collapsible
                      open={expandedSections.includes('articles')}
                      onOpenChange={() => toggleSection('articles')}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-3 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4 text-accent" />
                          <span className="font-medium">Artykuły</span>
                          <Badge variant="secondary">{articles.length}</Badge>
                        </div>
                        {expandedSections.includes('articles') ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {articles.map((resource) => (
                          <ResourceItem key={resource.id} resource={resource} />
                        ))}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleOpenAddResource('article')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj artykuł
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Videos Section */}
                    <Collapsible
                      open={expandedSections.includes('videos')}
                      onOpenChange={() => toggleSection('videos')}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-warning/10 p-3 hover:bg-warning/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-warning" />
                          <span className="font-medium">Filmy</span>
                          <Badge variant="secondary">{videos.length}</Badge>
                        </div>
                        {expandedSections.includes('videos') ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {videos.map((resource) => (
                          <ResourceItem key={resource.id} resource={resource} />
                        ))}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleOpenAddResource('video')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj film
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Questions Section */}
                    <Collapsible
                      open={expandedSections.includes('questions')}
                      onOpenChange={() => toggleSection('questions')}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-secondary/50 p-3 hover:bg-secondary transition-colors">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Pytania</span>
                          <Badge variant="secondary">{topic.questions.length}</Badge>
                        </div>
                        {expandedSections.includes('questions') ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {topic.questions.map((question) => (
                          <div
                            key={question.id}
                            className="group rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="mb-2 flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {questionTypeLabels[question.type]}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {difficultyLabels[question.difficulty]}
                                  </Badge>
                                </div>
                                <p className="text-sm line-clamp-2">
                                  {stripHtml(question.content)}
                                </p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenEditQuestion(question)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => onDeleteQuestion(question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleOpenAddQuestion}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj pytanie
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Question Dialog */}
      <QuestionFormDialog
        isOpen={questionDialogOpen}
        onClose={() => setQuestionDialogOpen(false)}
        question={editingQuestion}
        onSave={handleSaveQuestion}
        mode={questionDialogMode}
      />

      {/* Resource Dialog */}
      <ResourceFormDialog
        isOpen={resourceDialogOpen}
        onClose={() => setResourceDialogOpen(false)}
        resource={editingResource}
        onSave={handleSaveResource}
        mode={resourceDialogMode}
        defaultType={resourceDialogType}
      />
    </>
  );
};
