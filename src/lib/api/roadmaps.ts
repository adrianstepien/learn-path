import { apiRequest } from './config';
import { RoadmapDto } from './types';

// GET /categories/{categoryId}/roadmaps - Get all roadmaps in category
export async function getRoadmaps(categoryId: number): Promise<RoadmapDto[]> {
  return apiRequest<RoadmapDto[]>(`/categories/${categoryId}/roadmaps`);
}

// POST /roadmaps - Create a new roadmap
export async function createRoadmap(roadmap: RoadmapDto): Promise<void> {
  return apiRequest<void>('/roadmaps', {
    method: 'POST',
    body: JSON.stringify(roadmap),
  });
}

// PUT /roadmaps/{id} - Update roadmap
export async function updateRoadmap(id: number, roadmap: RoadmapDto): Promise<void> {
  return apiRequest<void>(`/roadmaps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(roadmap),
  });
}

// DELETE /roadmaps/{id} - Delete a roadmap
export async function deleteRoadmap(id: number): Promise<void> {
  return apiRequest<void>(`/roadmaps/${id}`, {
    method: 'DELETE',
  });
}
