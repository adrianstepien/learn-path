import { useState, useCallback, useRef } from 'react';

interface TouchGestureState {
  isTouchPanning: boolean;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}

interface UseTouchGesturesProps {
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * Custom hook to handle touch gestures for mobile interactions
 * Follows SRP by handling only touch gesture logic (pan and pinch-to-zoom)
 */
export const useTouchGestures = ({
  zoom,
  setZoom,
  pan,
  setPan,
  minZoom = 0.25,
  maxZoom = 2,
}: UseTouchGesturesProps): TouchGestureState => {
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

  /**
   * Calculate distance between two touch points
   */
  const getTouchDistance = useCallback((touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Handle touch start - initiate pan or pinch gesture
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Check if touch is on a topic node - if so, let it handle click
    if ((e.target as HTMLElement).closest('.topic-node')) return;

    if (e.touches.length === 2) {
      // Two fingers - pinch to zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      pinchStartRef.current = { distance, zoom };

      // Also track pan position for combined pan+zoom
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchStartRef.current = {
        x: midX,
        y: midY,
        panX: pan.x,
        panY: pan.y,
      };
      setIsTouchPanning(true);
    } else if (e.touches.length === 1) {
      // Single finger - pan only
      e.preventDefault();
      const touch = e.touches[0];
      setIsTouchPanning(true);
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      pinchStartRef.current = null;
    }
  }, [pan, zoom, getTouchDistance]);

  /**
   * Handle touch move - update pan or zoom based on gesture
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    e.preventDefault();

    if (e.touches.length === 2 && pinchStartRef.current) {
      // Pinch to zoom
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / pinchStartRef.current.distance;
      const newZoom = Math.min(Math.max(pinchStartRef.current.zoom * scale, minZoom), maxZoom);
      setZoom(newZoom);

      // Pan with two fingers
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaX = midX - touchStartRef.current.x;
      const deltaY = midY - touchStartRef.current.y;
      setPan({
        x: touchStartRef.current.panX + deltaX,
        y: touchStartRef.current.panY + deltaY,
      });
    } else if (e.touches.length === 1 && isTouchPanning) {
      // Single finger pan
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      setPan({
        x: touchStartRef.current.panX + deltaX,
        y: touchStartRef.current.panY + deltaY,
      });
    }
  }, [isTouchPanning, getTouchDistance, minZoom, maxZoom, setZoom, setPan]);

  /**
   * Handle touch end - cleanup gesture state
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isTouchPanning) {
      e.preventDefault();
    }
    setIsTouchPanning(false);
    touchStartRef.current = null;
    pinchStartRef.current = null;
  }, [isTouchPanning]);

  return {
    isTouchPanning,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};