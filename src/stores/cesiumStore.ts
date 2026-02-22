import { create } from 'zustand';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface CesiumState {
  viewer: any | null;
  cesium: any | null;
  setViewer: (viewer: any, cesium: any) => void;
}

export const useCesiumStore = create<CesiumState>((set) => ({
  viewer: null,
  cesium: null,
  setViewer: (viewer, cesium) => set({ viewer, cesium }),
}));
