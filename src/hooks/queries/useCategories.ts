import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Category } from '@/types/learning';
import { mockCategories } from '@/data/mockData';
import { CategoryDto } from '@/lib/api/types';

// Mapper
const mapCategoryDtoToCategory = (dto: CategoryDto): Category => ({
  id: String(dto.id),
  name: dto.title,
  description: dto.description,
  icon: dto.iconData || '📁',
  roadmaps: [], // Roadmapy będą pobierane osobno (lazy loading) lub w innej kwerendzie
  progress: 0,
  createdAt: new Date(),
});

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const categoryDtos = await api.getCategories();
        return categoryDtos.map(mapCategoryDtoToCategory);
      } catch (error) {
        console.error("API error, using mocks:", error);
        return mockCategories; // Fallback
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minut
  });
};