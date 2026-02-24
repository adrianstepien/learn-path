import { apiRequest } from './config';
import { CardDto, ReviewRequestDTO, SessionStatus } from './types';

// GET /cards - Get all cards
export async function getCards(): Promise<CardDto[]> {
  return apiRequest<CardDto[]>('/cards');
}

// GET /topics/{topicId}/cards - Get all cards in topic
export async function getCardsInTopic(topicId: number): Promise<CardDto[]> {
  return apiRequest<CardDto[]>(`/topics/${topicId}/cards`);
}

// POST /cards - Create a new card
export async function createCard(card: CardDto): Promise<void> {
  return apiRequest<void>('/cards', {
    method: 'POST',
    body: JSON.stringify(card),
  });
}

// PUT /cards/{id} - Update card
export async function updateCard(id: number, card: CardDto): Promise<void> {
  return apiRequest<void>(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(card),
  });
}

// DELETE /cards/{id} - Delete a card
export async function deleteCard(id: number): Promise<void> {
  return apiRequest<void>(`/cards/${id}`, {
    method: 'DELETE',
  });
}

// ===== SPACED REPETITIONS =====

// POST /spaced-repetitions - Start fsrs-6 session
export async function startStudySession(request: StartSessionRequestDto): Promise<StudySessionResponseDto> {
  return apiRequest<StudySessionResponseDto>('/spaced-repetitions/sessions', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// PATCH /spaced-repetitions/session - Update fsrs-6 session e.g. stop
export async function updateStudySession(sessionId: number, sessionStatus: SessionStatus): Promise<void> {
  return apiRequest<void>(`/spaced-repetitions/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(sessionStatus),
  });
}

// POST /spaced-repetitions - Create a new review
export async function createReview(review: ReviewRequestDTO): Promise<void> {
  return apiRequest<void>('/spaced-repetitions', {
    method: 'POST',
    body: JSON.stringify(review),
  });
}

export async function uploadImageToServer(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const data = await apiRequest<{ url: string }>('/cards/images/upload', {
    method: 'POST',
    body: form,
  });

    return data.url;
}
