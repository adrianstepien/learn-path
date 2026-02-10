interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

/**
 * Presentational component for rendering connection lines between topics
 * Follows SRP - only responsible for rendering SVG connection paths
 */
export const ConnectionLine = ({ from, to }: ConnectionLineProps) => {
  const startX = from.x + 96; // Half of node width (192px / 2)
  const startY = from.y + 40; // Approximate node height
  const endX = to.x + 96;
  const endY = to.y;

  const midY = (startY + endY) / 2;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <path
        d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="2"
        strokeDasharray="4,4"
      />
    </svg>
  );
};