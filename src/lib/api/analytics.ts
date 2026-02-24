import { apiRequest } from './config';
import { CardDto, ReviewRequestDTO, SessionStatus } from './types';

// GET /analytics/summary - Get analytics data for main page
export async function getAnalyticsSummary(): Promise<AnalyticsSummaryDto> {
  return apiRequest<AnalyticsSummaryDto>('/analytics/summary');
}

