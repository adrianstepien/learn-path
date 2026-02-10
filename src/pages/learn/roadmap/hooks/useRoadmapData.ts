import { useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { Roadmap, Topic } from '@/types/learning';

interface UseRoadmapDataReturn {
  roadmap: Roadmap | undefined;
  getTopicPosition: (topic: Topic) => { x: number; y: number };
}

/**
 * Custom hook to fetch roadmap data and manage topic positions
 * Follows SRP by handling only roadmap data retrieval and position logic
 */
export const useRoadmapData = (roadmapId: string | undefined): UseRoadmapDataReturn => {
  const { state } = useEditorStore();

  /**
   * Find roadmap from global store by ID
   */
  const roadmap = useMemo(() => {
    if (!roadmapId) return undefined;

    for (const category of state.categories) {
      const found = category.roadmaps.find(r => r.id === roadmapId);
      if (found) return found;
    }
    return undefined;
  }, [roadmapId, state.categories]);

  /**
   * Get position for a topic - use saved position if available, otherwise use default
   */
  const getTopicPosition = (topic: Topic): { x: number; y: number } => {
    return state.savedPositions[topic.id] || topic.position;
  };

  return {
    roadmap,
    getTopicPosition,
  };
};