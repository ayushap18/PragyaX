import { create } from 'zustand';

export interface IntelEvent {
  id: number;
  time: string;
  text: string;
  type: 'info' | 'warn' | 'alert' | 'success';
}

interface HUDState {
  fps: number;
  cpu: number;
  mem: number;
  utcTime: string;
  entityCount: number;
  signalStrength: number;
  feedQuality: number;
  latency: number;
  lastUpdate: number;
  intelFeed: IntelEvent[];
  showSystemStatus: boolean;
  updateClock: () => void;
  setFps: (fps: number) => void;
  simulateTick: () => void;
  toggleSystemStatus: () => void;
}

let eventId = 0;
let lastEventTime = 0;

const INTEL_MESSAGES: { text: string; type: IntelEvent['type'] }[] = [
  { text: 'SIGINT INTERCEPT — FREQ 14.223 GHz DECODED', type: 'alert' },
  { text: 'SAT PASS KH-11 OVERHEAD IN 4M 22S', type: 'info' },
  { text: 'AIRCRAFT SQUAWK 7700 — MONITORING', type: 'warn' },
  { text: 'FEED SYNC NOMINAL — ALL CHANNELS GREEN', type: 'success' },
  { text: 'GEOFENCE BREACH — SECTOR 7G FLAGGED', type: 'alert' },
  { text: 'WEATHER UPDATE — CEILING 12000FT BROKEN', type: 'info' },
  { text: 'NRO TASKING ORDER RECEIVED — ACK PENDING', type: 'warn' },
  { text: 'OSINT CRAWLER — 14 NEW ENTITIES INDEXED', type: 'info' },
  { text: 'ENCRYPTION RATCHET — SESSION KEY ROTATED', type: 'success' },
  { text: 'ADS-B ANOMALY — CALLSIGN MISMATCH DETECTED', type: 'alert' },
  { text: 'TERRAIN MAPPING UPDATE — GRID 18S COMPLETE', type: 'success' },
  { text: 'COMSAT RELAY LATENCY SPIKE — 47ms', type: 'warn' },
  { text: 'ORBITAL DEBRIS ALERT — LEO CONJUNCTION +2H', type: 'warn' },
  { text: 'TACTICAL MESH — 6 NODES ONLINE', type: 'success' },
  { text: 'IMINT PRODUCT — HIGH-RES TILE CACHED', type: 'info' },
];

function jitter(base: number, range: number): number {
  return Math.round(base + (Math.random() - 0.5) * range);
}

export const useHUDStore = create<HUDState>((set, get) => ({
  fps: 60,
  cpu: 34,
  mem: 62,
  utcTime: new Date().toISOString().slice(11, 19) + 'Z',
  entityCount: 8414,
  signalStrength: 97,
  feedQuality: 97.3,
  latency: 12,
  lastUpdate: 0,
  intelFeed: [],
  showSystemStatus: false,
  updateClock: () =>
    set({ utcTime: new Date().toISOString().slice(11, 19) + 'Z' }),
  setFps: (fps) => set({ fps }),
  toggleSystemStatus: () => set((state) => ({ showSystemStatus: !state.showSystemStatus })),
  simulateTick: () => {
    const state = get();
    const now = Date.now();

    const newFps = jitter(60, 6);
    const newCpu = jitter(34, 8);
    const newMem = Math.min(95, Math.max(45, jitter(state.mem, 6)));
    const newEntities = jitter(8414, 30);
    const newSignal = Math.min(100, Math.max(88, jitter(state.signalStrength, 4)));
    const newFeedQuality = Math.min(99.9, Math.max(93, +(state.feedQuality + (Math.random() - 0.5) * 0.6).toFixed(1)));
    const newLatency = Math.max(8, Math.min(28, jitter(state.latency, 5)));
    const newLastUpdate = +(Math.random() * 2).toFixed(1);

    let newFeed = [...state.intelFeed];
    if (now - lastEventTime > 3000 + Math.random() * 4000 || !state.intelFeed.length) {
      const msg = INTEL_MESSAGES[Math.floor(Math.random() * INTEL_MESSAGES.length)];
      newFeed = [
        {
          id: eventId++,
          time: new Date().toISOString().slice(11, 19) + 'Z',
          text: msg.text,
          type: msg.type,
        },
        ...newFeed,
      ].slice(0, 12);
      lastEventTime = now;
    }

    set({
      fps: newFps,
      cpu: newCpu,
      mem: newMem,
      entityCount: newEntities,
      signalStrength: newSignal,
      feedQuality: newFeedQuality,
      latency: newLatency,
      lastUpdate: newLastUpdate,
      utcTime: new Date().toISOString().slice(11, 19) + 'Z',
      intelFeed: newFeed,
    });
  },
}));
