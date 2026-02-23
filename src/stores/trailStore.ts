import { create } from 'zustand';

interface TrailPosition {
  lat: number;
  lon: number;
  alt: number;
  time: number;
}

interface TrailStore {
  trails: Map<string, TrailPosition[]>;
  pushPosition: (id: string, lat: number, lon: number, alt: number) => void;
  clearTrail: (id: string) => void;
  clearAll: () => void;
}

const MAX_TRAIL_LENGTH = 20;

export const useTrailStore = create<TrailStore>((set) => ({
  trails: new Map(),
  pushPosition: (id, lat, lon, alt) =>
    set((state) => {
      const trails = new Map(state.trails);
      const existing = trails.get(id) || [];
      const updated = [...existing, { lat, lon, alt, time: Date.now() }];
      if (updated.length > MAX_TRAIL_LENGTH) {
        updated.splice(0, updated.length - MAX_TRAIL_LENGTH);
      }
      trails.set(id, updated);
      return { trails };
    }),
  clearTrail: (id) =>
    set((state) => {
      const trails = new Map(state.trails);
      trails.delete(id);
      return { trails };
    }),
  clearAll: () => set({ trails: new Map() }),
}));
