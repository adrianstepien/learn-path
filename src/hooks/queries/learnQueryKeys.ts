export const learnKeys = {
  all: ['learn'] as const,
  categoryRoadmaps: (categoryId: string) =>
    [...learnKeys.all, 'category', categoryId, 'roadmaps'] as const,
  roadmap: (roadmapId: string) =>
    [...learnKeys.all, 'roadmap', roadmapId] as const,
  roadmapTopics: (roadmapId: string) =>
    [...learnKeys.all, 'roadmap', roadmapId, 'topics'] as const,
};