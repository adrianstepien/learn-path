import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary } from '@/lib/api/analytics';

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: () => [...analyticsKeys.all, 'summary'] as const,
};

export const useAnalyticsSummary = () => {
  return useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: async () => {
      return await getAnalyticsSummary();
    },
  });
};