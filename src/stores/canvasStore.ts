import { create } from 'zustand';

interface CanvasState {
  // Viewport state
  zoom: number;
  pan: { x: number; y: number };

  // Interaction state
  selectedNodeId: string | null;
  connectingFromId: string | null;

  // UI Dialog state (dla AddNodeDialog)
  addNodePosition: { x: number; y: number } | null;

  // Actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  selectNode: (nodeId: string | null) => void;
  setConnectingFrom: (nodeId: string | null) => void;
  openAddNodeDialog: (position: { x: number; y: number }) => void;
  closeAddNodeDialog: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  zoom: 1,
  pan: { x: 0, y: 0 },
  selectedNodeId: null,
  connectingFromId: null,
  addNodePosition: null,

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
  setPan: (pan) => set({ pan }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  setConnectingFrom: (connectingFromId) => set({ connectingFromId }),

  openAddNodeDialog: (position) => set({ addNodePosition: position }),
  closeAddNodeDialog: () => set({ addNodePosition: null }),
}));