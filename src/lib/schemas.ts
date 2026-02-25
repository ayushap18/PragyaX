import { z } from 'zod';

// ── Aircraft / Flight Schemas ──

export const AircraftSchema = z.object({
  icao24: z.string(),
  callsign: z.string(),
  originCountry: z.string(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  altitudeM: z.number(),
  altitudeFt: z.number(),
  velocityMs: z.number(),
  velocityKts: z.number(),
  heading: z.number().min(0).max(360),
  verticalRateMs: z.number(),
  onGround: z.boolean(),
  squawk: z.string(),
});

export const FlightResponseSchema = z.object({
  time: z.number(),
  count: z.number(),
  aircraft: z.array(AircraftSchema),
  cached: z.boolean(),
  source: z.string(),
  fallback: z.boolean().optional(),
});

// ── Earthquake Schemas ──

export const EarthquakeSchema = z.object({
  id: z.string(),
  magnitude: z.number(),
  place: z.string(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  depthKm: z.number(),
  timeUtc: z.string(),
  tsunamiRisk: z.boolean(),
  alertLevel: z.string().nullable(),
  url: z.string(),
  felt: z.number().nullable(),
});

export const EarthquakeResponseSchema = z.object({
  count: z.number(),
  earthquakes: z.array(EarthquakeSchema),
  cached: z.boolean(),
  source: z.string(),
});

// ── Satellite Schemas ──

export const SatelliteTLESchema = z.object({
  name: z.string(),
  noradId: z.number(),
  intlDesignator: z.string(),
  tleLine1: z.string(),
  tleLine2: z.string(),
  orbitType: z.string(),
  launchDate: z.string(),
  epoch: z.string(),
  meanMotion: z.number(),
  inclination: z.number(),
  eccentricity: z.number(),
});

export const SatelliteResponseSchema = z.object({
  count: z.number(),
  satellites: z.array(SatelliteTLESchema),
  cached: z.boolean(),
  source: z.string(),
});

// ── AQI Schemas ──

export const AQIStationSchema = z.object({
  id: z.string(),
  stationName: z.string(),
  city: z.string(),
  state: z.string(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  aqi: z.number(),
  pm25: z.number().nullable(),
  pm10: z.number().nullable(),
  no2: z.number().nullable(),
  so2: z.number().nullable(),
  co: z.number().nullable(),
  o3: z.number().nullable(),
  nh3: z.number().nullable(),
  lastUpdated: z.string(),
});

export const AQIResponseSchema = z.object({
  count: z.number(),
  stations: z.array(AQIStationSchema),
  cached: z.boolean(),
  source: z.string(),
});

// ── Vision / Panoptic Schemas ──

export const VisionAnalysisSchema = z.object({
  cameraId: z.string(),
  timestamp: z.string(),
  vehicleCount: z.number(),
  trafficFlow: z.string(),
  anomalies: z.array(z.string()),
  weatherObserved: z.string(),
  crowdDensity: z.string(),
  summary: z.string(),
  cached: z.boolean(),
});

export const DetectedObjectSchema = z.object({
  class: z.string(),
  confidence: z.number().min(0).max(1),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  estimatedLat: z.number().min(-90).max(90),
  estimatedLon: z.number().min(-180).max(180),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const PanopticDetectionSchema = z.object({
  objects: z.array(DetectedObjectSchema),
  sceneContext: z.string(),
  threatLevel: z.number().int().min(0).max(10),
  timestamp: z.string(),
  cameraId: z.string(),
});

// ── Vessel / Maritime Schemas ──

export const VesselSchema = z.object({
  mmsi: z.string(),
  name: z.string(),
  flag: z.string(),
  shipType: z.enum(['CARGO', 'TANKER', 'PASSENGER', 'MILITARY', 'FISHING', 'PLEASURE', 'TUG', 'OTHER']),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  speed: z.number(),
  course: z.number().min(0).max(360),
  heading: z.number().min(0).max(360),
  destination: z.string(),
  length: z.number().optional(),
  status: z.string().optional(),
});

export const VesselResponseSchema = z.object({
  count: z.number(),
  vessels: z.array(VesselSchema),
  cached: z.boolean(),
  source: z.string(),
});

// ── Geofence Schemas ──

export const GeofenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  vertices: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  })).min(3),
  rules: z.object({
    onEnter: z.boolean(),
    onExit: z.boolean(),
    dwellThresholdSec: z.number().nullable(),
    speedThresholdKts: z.number().nullable(),
  }),
  classification: z.enum(['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET']),
  color: z.string(),
  armed: z.boolean(),
  createdAt: z.string(),
});

export const GeofenceBreachSchema = z.object({
  fenceId: z.string(),
  entityId: z.string(),
  entityType: z.enum(['aircraft', 'satellite', 'vessel', 'detection']),
  event: z.enum(['ENTER', 'EXIT', 'DWELL', 'SPEED_EXCEED']),
  timestamp: z.string(),
  position: z.object({
    lat: z.number(),
    lon: z.number(),
    alt: z.number(),
  }),
});

// ── Anomaly Schemas ──

export const AnomalySchema = z.object({
  id: z.string(),
  type: z.enum(['FLIGHT_PATH', 'SEISMIC_SWARM', 'AQI_SPIKE', 'TRAFFIC', 'DETECTION', 'MARITIME', 'CORRELATION']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  score: z.number().min(0).max(100),
  entity: z.string(),
  description: z.string(),
  position: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  detectedAt: z.string(),
  acknowledged: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
});

// ── Mission Planning Schemas ──

export const MissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  classification: z.enum(['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET']),
  status: z.enum(['PLANNING', 'BRIEFED', 'ACTIVE', 'COMPLETE', 'ABORTED']),
  phases: z.array(z.object({
    name: z.string(),
    waypoints: z.array(z.object({
      lat: z.number(),
      lon: z.number(),
      alt: z.number(),
      action: z.string(),
      timeWindow: z.string(),
    })),
    route: z.array(z.object({
      lat: z.number(),
      lon: z.number(),
    })),
  })),
  assets: z.array(z.object({
    callsign: z.string(),
    type: z.string(),
    role: z.string(),
  })),
  zones: z.array(z.object({
    type: z.enum(['INSERTION', 'EXTRACTION', 'HOLDING', 'DANGER', 'NO_FLY']),
    polygon: z.array(z.object({ lat: z.number(), lon: z.number() })),
    color: z.string(),
  })),
  createdAt: z.string(),
  lastModified: z.string(),
});

// ── WebSocket Message Schema ──

export const WSMessageSchema = z.object({
  channel: z.string(),
  timestamp: z.number(),
  payload: z.unknown(),
});

// ── Correlation Schemas ──

export const CorrelationSchema = z.object({
  id: z.string(),
  classification: z.enum(['S', 'TS', 'C']),
  involvedEntities: z.array(z.object({
    type: z.string(),
    id: z.string(),
    domain: z.enum(['FLIGHT', 'SEISMIC', 'CCTV', 'AQI', 'SATELLITE', 'MARITIME']),
  })),
  spatialCenter: z.object({ lat: z.number(), lon: z.number() }),
  radiusKm: z.number(),
  temporalWindow: z.object({ start: z.string(), end: z.string() }),
  narrative: z.string(),
  confidenceScore: z.number().min(0).max(100),
  recommendedAction: z.string(),
});

// ── Validate helper ──

export function safeParse<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Schema Validation Failed]', result.error.issues);
  }
  return { success: false, error: result.error };
}
