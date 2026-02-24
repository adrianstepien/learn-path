import { apiRequest } from './config';
import { CardDto, ReviewRequestDTO, SessionStatus } from './types';

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

export const uploadImageToServer = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd Cloudinary:', errorData);
      throw new Error('Nie udało się wgrać zdjęcia do chmury.');
    }

    const data = await response.json();

    return data.secure_url;
  } catch (error) {
    console.error('Błąd uploadu:', error);
    throw error;
  }
};
