// API DTOs matching OpenAPI specification

export interface CategoryDto {
  id?: number;
  title: string;
  description?: string;
  iconType?: string;
  iconData?: string;
}

export interface RoadmapDto {
  id?: number;
  title: string;
  description?: string;
  iconType?: string;
  iconData?: string;
  categoryId: number;
}

export interface CreateTopicDto {
  title: string;
  description?: string;
  canvasPositionX: number;
  canvasPositionY: number;
  roadmapId: number;
}

export interface UpdateTopicDto {
  id?: number;
  title?: string;
  description?: string;
  canvasPositionX?: number;
  canvasPositionY?: number;
  roadmapId?: number;
  relatedTopicIds?: number[];
}

export interface TopicDto {
  id?: number;
  title: string;
  description?: string;
  canvasPositionX: number;
  canvasPositionY: number;
}

export interface TopicDetailsDto {
  id?: number;
  title: string;
  description?: string;
  canvasPositionX: number;
  canvasPositionY: number;
  notes: NoteDto[];
  articles: ArticleDto[];
  videos: VideoDto[];
  cards: CardDto[];
}

export interface NoteDto {
  id?: number;
  description: string;
  topicId: number;
}

export interface ArticleDto {
  id?: number;
  description: string;
  url: string;
  topicId: number;
}

export interface VideoDto {
  id?: number;
  description: string;
  url: string;
  topicId: number;
}

export interface CardDto {
  id?: number;
  question: string;
  answer: string;
  difficulty: number;
  importance: number;
  topicId: number;
}

export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface ReviewRequestDTO {
  cardId: number;
  rating: ReviewRating;
  reviewStartedAt?: string;
  answerShownAt?: string;
  submittedAt?: string;
  responseTimeMs?: number;
}
