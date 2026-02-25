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
const MAX_TRACKED_ENTITIES = 500;

export const useTrailStore = create<TrailStore>((set) => ({
  trails: new Map(),
  pushPosition: (id, lat, lon, alt) =>
    set((state) => {
      const trails = new Map(state.trails);

      // Enforce max tracked entities to prevent unbounded memory growth
      if (trails.size >= MAX_TRACKED_ENTITIES && !trails.has(id)) {
        const firstKey = trails.keys().next().value;
        if (firstKey !== undefined) trails.delete(firstKey);
      }

      const existing = trails.get(id);
      if (existing) {
        // Mutate in-place instead of spread + splice
        existing.push({ lat, lon, alt, time: Date.now() });
        if (existing.length > MAX_TRAIL_LENGTH) {
          existing.shift();
        }
        trails.set(id, existing);
      } else {
        trails.set(id, [{ lat, lon, alt, time: Date.now() }]);
      }

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
