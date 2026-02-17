import { useState, useCallback } from 'react';

export const useCanvasState = () => {
  // Stan wizualny (zoom/pan) trzymany lokalnie
  const [transform, setTransform] = useState({ zoom: 1, pan: { x: 0, y: 0 } });

  const setZoom = useCallback((zoom: number) => {
    setTransform(prev => ({ ...prev, zoom: Math.max(0.25, Math.min(2, zoom)) }));
  }, []);

  const setPan = useCallback((pan: { x: number; y: number }) => {
    setTransform(prev => ({ ...prev, pan }));
  }, []);

  return {
    zoom: transform.zoom,
    pan: transform.pan,
    setZoom,
    setPan
  };
};