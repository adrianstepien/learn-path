export const editorKeys = {
  all: ['editor'] as const,

  // Categories
  categories: () => [...editorKeys.all, 'categories'] as const,
  category: (categoryId: string | number) =>
    [...editorKeys.categories(), { categoryId: String(categoryId) }] as const,

  // Roadmaps
  roadmaps: (categoryId: string | number) =>
    [...editorKeys.category(categoryId), 'roadmaps'] as const,
  roadmap: (roadmapId: string | number) =>
    [...editorKeys.all, 'roadmap', String(roadmapId)] as const,

  // Topics within a roadmap
  topics: (roadmapId: string | number) =>
    [...editorKeys.roadmap(roadmapId), 'topics'] as const,

  // Single topic and its details
  topic: (topicId: string | number) =>
    [...editorKeys.all, 'topic', String(topicId)] as const,
  topicDetails: (topicId: string | number) =>
    [...editorKeys.topic(topicId), 'details'] as const,
};

