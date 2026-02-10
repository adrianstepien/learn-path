import { useState, useCallback } from 'react';

interface UseZoomPanReturn {
  zoom: number;
  pan: { x: number; y: number };
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetView: () => void;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

interface UseZoomPanOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  initialZoom?: number;
  initialPan?: { x: number; y: number };
}

/**
 * Custom hook to manage zoom and pan state for canvas interactions
 * Follows SRP by handling only zoom/pan logic
 */
export const useZoomPan = ({
  minZoom = 0.25,
  maxZoom = 2,
  zoomStep = 0.1,
  initialZoom = 1,
  initialPan = { x: 0, y: 0 },
}: UseZoomPanOptions = {}): UseZoomPanReturn => {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState(initialPan);

  /**
   * Increase zoom level
   */
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom));
  }, [maxZoom, zoomStep]);

  /**
   * Decrease zoom level
   */
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom));
  }, [minZoom, zoomStep]);

  /**
   * Reset zoom and pan to initial values
   */
  const handleResetView = useCallback(() => {
    setZoom(initialZoom);
    setPan(initialPan);
  }, [initialZoom, initialPan]);

  return {
    zoom,
    pan,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    setPan,
    setZoom,
  };
};