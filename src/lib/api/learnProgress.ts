import { apiRequest } from './config';
import { LearnCategoryDto, LearnRoadmapDto, LearnTopicDto } from './types';

// GET /learn/progress/categories - Get categories with progress stats
export async function getCategoriesWithProgress(): Promise<LearnCategoryDto[]> {
  return apiRequest<LearnCategoryDto[]>('/learn/progress/categories');
}

// GET /learn/progress/categories/{categoryId}/roadmaps - Get roadmaps with progress stats for a specific category
export async function getRoadmapsWithProgress(categoryId: number): Promise<LearnRoadmapDto[]> {
  return apiRequest<LearnRoadmapDto[]>(`/learn/progress/categories/${categoryId}/roadmaps`);
}

// GET /learn/progress/roadmaps/{roadmapId}/topics - Get topics with progress stats for a specific roadmap
export async function getTopicsWithProgress(roadmapId: number): Promise<LearnTopicDto[]> {
  return apiRequest<LearnTopicDto[]>(`/learn/progress/roadmaps/${roadmapId}/topics`);
}
