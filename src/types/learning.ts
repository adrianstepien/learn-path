// Core types for the learning application

export const EMOJI_OPTIONS = ["💻", "📚", "🎨", "🔬", "📐", "🌍", "💼", "🎵", "⚽", "🍳", "📜", "🧠"];

export type QuestionType = 
  | 'yes_no'           // Simple yes/no answer
  | 'single_answer'    // Single correct answer (e.g., "Capital of Poland" -> "Warsaw")
  | 'open_ended'       // Open question where user can elaborate
  | 'fill_blank'       // Fill in the missing part
  | 'code_write'       // Write code fragment
  | 'code_explain'     // Explain what code does
  | 'chronology';      // Order items chronologically

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';
export type ProgressStatus = 'not_started' | 'in_progress' | 'mastered' | 'due_review';

export interface Question {
  id: string;
  topicId: string;
  type: QuestionType;
  question: string;           // The question text (can include markdown/code)
  answer: string;            // Expected answer or pattern
  hint?: string;
  explanation?: string;      // Detailed explanation after answering
  difficulty: DifficultyLevel;
  importance: ImportanceLevel;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // SRS fields
  nextReviewDate?: Date;
  easeFactor: number;        // SM-2 algorithm ease factor
  interval: number;          // Days until next review
  repetitions: number;       // Number of successful reviews
}

interface QuestionWithReview extends Question {
  rating: ReviewRating;
  reviewStartedAt?: string;
  answerShownAt?: string;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  userId: string;
  userAnswer: string;
  isCorrect: boolean;
  confidence: number;        // 0-5 scale
  llmFeedback?: string;
  attemptedAt: Date;
  timeSpentSeconds: number;
}

export interface Resource {
  id: string;
  topicId: string;
  type: 'article' | 'video' | 'note';
  title: string;
  content?: string;          // For descriptions
  url?: string;              // For articles/videos
  thumbnail?: string;
  estimatedMinutes?: number;
  isCompleted: boolean;
  createdAt: Date;
}

export interface Topic {
  id: string;
  roadmapId: string;
  title: string;
  description?: string;
  position: { x: number; y: number };
  status: ProgressStatus;
  questions: Question[];
  relatedTopicIds?: string[];
  totalCards?: number;
  dueCards?: number;
  progress?: number;
  resources: Resource[];
  parentTopicId?: string;    // For hierarchical structure
  childTopicIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicConnection {
  id: string;
  fromTopicId: string;
  toTopicId: string;
  type: 'prerequisite' | 'related' | 'suggested_order';
}

export interface Roadmap {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  topics?: Topic[];
  connections?: TopicConnection[];
  totalCards?: number;
  dueCards?: number;
  progress?: number;
  totalQuestions?: number;
  masteredQuestions?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  roadmaps?: Roadmap[];
  totalCards?: number;
  dueCards?: number;
  progress?: number;
  createdAt?: Date;
}

export interface UserStats {
  totalTopics: number;
  masteredTopics: number;
  totalQuestions: number;
  answeredQuestions: number;
  masteredQuestions: number;
  dueForReview: number;
  streakDays: number;
  totalTimeMinutes: number;
  lastStudyDate?: Date;
}

export interface EditorConnection {
  id: string;
  from: string;
  to: string;
  type: TopicConnection['type'];
}

export enum ReviewRating {
  SKIP = 'SKIP',
  AGAIN = 'AGAIN',
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY'
}