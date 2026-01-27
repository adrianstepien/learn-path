import { useState } from 'react';
import { TopicConnection } from '@/types/learning';

interface CanvasConnectionProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: TopicConnection['type'];
  onDelete: () => void;
}

const typeColors: Record<TopicConnection['type'], string> = {
  prerequisite: 'hsl(var(--destructive))',
  related: 'hsl(var(--muted-foreground))',
  suggested_order: 'hsl(var(--primary))',
};

export const CanvasConnection = ({
  id,
  from,
  to,
  type,
  onDelete,
}: CanvasConnectionProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate bezier curve control points
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);

  const path = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;

  // Midpoint for delete button
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <g
      className="pointer-events-auto cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider path for easier interaction */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
      />

      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={typeColors[type]}
        strokeWidth={isHovered ? 3 : 2}
        opacity={isHovered ? 1 : 0.6}
        markerEnd="url(#arrowhead)"
      />

      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={typeColors[type]}
          />
        </marker>
      </defs>

      {/* Delete button on hover */}
      {isHovered && (
        <g
          transform={`translate(${midX}, ${midY})`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="cursor-pointer"
        >
          <circle
            r="12"
            fill="hsl(var(--destructive))"
            className="transition-transform hover:scale-110"
          />
          <text
            textAnchor="middle"
            dy="4"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
};
