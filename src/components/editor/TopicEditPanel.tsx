import { useState } from 'react';
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
  BookOpen
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
import { Topic, Question, Resource, QuestionType, DifficultyLevel, ImportanceLevel } from '@/types/learning';
import { cn } from '@/lib/utils';

interface TopicEditPanelProps {
  topic: Topic;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTopic: (updates: Partial<Topic>) => void;
  onAddQuestion: (question: Omit<Question, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'easeFactor' | 'interval' | 'repetitions'>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddResource: (resource: Omit<Resource, 'id' | 'topicId' | 'createdAt' | 'isCompleted'>) => void;
  onDeleteResource: (resourceId: string) => void;
}

const questionTypeLabels: Record<QuestionType, string> = {
  yes_no: 'Tak/Nie',
  single_answer: 'Odpowiedź jednoznaczna',
  open_ended: 'Otwarte',
  fill_blank: 'Uzupełnianie',
  code_write: 'Napisz kod',
  code_explain: 'Wyjaśnij kod',
  chronology: 'Chronologia',
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: 'Początkujący',
  intermediate: 'Średni',
  advanced: 'Zaawansowany',
  expert: 'Ekspert',
};

const importanceLabels: Record<ImportanceLevel, string> = {
  low: 'Niska',
  medium: 'Średnia',
  high: 'Wysoka',
  critical: 'Krytyczna',
};

export const TopicEditPanel = ({
  topic,
  isOpen,
  onClose,
  onUpdateTopic,
  onAddQuestion,
  onDeleteQuestion,
  onAddResource,
  onDeleteResource,
}: TopicEditPanelProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [expandedSections, setExpandedSections] = useState<string[]>(['questions']);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newQuestion, setNewQuestion] = useState<{
    type: QuestionType;
    content: string;
    answer: string;
    hint: string;
    explanation: string;
    difficulty: DifficultyLevel;
    importance: ImportanceLevel;
  }>({
    type: 'open_ended',
    content: '',
    answer: '',
    hint: '',
    explanation: '',
    difficulty: 'beginner',
    importance: 'medium',
  });
  const [newResource, setNewResource] = useState<{
    type: Resource['type'];
    title: string;
    content: string;
    url: string;
    estimatedMinutes: number;
  }>({
    type: 'description',
    title: '',
    content: '',
    url: '',
    estimatedMinutes: 10,
  });

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

  const handleAddQuestion = () => {
    if (!newQuestion.content.trim() || !newQuestion.answer.trim()) return;
    
    onAddQuestion({
      type: newQuestion.type,
      content: newQuestion.content,
      answer: newQuestion.answer,
      hint: newQuestion.hint || undefined,
      explanation: newQuestion.explanation || undefined,
      difficulty: newQuestion.difficulty,
      importance: newQuestion.importance,
      tags: [],
    });
    
    setNewQuestion({
      type: 'open_ended',
      content: '',
      answer: '',
      hint: '',
      explanation: '',
      difficulty: 'beginner',
      importance: 'medium',
    });
    setShowAddQuestion(false);
  };

  const handleAddResource = () => {
    if (!newResource.title.trim()) return;
    
    onAddResource({
      type: newResource.type,
      title: newResource.title,
      content: newResource.type === 'description' ? newResource.content : undefined,
      url: newResource.type !== 'description' ? newResource.url : undefined,
      estimatedMinutes: newResource.estimatedMinutes,
    });
    
    setNewResource({
      type: 'description',
      title: '',
      content: '',
      url: '',
      estimatedMinutes: 10,
    });
    setShowAddResource(false);
  };

  return (
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
            className="fixed right-0 top-0 z-50 h-full w-full max-w-xl bg-card shadow-xl"
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

                  {/* Resources Section */}
                  <Collapsible
                    open={expandedSections.includes('resources')}
                    onOpenChange={() => toggleSection('resources')}
                  >
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-secondary/50 p-3 hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Materiały</span>
                        <Badge variant="secondary">{topic.resources.length}</Badge>
                      </div>
                      {expandedSections.includes('resources') ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {topic.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                          {resource.type === 'description' && <FileText className="h-4 w-4 text-primary" />}
                          {resource.type === 'article' && <Link className="h-4 w-4 text-accent" />}
                          {resource.type === 'video' && <Video className="h-4 w-4 text-warning" />}
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{resource.title}</p>
                            {resource.estimatedMinutes && (
                              <p className="text-xs text-muted-foreground">{resource.estimatedMinutes} min</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => onDeleteResource(resource.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {showAddResource ? (
                        <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                          <Select
                            value={newResource.type}
                            onValueChange={(value: Resource['type']) => setNewResource(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="description">Opis</SelectItem>
                              <SelectItem value="article">Artykuł</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Tytuł"
                            value={newResource.title}
                            onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                          />
                          {newResource.type === 'description' ? (
                            <Textarea
                              placeholder="Treść opisu..."
                              value={newResource.content}
                              onChange={(e) => setNewResource(prev => ({ ...prev, content: e.target.value }))}
                              rows={4}
                            />
                          ) : (
                            <Input
                              placeholder="URL"
                              value={newResource.url}
                              onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                            />
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleAddResource}>
                              Dodaj
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowAddResource(false)}>
                              Anuluj
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowAddResource(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj materiał
                        </Button>
                      )}
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
                          className="rounded-lg border border-border p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="mb-2 flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {questionTypeLabels[question.type]}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {difficultyLabels[question.difficulty]}
                                </Badge>
                              </div>
                              <p className="text-sm">{question.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0 text-destructive"
                              onClick={() => onDeleteQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {showAddQuestion ? (
                        <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Select
                              value={newQuestion.type}
                              onValueChange={(value: QuestionType) => setNewQuestion(prev => ({ ...prev, type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Typ pytania" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(questionTypeLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={newQuestion.difficulty}
                              onValueChange={(value: DifficultyLevel) => setNewQuestion(prev => ({ ...prev, difficulty: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Poziom" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(difficultyLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Select
                            value={newQuestion.importance}
                            onValueChange={(value: ImportanceLevel) => setNewQuestion(prev => ({ ...prev, importance: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ważność" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(importanceLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Textarea
                            placeholder="Treść pytania..."
                            value={newQuestion.content}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
                            rows={3}
                          />
                          <Textarea
                            placeholder="Odpowiedź..."
                            value={newQuestion.answer}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, answer: e.target.value }))}
                            rows={2}
                          />
                          <Input
                            placeholder="Podpowiedź (opcjonalnie)"
                            value={newQuestion.hint}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, hint: e.target.value }))}
                          />
                          <Textarea
                            placeholder="Wyjaśnienie (opcjonalnie)"
                            value={newQuestion.explanation}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleAddQuestion}>
                              Dodaj pytanie
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowAddQuestion(false)}>
                              Anuluj
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowAddQuestion(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj pytanie
                        </Button>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
