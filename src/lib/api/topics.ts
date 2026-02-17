import { apiRequest } from './config';
import { CreateTopicDto, UpdateTopicDto, UpdateTopicPositionDto, TopicDto, TopicDetailsDto } from './types';

// GET /roadmaps/{roadmapId}/topics - Get all topics in roadmap
export async function getTopics(roadmapId: number): Promise<TopicDto[]> {
  return apiRequest<TopicDto[]>(`/roadmaps/${roadmapId}/topics`);
}

// GET /topics/{id} - Get topic by id
export async function getTopicById(id: number): Promise<TopicDetailsDto> {
  return apiRequest<TopicDetailsDto>(`/topics/${id}`);
}

// POST /topics - Create a new topic
export async function createTopic(topic: CreateTopicDto): Promise<void> {
  return apiRequest<void>('/topics', {
    method: 'POST',
    body: JSON.stringify(topic),
  });
}

// PUT /topics/{id} - Update topic
export async function updateTopic(id: number, topic: UpdateTopicDto): Promise<void> {
  return apiRequest<void>(`/topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(topic),
  });
}

// PATCH /topics/{id}/position - Update topic position
export async function updateTopicPosition(id: number, topic: UpdateTopicPositionDto): Promise<void> {
  return apiRequest<void>(`/topics/${id}/position`, {
    method: 'PATCH',
    body: JSON.stringify(topic),
  });
}

// PATCH /topics - Bulk update topics
export async function bulkUpdateTopics(topics: UpdateTopicDto[]): Promise<void> {
  return apiRequest<void>('/topics', {
    method: 'PATCH',
    body: JSON.stringify(topics),
  });
}

// DELETE /topics/{id} - Delete a topic
export async function deleteTopic(id: number): Promise<void> {
  return apiRequest<void>(`/topics/${id}`, {
    method: 'DELETE',
  });
}
