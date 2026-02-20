import { create } from 'zustand';
import type { VisualMode, OpticsState } from '@/types';

interface ModeState {
  current: VisualMode;
  optics: OpticsState;
  setMode: (mode: VisualMode) => void;
  setOptic: <K extends keyof OpticsState>(key: K, value: OpticsState[K]) => void;
}

export const useModeStore = create<ModeState>((set) => ({
  current: 'CRT',
  optics: {
    bloom: 85,
    scanner: 44,
    fog: 'TACTICAL',
    tapefitz: true,
    flickeration: 40,
    distortion: 70,
    scanlines: 32,
    saturation: 55,
  },
  setMode: (mode) => set({ current: mode }),
  setOptic: (key, value) =>
    set((state) => ({
      optics: { ...state.optics, [key]: value },
    })),
}));
