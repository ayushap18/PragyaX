import { create } from 'zustand';
import type { ConnectionStatus } from '@/services/wsService';

interface Vessel {
  mmsi: string;
  name: string;
  flag: string;
  shipType: 'CARGO' | 'TANKER' | 'PASSENGER' | 'MILITARY' | 'FISHING' | 'PLEASURE' | 'TUG' | 'OTHER';
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  destination: string;
  length?: number;
  status?: string;
}

interface Geofence {
  id: string;
  name: string;
  vertices: { lat: number; lon: number }[];
  rules: {
    onEnter: boolean;
    onExit: boolean;
    dwellThresholdSec: number | null;
    speedThresholdKts: number | null;
  };
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
  color: string;
  armed: boolean;
  createdAt: string;
}

interface GeofenceBreach {
  fenceId: string;
  entityId: string;
  entityType: 'aircraft' | 'satellite' | 'vessel' | 'detection';
  event: 'ENTER' | 'EXIT' | 'DWELL' | 'SPEED_EXCEED';
  timestamp: string;
  position: { lat: number; lon: number; alt: number };
}

interface Anomaly {
  id: string;
  type: 'FLIGHT_PATH' | 'SEISMIC_SWARM' | 'AQI_SPIKE' | 'TRAFFIC' | 'DETECTION' | 'MARITIME' | 'CORRELATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  entity: string;
  description: string;
  position: { lat: number; lon: number };
  detectedAt: string;
  acknowledged: boolean;
  metadata: Record<string, unknown>;
}

interface DetectedObject {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  estimatedLat: number;
  estimatedLon: number;
  attributes?: Record<string, unknown>;
}

interface PanopticDetection {
  objects: DetectedObject[];
  sceneContext: string;
  threatLevel: number;
  timestamp: string;
  cameraId: string;
}

interface Mission {
  id: string;
  name: string;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
  status: 'PLANNING' | 'BRIEFED' | 'ACTIVE' | 'COMPLETE' | 'ABORTED';
  phases: {
    name: string;
    waypoints: { lat: number; lon: number; alt: number; action: string; timeWindow: string }[];
    route: { lat: number; lon: number }[];
  }[];
  assets: { callsign: string; type: string; role: string }[];
  zones: {
    type: 'INSERTION' | 'EXTRACTION' | 'HOLDING' | 'DANGER' | 'NO_FLY';
    polygon: { lat: number; lon: number }[];
    color: string;
  }[];
  createdAt: string;
  lastModified: string;
}

// ── Geofence Store ──

interface GeofenceState {
  geofences: Geofence[];
  breaches: GeofenceBreach[];
  addGeofence: (fence: Geofence) => void;
  removeGeofence: (id: string) => void;
  toggleArm: (id: string) => void;
  addBreach: (breach: GeofenceBreach) => void;
  clearBreaches: () => void;
}

export const useGeofenceStore = create<GeofenceState>((set) => ({
  geofences: [],
  breaches: [],
  addGeofence: (fence) => set((s) => ({ geofences: [...s.geofences, fence] })),
  removeGeofence: (id) => set((s) => ({ geofences: s.geofences.filter((f) => f.id !== id) })),
  toggleArm: (id) => set((s) => ({
    geofences: s.geofences.map((f) => f.id === id ? { ...f, armed: !f.armed } : f),
  })),
  addBreach: (breach) => set((s) => ({
    breaches: [breach, ...s.breaches].slice(0, 100),
  })),
  clearBreaches: () => set({ breaches: [] }),
}));

// ── Anomaly Store ──

interface AnomalyState {
  anomalies: Anomaly[];
  addAnomaly: (anomaly: Anomaly) => void;
  acknowledgeAnomaly: (id: string) => void;
  clearAnomalies: () => void;
}

export const useAnomalyStore = create<AnomalyState>((set) => ({
  anomalies: [],
  addAnomaly: (anomaly) => set((s) => ({
    anomalies: [anomaly, ...s.anomalies].slice(0, 50),
  })),
  acknowledgeAnomaly: (id) => set((s) => ({
    anomalies: s.anomalies.map((a) => a.id === id ? { ...a, acknowledged: true } : a),
  })),
  clearAnomalies: () => set({ anomalies: [] }),
}));

// ── Detection Store ──

interface DetectionState {
  detections: PanopticDetection[];
  addDetection: (det: PanopticDetection) => void;
  clearDetections: () => void;
}

export const useDetectionStore = create<DetectionState>((set) => ({
  detections: [],
  addDetection: (det) => set((s) => ({
    detections: [det, ...s.detections].slice(0, 30),
  })),
  clearDetections: () => set({ detections: [] }),
}));

// ── Vessel Store (extends dataStore pattern) ──

interface VesselState {
  vessels: Vessel[];
  lastVesselFetch: number;
  setVessels: (vessels: Vessel[]) => void;
}

export const useVesselStore = create<VesselState>((set) => ({
  vessels: [],
  lastVesselFetch: 0,
  setVessels: (vessels) => set({ vessels, lastVesselFetch: Date.now() }),
}));

// ── Mission Store ──

interface MissionState {
  missions: Mission[];
  activeMission: string | null;
  addMission: (mission: Mission) => void;
  removeMission: (id: string) => void;
  setActiveMission: (id: string | null) => void;
  updateMissionStatus: (id: string, status: Mission['status']) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  missions: [],
  activeMission: null,
  addMission: (mission) => set((s) => ({ missions: [...s.missions, mission] })),
  removeMission: (id) => set((s) => ({
    missions: s.missions.filter((m) => m.id !== id),
    activeMission: s.activeMission === id ? null : s.activeMission,
  })),
  setActiveMission: (id) => set({ activeMission: id }),
  updateMissionStatus: (id, status) => set((s) => ({
    missions: s.missions.map((m) => m.id === id ? { ...m, status, lastModified: new Date().toISOString() } : m),
  })),
}));

// ── Temporal Playback Store ──

interface TemporalState {
  playbackTime: number;
  playbackSpeed: 1 | 2 | 4 | 16;
  isPlaying: boolean;
  mode: 'live' | 'replay';
  setPlaybackTime: (time: number) => void;
  setPlaybackSpeed: (speed: 1 | 2 | 4 | 16) => void;
  togglePlaying: () => void;
  setMode: (mode: 'live' | 'replay') => void;
  stepForward: (seconds: number) => void;
  stepBackward: (seconds: number) => void;
}

export const useTemporalStore = create<TemporalState>((set) => ({
  playbackTime: Date.now(),
  playbackSpeed: 1,
  isPlaying: false,
  mode: 'live',
  setPlaybackTime: (time) => set({ playbackTime: time }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setMode: (mode) => set({ mode, isPlaying: mode === 'replay' ? false : false }),
  stepForward: (seconds) => set((s) => ({ playbackTime: s.playbackTime + seconds * 1000 })),
  stepBackward: (seconds) => set((s) => ({ playbackTime: s.playbackTime - seconds * 1000 })),
}));

// ── Connection Store ──

interface ConnectionState {
  connectionStatus: ConnectionStatus;
  lastWsHeartbeat: number;
  wsLatency: number;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastHeartbeat: (time: number) => void;
  setWsLatency: (ms: number) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connectionStatus: 'disconnected',
  lastWsHeartbeat: 0,
  wsLatency: 0,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLastHeartbeat: (time) => set({ lastWsHeartbeat: time }),
  setWsLatency: (ms) => set({ wsLatency: ms }),
}));

// ── Spectrum Store ──

interface DetectedSignal {
  frequencyMHz: number;
  bandwidthKHz: number;
  powerDbm: number;
  modulation: 'AM' | 'FM' | 'PSK' | 'QAM' | 'FHSS' | 'UNKNOWN';
  classification: 'CIVILIAN' | 'MILITARY' | 'SATELLITE' | 'UNKNOWN';
  label: string;
  anomalous: boolean;
}

interface SpectrumState {
  signals: DetectedSignal[];
  noiseFloor: number;
  rangeStartMHz: number;
  rangeEndMHz: number;
  gain: number;
  setSignals: (signals: DetectedSignal[]) => void;
  setRange: (start: number, end: number) => void;
  setGain: (gain: number) => void;
}

export const useSpectrumStore = create<SpectrumState>((set) => ({
  signals: [],
  noiseFloor: -110,
  rangeStartMHz: 0.003,
  rangeEndMHz: 30000,
  gain: 0,
  setSignals: (signals) => set({ signals }),
  setRange: (start, end) => set({ rangeStartMHz: start, rangeEndMHz: end }),
  setGain: (gain) => set({ gain }),
}));

export type { Geofence, GeofenceBreach, Anomaly, DetectedObject, PanopticDetection, Mission, Vessel, DetectedSignal };
