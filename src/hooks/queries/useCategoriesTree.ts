import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { isApiAvailable } from '@/lib/api/config';
import { Category } from '@/types/learning';
import { mockCategories } from '@/data/mockData';

export const categoryKeys = {
  tree: ['categories', 'tree'] as const,
};

const fetchFullCategoryTree = async (): Promise<Category[]> => {
  const available = await isApiAvailable();
  if (!available) return mockCategories;

  try {
    const categoryDtos = await api.getCategories();
    const categories: Category[] = categoryDtos.map(dto => ({
      id: String(dto.id),
      name: dto.title,
      description: dto.description,
      icon: dto.iconData || '📁',
      roadmaps: [],
      progress: 0,
      createdAt: new Date(),
    }));

    await Promise.all(categories.map(async (cat) => {
      try {
        const numericId = parseInt(cat.id.replace(/\D/g, ''));
        const roadmapDtos = await api.getRoadmaps(numericId);
        cat.roadmaps = roadmapDtos.map(dto => ({
          id: String(dto.id),
          categoryId: String(dto.categoryId),
          title: dto.title,
          description: dto.description,
          topics: [],
          connections: [],
          progress: 0,
          totalQuestions: 0,
          masteredQuestions: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await Promise.all(cat.roadmaps.map(async (roadmap) => {
          try {
            const numericRoadmapId = parseInt(roadmap.id.replace(/\D/g, ''));
            const topicDtos = await api.getTopics(numericRoadmapId);
            roadmap.topics = topicDtos.map(dto => ({
              id: String(dto.id),
              roadmapId: roadmap.id,
              title: dto.title,
              description: dto.description,
              position: { x: dto.canvasPositionX, y: dto.canvasPositionY },
              status: 'not_started' as const,
              questions: [],
              resources: [],
              childTopicIds: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
          } catch (err) {
            console.warn(`Failed to fetch topics for roadmap ${roadmap.id}`, err);
          }
        }));
      } catch (err) {
        console.warn(`Failed to fetch roadmaps for category ${cat.id}`, err);
      }
    }));
    return categories;
  } catch (err) {
    console.error('Critical error fetching categories tree:', err);
    return mockCategories;
  }
};

export const useCategoriesTree = () => {
  return useQuery({
    queryKey: categoryKeys.tree,
    queryFn: fetchFullCategoryTree,
    staleTime: 1000 * 60 * 5, // 5 minut
    refetchOnWindowFocus: false,
  });
};