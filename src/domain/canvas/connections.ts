import { Topic, TopicConnection, EditorConnection } from '@/types/learning';

/**
 * Derives visual connections from topics' relatedTopicIds.
 * Deduplicates by ensuring each connection pair appears only once.
 * @param topics - Array of topics with relatedTopicIds
 * @returns Array of EditorConnection objects
 */
export const computeConnectionsFromTopics = (
  topics: Topic[]
): EditorConnection[] => {
  const connections: EditorConnection[] = [];
  const seenPairs = new Set<string>();

  for (const topic of topics) {
    const relatedIds = topic.relatedTopicIds ?? [];

    for (const relatedId of relatedIds) {
      const key =
        topic.id < relatedId
          ? `${topic.id}-${relatedId}`
          : `${relatedId}-${topic.id}`;

      if (seenPairs.has(key)) continue;

      seenPairs.add(key);
      connections.push({
        id: `conn-${key}`,
        from: topic.id,
        to: relatedId,
        type: 'suggested_order',
      });
    }
  }

  return connections;
};