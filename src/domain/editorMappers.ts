import {
  Category,
  Roadmap,
  Topic,
  Question,
  Resource,
} from '@/types/learning';
import {
  CategoryDto,
  RoadmapDto,
  TopicDto,
  NoteDto,
  ArticleDto,
  VideoDto,
  CardDto,
} from '@/lib/api/types';

// ===== Helper =====

export const parseNumericId = (
  id: string | number | undefined | null,
): number => {
  if (!id) return 0;
  const stringId = String(id);
  const parsed = parseInt(stringId.replace(/\D/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// ===== DTO -> Domain =====

export const mapCategoryDtoToCategory = (
  dto: CategoryDto,
  roadmaps: Roadmap[] = [],
): Category => ({
  id: String(dto.id),
  name: dto.title,
  description: dto.description,
  icon: dto.iconData || '📁',
  roadmaps,
  progress: 0,
  createdAt: new Date(),
});

export const mapRoadmapDtoToRoadmap = (
  dto: RoadmapDto,
  topics: Topic[] = [],
): Roadmap => ({
  id: String(dto.id),
  categoryId: String(dto.categoryId),
  title: dto.title,
  description: dto.description,
  topics,
  connections: [],
  progress: 0,
  totalQuestions: topics.reduce((acc, t) => acc + t.questions.length, 0),
  masteredQuestions: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const mapTopicDtoToTopic = (dto: TopicDto, roadmapId: string): Topic => ({
  id: String(dto.id),
  roadmapId,
  title: dto.title,
  description: dto.description,
  position: { x: dto.canvasPositionX, y: dto.canvasPositionY },
  status: 'not_started',
  questions: [],
  resources: [],
  childTopicIds: [],
  relatedTopicIds: Array.isArray((dto as any).relatedTopicIds)
    ? (dto as any).relatedTopicIds.map((id: number) => String(id))
    : [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const mapCardDtoToQuestion = (
  dto: CardDto,
  topicId: string,
): Question => ({
  id: String(dto.id),
  topicId,
  type: 'open_ended',
  content: dto.question,
  answer: dto.answer,
  difficulty:
    dto.difficulty === 1
      ? 'beginner'
      : dto.difficulty === 2
      ? 'intermediate'
      : dto.difficulty === 3
      ? 'advanced'
      : 'expert',
  importance:
    dto.importance === 1
      ? 'low'
      : dto.importance === 2
      ? 'medium'
      : dto.importance === 3
      ? 'high'
      : 'critical',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
});

export const mapNoteToResource = (dto: NoteDto): Resource => ({
  id: String(dto.id),
  topicId: String(dto.topicId),
  type: 'note',
  title: dto.title,
  content: dto.description,
  isCompleted: false,
  createdAt: new Date(),
});

export const mapArticleToResource = (dto: ArticleDto): Resource => ({
  id: String(dto.id),
  topicId: String(dto.topicId),
  type: 'article',
  title: dto.description,
  url: dto.url,
  isCompleted: false,
  createdAt: new Date(),
});

export const mapVideoToResource = (dto: VideoDto): Resource => ({
  id: String(dto.id),
  topicId: String(dto.topicId),
  type: 'video',
  title: dto.description,
  url: dto.url,
  isCompleted: false,
  createdAt: new Date(),
});

// ===== Domain -> DTO =====

export const mapTopicToUpdateDto = (topic: Topic) => ({
  id: parseNumericId(topic.id),
  title: topic.title,
  description: topic.description,
  canvasPositionX: topic.position.x,
  canvasPositionY: topic.position.y,
  roadmapId: parseNumericId(topic.roadmapId),
  relatedTopicIds: Array.isArray((topic as any).relatedTopicIds)
    ? (topic as any).relatedTopicIds
        .map((id: string) => parseNumericId(id))
        .filter((id: number) => !Number.isNaN(id) && id !== 0)
    : undefined,
});

