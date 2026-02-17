export const queryKeys = {
  all: ['editor'] as const,

  // Categories
  categories: () => [...queryKeys.all, 'categories'] as const,
  category: (categoryId: string | number) =>
    [...queryKeys.categories(), { categoryId: String(categoryId) }] as const,

  // Roadmaps
  roadmaps: (categoryId: string | number) =>
    [...queryKeys.category(categoryId), 'roadmaps'] as const,
  roadmap: (roadmapId: string | number) =>
    [...queryKeys.all, 'roadmap', String(roadmapId)] as const,

  // Topics within a roadmap
  topics: (roadmapId: string | number) =>
    [...queryKeys.roadmap(roadmapId), 'topics'] as const,

  // Single topic and its details
  topic: (topicId: string | number) =>
    [...queryKeys.all, 'topic', String(topicId)] as const,
  topicDetails: (topicId: string | number) =>
    [...queryKeys.topic(topicId), 'details'] as const,
};

