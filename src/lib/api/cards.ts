import { apiRequest } from './config';
import { CardDto, ReviewRequestDTO } from './types';

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

// GET /spaced-repetitions - Get all cards to repeat
export async function getCardsToRepeat(): Promise<CardDto[]> {
  return apiRequest<CardDto[]>('/spaced-repetitions');
}

// GET /spaced-repetitions/category/{categoryId} - Get cards to repeat in category
export async function getCardsToRepeatByCategory(categoryId: number): Promise<CardDto[]> {
  return apiRequest<CardDto[]>(`/spaced-repetitions/category/${categoryId}`);
}

// GET /spaced-repetitions/roadmap/{roadmapId} - Get cards to repeat in roadmap
export async function getCardsToRepeatByRoadmap(roadmapId: number): Promise<CardDto[]> {
  return apiRequest<CardDto[]>(`/spaced-repetitions/roadmap/${roadmapId}`);
}

// GET /spaced-repetitions/topic/{topicId} - Get cards to repeat in topic
export async function getCardsToRepeatByTopic(topicId: number): Promise<CardDto[]> {
  return apiRequest<CardDto[]>(`/spaced-repetitions/topic/${topicId}`);
}

// GET /spaced-repetitions/card/{cardId} - Get specific card for study
export async function getCardForStudy(cardId: number): Promise<CardDto> {
  return apiRequest<CardDto>(`/spaced-repetitions/card/${cardId}`);
}

// POST /spaced-repetitions - Create a new review
export async function createReview(review: ReviewRequestDTO): Promise<void> {
  return apiRequest<void>('/spaced-repetitions', {
    method: 'POST',
    body: JSON.stringify(review),
  });
}
