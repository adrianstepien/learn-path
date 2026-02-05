import { apiRequest } from './config';
import { CategoryDto } from './types';

// GET /categories - Get all categories
export async function getCategories(): Promise<CategoryDto[]> {
  return apiRequest<CategoryDto[]>('/categories');
}

// POST /categories - Create a new category
export async function createCategory(category: CategoryDto): Promise<void> {
  return apiRequest<void>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

// PUT /categories/{id} - Update category
export async function updateCategory(id: number, category: CategoryDto): Promise<void> {
  return apiRequest<void>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
}

// DELETE /categories/{id} - Delete a category
export async function deleteCategory(id: number): Promise<void> {
  return apiRequest<void>(`/categories/${id}`, {
    method: 'DELETE',
  });
}
