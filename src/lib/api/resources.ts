import { apiRequest } from './config';
import { NoteDto, ArticleDto, VideoDto } from './types';

// ===== NOTES =====

// GET /topics/{topicId}/notes - Get all notes in topic
export async function getNotesInTopic(topicId: number): Promise<NoteDto[]> {
  return apiRequest<NoteDto[]>(`/topics/${topicId}/notes`);
}

// POST /notes - Create a new note
export async function createNote(note: NoteDto): Promise<void> {
  return apiRequest<void>('/notes', {
    method: 'POST',
    body: JSON.stringify(note),
  });
}

// PUT /notes/{id} - Update note
export async function updateNote(id: number, note: NoteDto): Promise<void> {
  return apiRequest<void>(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(note),
  });
}

// DELETE /notes/{id} - Delete a note
export async function deleteNote(id: number): Promise<void> {
  return apiRequest<void>(`/notes/${id}`, {
    method: 'DELETE',
  });
}

// ===== ARTICLES =====

// GET /topics/{topicId}/articles - Get all articles in topic
export async function getArticlesInTopic(topicId: number): Promise<ArticleDto[]> {
  return apiRequest<ArticleDto[]>(`/topics/${topicId}/articles`);
}

// POST /articles - Create a new article
export async function createArticle(article: ArticleDto): Promise<void> {
  return apiRequest<void>('/articles', {
    method: 'POST',
    body: JSON.stringify(article),
  });
}

// PUT /articles/{id} - Update article
export async function updateArticle(id: number, article: ArticleDto): Promise<void> {
  return apiRequest<void>(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(article),
  });
}

// DELETE /articles/{id} - Delete an article
export async function deleteArticle(id: number): Promise<void> {
  return apiRequest<void>(`/articles/${id}`, {
    method: 'DELETE',
  });
}

// ===== VIDEOS =====

// GET /topics/{topicId}/videos - Get all videos in topic
export async function getVideosInTopic(topicId: number): Promise<VideoDto[]> {
  return apiRequest<VideoDto[]>(`/topics/${topicId}/videos`);
}

// POST /videos - Create a new video
export async function createVideo(video: VideoDto): Promise<void> {
  return apiRequest<void>('/videos', {
    method: 'POST',
    body: JSON.stringify(video),
  });
}

// PUT /videos/{id} - Update video
export async function updateVideo(id: number, video: VideoDto): Promise<void> {
  return apiRequest<void>(`/videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(video),
  });
}

// DELETE /videos/{id} - Delete a video
export async function deleteVideo(id: number): Promise<void> {
  return apiRequest<void>(`/videos/${id}`, {
    method: 'DELETE',
  });
}
