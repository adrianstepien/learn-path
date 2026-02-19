// API DTOs matching OpenAPI specification

export interface LearnCategoryDto {
  categoryId: number;
  title: string;
  description: string;
  iconData?: string;
  totalCards: number;
  dueCards: number;
}

export interface LearnRoadmapDto {
  roadmapId: number;
  title: string;
  description: string;
  iconData?: string;
  totalCards: number;
  dueCards: number;
  categoryId: number;
}

export interface LearnTopicDto {
  topicId: number;
  title: string;
  description: string;
  canvasPositionX: number;
  canvasPositionY: number;
  relatedTopicIds: number[];
  totalCards: number;
  dueCards: number;
}

export interface CategoryDto {
  id?: number;
  title: string;
  description?: string;
  iconData?: string;
}

export interface RoadmapDto {
  id?: number;
  title: string;
  description?: string;
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

export interface UpdateTopicPositionDto {
  canvasPositionX?: number;
  canvasPositionY?: number;
}

export interface TopicDto {
  id?: number;
  title: string;
  description?: string;
  canvasPositionX: number;
  canvasPositionY: number;
  relatedTopicIds?: number[];
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
  title: string;
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

export interface FsrsCardDto {
  cardId: number;
  question: string;
  answer: string;
  difficulty: number;
  importance: number;
}

export interface ReviewCardDTO {
  cardId: number;
  rating: ReviewRating;
  reviewStartedAt?: string;
  answerShownAt?: string;
}
