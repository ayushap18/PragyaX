export type VisualMode = 'NORMAL' | 'CRT' | 'NVG' | 'FLIR' | 'DRONE';

export type LayerName = 'flights' | 'earthquakes' | 'satellites' | 'traffic' | 'weather' | 'cctv';

export interface City {
  name: string;
  lat: number;
  lon: number;
  landmarks: string[];
}

export interface LayerConfig {
  id: LayerName;
  label: string;
  icon: string;
  defaultEnabled: boolean;
  mockCount?: number;
}

export interface OpticsState {
  bloom: number;
  scanner: number;
  fog: 'CLEAR' | 'STANDARD' | 'TACTICAL';
  tapefitz: boolean;
  flickeration: number;
  distortion: number;
  scanlines: number;
  saturation: number;
}

// ── Data Layer Types ──

export interface Aircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lon: number;
  altitudeM: number;
  altitudeFt: number;
  velocityMs: number;
  velocityKts: number;
  heading: number;
  verticalRateMs: number;
  onGround: boolean;
  squawk: string;
}

export interface FlightResponse {
  time: number;
  count: number;
  aircraft: Aircraft[];
  cached: boolean;
  source: string;
  fallback?: boolean;
}

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lon: number;
  depthKm: number;
  timeUtc: string;
  tsunamiRisk: boolean;
  alertLevel: string | null;
  url: string;
  felt: number | null;
}

export interface EarthquakeResponse {
  count: number;
  earthquakes: Earthquake[];
  cached: boolean;
  source: string;
}

export interface SatelliteTLE {
  name: string;
  noradId: number;
  intlDesignator: string;
  tleLine1: string;
  tleLine2: string;
  orbitType: string;
  launchDate: string;
  epoch: string;
  meanMotion: number;
  inclination: number;
  eccentricity: number;
}

export interface SatelliteResponse {
  count: number;
  satellites: SatelliteTLE[];
  cached: boolean;
  source: string;
}

export interface SatellitePosition {
  lat: number;
  lon: number;
  altitudeKm: number;
  velocityKms: number;
}

// ── Camera Types ──

export interface CameraPosition {
  id: string;
  label: string;
  city: string;
  lat: number;
  lon: number;
  feedUrl: string;
  direction: string;
}

// ── AI Types ──

export interface IntelBriefRequest {
  lat: number;
  lon: number;
  altitudeKm: number;
  currentMode: string;
  activeLayers: string[];
  aircraftCount: number;
  satelliteCount: number;
  nearestQuake: { magnitude: number; place: string; distanceKm: number } | null;
  weatherSummary: string;
  utcTimestamp: string;
}

export interface IntelBriefResponse {
  brief: string;
  missionId: string;
  generatedAt: string;
  cached: boolean;
}

export interface CommandRequest {
  command: string;
  context: {
    currentCity: string;
    currentLat: number;
    currentLon: number;
    currentMode: string;
    activeLayers: string[];
    flightCount: number;
    satelliteCount: number;
  };
}

export type CommandAction =
  | 'fly_to'
  | 'set_mode'
  | 'toggle_layer'
  | 'filter_flights'
  | 'multi'
  | 'alert';

export interface CommandResponse {
  action: CommandAction;
  params: Record<string, unknown>;
  confidence: number;
  parsed: boolean;
  narration: string;
}

export interface VisionAnalysisResponse {
  cameraId: string;
  timestamp: string;
  vehicleCount: number;
  trafficFlow: string;
  anomalies: string[];
  weatherObserved: string;
  crowdDensity: string;
  summary: string;
  cached: boolean;
}

export interface APIError {
  error: true;
  code: string;
  message: string;
  retryAfterMs?: number;
}
