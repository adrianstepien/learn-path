import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import * as api from '@/lib/api';
import type { Category } from '@/types/learning';
import type { CategoryDto } from '@/lib/api/types';
import { queryKeys } from './queryKeys';
import { mapCategoryDtoToCategory, parseNumericId } from '@/domain/editorMappers';

// Core query: categories only (roadmaps/topics fetched per screen)
export const useEditorCategories = () => {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      try {
        const categoryDtos = await api.getCategories();
        return categoryDtos.map((dto: CategoryDto) => mapCategoryDtoToCategory(dto, []));
      } catch (error) {
        console.error('Failed to load categories', error);
        toast.error('Nie udało się załadować kategorii');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Mutations

interface CreateCategoryPayload {
  name: string;
  icon: string;
  description?: string;
}

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, icon, description }: CreateCategoryPayload) => {
      const dto: CategoryDto = {
        title: name,
        iconData: icon,
        description,
      };
      await api.createCategory(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
    onError: (error) => {
      console.error('Failed to create category', error);
      toast.error('Nie udało się utworzyć kategorii');
    },
  });
};

interface UpdateCategoryPayload {
  id: string;
  name?: string;
  icon?: string;
  description?: string;
}

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, icon, description }: UpdateCategoryPayload) => {
      const numericId = parseNumericId(id);
      const categories = queryClient.getQueryData<Category[]>(
        queryKeys.categories(),
      );
      const existing = categories?.find((c) => c.id === id);

      const dto: CategoryDto = {
        id: numericId,
        title: name || existing?.name || '',
        description: description ?? existing?.description,
        iconData: icon ?? existing?.icon,
      };

      await api.updateCategory(numericId, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
    onError: (error) => {
      console.error('Failed to update category', error);
      toast.error('Nie udało się zaktualizować kategorii');
    },
  });
};

interface DeleteCategoryPayload {
  id: string;
}

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteCategoryPayload) => {
      const numericId = parseNumericId(id);
      await api.deleteCategory(numericId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
    onError: (error) => {
      console.error('Failed to delete category', error);
      toast.error('Nie udało się usunąć kategorii');
    },
  });
};

