import { create } from 'zustand';
import type { VisualMode, OpticsState } from '@/types';

export type ActiveWindow = 'WORLDVIEW' | 'CHANAKYA';

// India-specific layers that Chanakya mode enables
const CHANAKYA_LAYERS = ['aqi', 'isro', 'borders', 'strategic', 'earthquakes'] as const;

interface ModeState {
  current: VisualMode;
  activeWindow: ActiveWindow;
  optics: OpticsState;
  chanakyaActivated: boolean;
  previousMode: VisualMode;
  setMode: (mode: VisualMode) => void;
  setActiveWindow: (window: ActiveWindow) => void;
  setOptic: <K extends keyof OpticsState>(key: K, value: OpticsState[K]) => void;
  activateChanakya: () => void;
  deactivateChanakya: () => void;
}

export { CHANAKYA_LAYERS };

export const useModeStore = create<ModeState>((set, get) => ({
  current: 'CRT',
  activeWindow: 'WORLDVIEW',
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
  chanakyaActivated: false,
  previousMode: 'CRT',
  setMode: (mode) => set({ current: mode }),
  setActiveWindow: (window) => set({ activeWindow: window }),
  setOptic: (key, value) =>
    set((state) => ({
      optics: { ...state.optics, [key]: value },
    })),
  activateChanakya: () => {
    const state = get();
    set({
      activeWindow: 'CHANAKYA',
      previousMode: state.current,
      current: 'CHANAKYA',
      chanakyaActivated: true,
    });
  },
  deactivateChanakya: () => {
    const state = get();
    set({
      activeWindow: 'WORLDVIEW',
      current: state.previousMode,
      chanakyaActivated: false,
    });
  },
}));
