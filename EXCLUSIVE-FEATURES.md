# PragyaX — Exclusive Feature Architecture

## Classification: INTERNAL — DEVELOPMENT ROADMAP

> Features designed to surpass every open-source geospatial intelligence console in existence.
> Each feature below is absent from both PragyaX (current) and the World Monitor reference architecture.

---

## PART A — FEATURES FROM WORLD MONITOR THAT PragyaX MUST ABSORB

### A1. WebSocket Real-Time Push System

**Gap**: PragyaX polls every 10s via HTTP (`setInterval` in `useFlightPolling.ts`). World Monitor pushes data via WebSocket the instant it arrives.

**Architecture**:

```
┌─────────────────────┐       ┌─────────────────────────┐
│  Next.js API Route  │       │   WebSocket Hub Server   │
│  /api/ws/upgrade    │──────▶│   (ws or socket.io)      │
│                     │       │                          │
│  Upgrade: websocket │       │   Channels:              │
│                     │       │   • flights:live         │
└─────────────────────┘       │   • earthquakes:live     │
                              │   • satellites:pass      │
┌─────────────────────┐       │   • cctv:detection       │
│  DataPollingManager  │◀─────│   • alerts:geofence      │
│  → DataStreamManager │      │   • intel:classified     │
│                     │       │   • heartbeat            │
│  useDataStream()    │       └─────────────────────────┘
│  replaces all       │
│  useXxxPolling()    │       ┌─────────────────────────┐
│  hooks              │       │   Fallback: SSE / HTTP   │
│                     │◀──────│   polling at 10s if WS   │
└─────────────────────┘       │   connection drops       │
                              └─────────────────────────┘
```

**Implementation**:

| File | Change |
|------|--------|
| `src/services/wsService.ts` | NEW — WebSocket client with auto-reconnect, exponential backoff, channel subscription |
| `src/stores/dataStore.ts` | Add `connectionStatus: 'ws' \| 'sse' \| 'polling' \| 'offline'`, `lastWsHeartbeat: number` |
| `src/hooks/useDataStream.ts` | NEW — Unified hook replacing all 4 polling hooks. Connects WS, falls back to SSE, then HTTP |
| `src/components/data/DataPollingManager.tsx` | Rename to `DataStreamManager.tsx`, use single `useDataStream()` |
| `src/app/api/ws/route.ts` | NEW — WebSocket upgrade endpoint using Next.js edge runtime |
| `TopHUD.tsx` | Show WS/SSE/POLL connection status indicator |

**Wire format** (JSON over WS):
```json
{
  "channel": "flights:live",
  "timestamp": 1706000000000,
  "payload": {
    "type": "delta",
    "added": [...Aircraft],
    "updated": [...Aircraft],
    "removed": ["icao24_1", "icao24_2"]
  }
}
```

Delta updates instead of full payload — only send changes since last push. Reduces bandwidth 80-95%.

---

### A2. Panoptic Detection Pipeline

**Gap**: PragyaX's `/api/vision/analyze` generates text summaries from CCTV metadata. World Monitor's panoptic pipeline returns **structured detection objects with estimated GPS coordinates**.

**Architecture**:

```
Camera Frame (MJPEG/HLS)
        │
        ▼
┌─────────────────────────┐
│  Gemini 2.0 Flash       │
│  multimodal analysis     │
│                          │
│  Input: base64 frame +   │
│  camera calibration      │
│  (lat, lon, heading,     │
│   fov, tilt)             │
│                          │
│  Output: Structured      │
│  detection schema        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Zod Validation Layer    │
│                          │
│  PanopticDetection {     │
│    objects: [{            │
│      class: string       │
│      confidence: float   │
│      bbox: [x,y,w,h]    │ ← pixel-space bounding box
│      estimatedLat: float │ ← projected GPS coordinate
│      estimatedLon: float │
│      attributes: {}      │ ← color, direction, speed
│    }]                    │
│    sceneContext: string   │
│    threatLevel: 0-10     │
│  }                       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  CesiumJS Overlay        │
│  Real-time detection     │
│  markers on 3D globe     │
│  with confidence halos   │
└─────────────────────────┘
```

**Implementation**:

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `PanopticDetection`, `DetectedObject`, `CameraCalibration` types |
| `src/app/api/vision/panoptic/route.ts` | NEW — Accepts camera frame + calibration, returns structured detections with GPS projection |
| `src/services/panopticService.ts` | NEW — Client-side detection request/cache manager |
| `src/lib/gpsProjection.ts` | NEW — Pixel-to-GPS coordinate projection using camera calibration matrix |
| `src/components/layers/DetectionOverlayLayer.tsx` | NEW — Renders detection bounding boxes projected onto CesiumJS as ground polygons |
| `src/stores/detectionStore.ts` | NEW — Stores active detections with TTL-based expiration |

**Camera calibration model**:
```typescript
interface CameraCalibration {
  lat: number;           // camera position
  lon: number;
  altitudeM: number;     // camera height above ground
  heading: number;       // compass bearing (0-360)
  tilt: number;          // downward angle (0 = horizon, 90 = nadir)
  fovHorizontal: number; // field of view in degrees
  fovVertical: number;
  resolution: [number, number]; // pixel dimensions
}
```

**GPS projection formula**: Using pinhole camera model + terrain intersection:
```
groundDistance = altitudeM * tan(tilt + pixelAngleFromCenter)
bearing = heading + horizontalPixelOffset * (fovH / resolutionX)
detectedLat = lat + groundDistance * cos(bearing) / 111320
detectedLon = lon + groundDistance * sin(bearing) / (111320 * cos(lat))
```

---

### A3. Satellite Imagery Layer (Sentinel Hub / Planet)

**Gap**: PragyaX renders satellite positions from TLE orbital data but shows no actual satellite imagery. World Monitor integrates Sentinel-2 and Planet imagery for ground observation.

**Architecture**:

| File | Change |
|------|--------|
| `src/app/api/imagery/sentinel/route.ts` | NEW — Proxies Sentinel Hub Process API (NDVI, true color, false color composites) |
| `src/app/api/imagery/planet/route.ts` | NEW — Proxies Planet Basemaps / Scene API |
| `src/services/imageryService.ts` | NEW — Client requesting specific area + spectral band |
| `src/components/layers/SatelliteImageryLayer.tsx` | NEW — Drapes imagery tiles on CesiumJS terrain as `ImageryProvider` |
| `src/components/panels/ImageryPanel.tsx` | NEW — Band selector (RGB, NDVI, SWIR, NIR), date picker, cloud cover filter |
| `.env.local` | Add `SENTINEL_CLIENT_ID`, `SENTINEL_CLIENT_SECRET`, `PLANET_API_KEY` |

**Spectral bands available**:
- True Color (B4/B3/B2)
- False Color Infrared (B8/B4/B3)
- NDVI — Vegetation health
- SWIR — Fire/thermal detection
- Moisture Index
- Urban Area detection

**Imagery draping on CesiumJS**:
```typescript
viewer.imageryLayers.addImageryProvider(
  new Cesium.UrlTemplateImageryProvider({
    url: `/api/imagery/sentinel?bbox={west},{south},{east},{north}&band=${band}&date=${date}`,
    rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north),
    minimumLevel: 8,
    maximumLevel: 14,
  })
);
```

---

### A4. Strict Data Validation Pipeline (Zod Schemas)

**Gap**: PragyaX trusts all API responses without runtime validation. AI model outputs are parsed with `JSON.parse()` and hope. World Monitor uses Pydantic.

**Implementation**:

| File | Change |
|------|--------|
| `src/lib/schemas.ts` | NEW — Zod schemas mirroring every type in `src/types/index.ts` |
| `src/lib/validate.ts` | NEW — `safeParse<T>(schema, data)` wrapper with structured error logging |
| All service files | Wrap every `res.json()` with `safeParse(schema, await res.json())` |
| All API routes | Validate request bodies with Zod before processing |

**Key schemas**:
```typescript
const AircraftSchema = z.object({
  icao24: z.string().regex(/^[0-9a-f]{6}$/),
  callsign: z.string().max(8),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  altitudeFt: z.number().min(0).max(60000),
  heading: z.number().min(0).max(360),
  // ...
});

const PanopticDetectionSchema = z.object({
  objects: z.array(z.object({
    class: z.string(),
    confidence: z.number().min(0).max(1),
    estimatedLat: z.number().min(-90).max(90),
    estimatedLon: z.number().min(-180).max(180),
  })),
  threatLevel: z.number().int().min(0).max(10),
});
```

---

## PART B — EXCLUSIVE FEATURES BEYOND BOTH PROJECTS

### B1. Temporal Playback Engine (Time Machine)

**Neither project has this.** A timeline scrubber that replays all data layers at any point in history.

**Architecture**:

```
                    ┌──────────────────────────┐
                    │   Timeline Scrubber Bar   │
                    │   ◀ ║ ▶  ──●────────────  │
                    │   2024-01-15 14:32:07 UTC │
                    │   Speed: 1x 2x 4x 16x    │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  TemporalStore (Zustand)   │
                    │                            │
                    │  playbackTime: number       │
                    │  playbackSpeed: 1|2|4|16    │
                    │  isPlaying: boolean         │
                    │  mode: 'live' | 'replay'    │
                    │                            │
                    │  When mode === 'replay':    │
                    │  All data layers query      │
                    │  historical snapshots       │
                    │  instead of live feeds      │
                    └────────────┬─────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
    Flight History       Earthquake Archive     Satellite Passes
    (OpenSky archives)   (USGS 30-day)          (TLE propagation
     10s granularity      any magnitude)         backward/forward)
```

**Implementation**:

| File | Change |
|------|--------|
| `src/stores/temporalStore.ts` | NEW — Playback state: time cursor, speed, mode |
| `src/components/ui/TimelineScrubber.tsx` | NEW — Horizontal scrubber bar with play/pause, speed, date selector |
| `src/hooks/useTemporalData.ts` | NEW — Intercepts all data hooks; in replay mode, fetches historical data for `playbackTime` |
| `src/app/api/flights/history/route.ts` | NEW — Queries OpenSky historical endpoint by timestamp |
| `src/app/api/earthquakes/history/route.ts` | NEW — Queries USGS with `starttime`/`endtime` params |
| `BottomNav.tsx` or `TopHUD.tsx` | Mount `<TimelineScrubber />` |

**Keyboard shortcuts**: `Space` = play/pause, `[` / `]` = speed down/up, `←` / `→` = step -10s / +10s

---

### B2. Geofence Engine & Alert Zones

**Neither project has user-defined geofences.** Operators draw polygonal zones on the globe. When any tracked entity enters or exits, the system fires classified alerts.

**Architecture**:

```
┌──────────────────────────┐     ┌─────────────────────────┐
│  Geofence Drawing Tool    │     │  Geofence Evaluation     │
│                           │     │  Engine (60 fps tick)     │
│  • Click vertices on map  │     │                          │
│  • Close polygon          │     │  For each entity:         │
│  • Set alert rules:       │────▶│  • Point-in-polygon test  │
│    - ENTER                │     │  • Track last state       │
│    - EXIT                 │     │  • Fire ENTER/EXIT event  │
│    - DWELL > T seconds    │     │  • Route to AlertToast    │
│    - SPEED_EXCEED         │     │  • Log to IntelFeed       │
│  • Set classification     │     │                          │
│  • Set color/opacity      │     │  Ray-casting algorithm    │
└──────────────────────────┘     └─────────────────────────┘
```

**Implementation**:

| File | Change |
|------|--------|
| `src/stores/geofenceStore.ts` | NEW — Geofence CRUD: polygons, alert rules, active states |
| `src/components/layers/GeofenceLayer.tsx` | NEW — Renders fences as translucent CesiumJS polygons with dashed outlines |
| `src/hooks/useGeofenceEngine.ts` | NEW — 1Hz evaluation loop: checks all entities against all active fences |
| `src/lib/pointInPolygon.ts` | NEW — Raycasting point-in-polygon for lat/lon coordinates |
| `src/components/panels/GeofencePanel.tsx` | NEW — Create/edit/delete fences, view breach history |
| `CommandModal.tsx` | Add geofence commands: `FENCE CREATE`, `FENCE LIST`, `FENCE ARM` |

**Geofence types**:
```typescript
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
  entityType: 'aircraft' | 'satellite' | 'detection';
  event: 'ENTER' | 'EXIT' | 'DWELL' | 'SPEED_EXCEED';
  timestamp: string;
  position: { lat: number; lon: number; alt: number };
}
```

---

### B3. Multi-Camera Surveillance Grid

**Neither project has a camera grid view.** A tiled video wall showing 4/6/9 simultaneous CCTV feeds with live AI detection overlays.

**Architecture**:

```
┌────────────────────────────────────────────────────┐
│                SURVEILLANCE GRID — 2x2              │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │ CAM: DEL-IGI-T3  │  │ CAM: MUM-BKC-01  │        │
│  │ [Live MJPEG]     │  │ [Live MJPEG]      │        │
│  │ Vehicles: 34     │  │ Vehicles: 12      │        │
│  │ Flow: HEAVY      │  │ Flow: MODERATE    │        │
│  │ Threat: 0        │  │ Threat: 0         │        │
│  │ ■ AI ANALYZING   │  │ ■ AI ANALYZING    │        │
│  └──────────────────┘  └──────────────────┘        │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │ CAM: BLR-MG-RD   │  │ CAM: CHN-ECR-01  │        │
│  │ [Live MJPEG]     │  │ [Live MJPEG]      │        │
│  │ Vehicles: 8      │  │ Vehicles: 45      │        │
│  │ Flow: FREE       │  │ Flow: HEAVY       │        │
│  │ ■ AI ANALYZING   │  │ ■ AI ANALYZING    │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                     │
│  Grid: [2x2] [2x3] [3x3]  Auto-rotate: ON  5s     │
└────────────────────────────────────────────────────┘
```

**Implementation**:

| File | Change |
|------|--------|
| `src/components/panels/SurveillanceGrid.tsx` | NEW — CSS grid of camera tiles, each with `<img>` for MJPEG + detection overlay + stats |
| `src/hooks/useSurveillanceGrid.ts` | NEW — Manages grid layout, camera selection, auto-rotation timer |
| `src/stores/surveillanceStore.ts` | NEW — Grid config, selected cameras, detection results per camera |
| `BottomNav.tsx` | Add GRID button to toggle surveillance grid overlay |
| `PragyaXShell.tsx` | Conditional render: if grid active, overlay grid panel on top of map |

**Grid tile component**:
```typescript
interface GridTile {
  cameraId: string;
  feedUrl: string;
  detectionResult: PanopticDetection | null;
  isAnalyzing: boolean;
  lastAnalysisTime: number;
  connectionStatus: 'live' | 'stale' | 'offline';
}
```

---

### B4. Anomaly Detection Engine

**Neither project has ML-based anomaly detection.** The engine watches all data streams and flags statistical outliers: unusual flight paths, seismic swarms, AQI spikes, traffic pattern deviations.

**Architecture**:

```
Data Streams ──▶ Statistical Models ──▶ Anomaly Score ──▶ Alert Classification

Flights:
  • Heading change rate     Z-score > 3σ ──▶ FLIGHT_PATH_ANOMALY
  • Altitude deviation      from norm
  • Squawk code changes     per entity
  • Speed below/above norm

Earthquakes:
  • Frequency clustering    Poisson λ ──▶ SEISMIC_SWARM_DETECTED
  • Magnitude escalation    deviation
  • Depth shallowing

AQI:
  • Sudden PM2.5 spike      Delta > 50 ──▶ AQI_SPIKE_ALERT
  • Multi-station correl.   in < 1h

CCTV:
  • Vehicle count deviation Baseline ──▶ TRAFFIC_ANOMALY
  • Crowd surge detection   comparison
  • Stopped vehicle > T
```

**Implementation**:

| File | Change |
|------|--------|
| `src/lib/anomaly/engine.ts` | NEW — Core anomaly scoring: Z-score, Poisson, delta detection |
| `src/lib/anomaly/flightAnomalies.ts` | NEW — Flight-specific: circling, rapid descent, squawk changes, forbidden zone entry |
| `src/lib/anomaly/seismicAnomalies.ts` | NEW — Earthquake clustering, magnitude escalation, foreshock patterns |
| `src/lib/anomaly/aqiAnomalies.ts` | NEW — PM2.5 spike detection, cross-station correlation |
| `src/stores/anomalyStore.ts` | NEW — Active anomalies, history, severity thresholds |
| `src/hooks/useAnomalyEngine.ts` | NEW — Runs anomaly checks on every data update |
| `src/components/panels/AnomalyPanel.tsx` | NEW — Anomaly feed with severity badges, entity links, dismiss/escalate |
| `hudStore.ts` | Route anomaly events into intelFeed |

**Anomaly object**:
```typescript
interface Anomaly {
  id: string;
  type: 'FLIGHT_PATH' | 'SEISMIC_SWARM' | 'AQI_SPIKE' | 'TRAFFIC' | 'DETECTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;           // 0-100
  entity: string;          // callsign, quakeId, stationId
  description: string;
  position: { lat: number; lon: number };
  detectedAt: string;
  acknowledged: boolean;
  metadata: Record<string, unknown>;
}
```

---

### B5. Cross-Domain Intelligence Correlation Engine

**Neither project correlates across data domains.** When a flight anomaly occurs near an earthquake zone, near a CCTV detection spike, near a raised AQI — the system connects the dots automatically.

**Architecture**:

```
               ┌────────────────────┐
               │  Correlation Engine │
               │                    │
   Anomaly  ──▶│  Spatial window:   │──▶  CorrelatedIntelReport
   Events      │    50km radius     │
               │  Temporal window:  │     "Aircraft SWA1234 entered
               │    ±30 minutes     │      holding pattern 12km from
               │                    │      M4.2 earthquake epicenter
               │  Cross-reference:  │      while CCTV CAM-DEL-03
               │  Flight ↔ Quake    │      detected unusual vehicle
               │  Flight ↔ CCTV     │      clustering. AQI station
               │  Quake ↔ AQI       │      DEL-ANAND reports PM2.5
               │  CCTV ↔ Traffic    │      spike +47 coincident with
               │  Any ↔ Geofence    │      seismic event."
               └────────────────────┘
```

**Implementation**:

| File | Change |
|------|--------|
| `src/lib/correlation/engine.ts` | NEW — Spatial-temporal correlation: Haversine distance + time window matching |
| `src/lib/correlation/rules.ts` | NEW — Correlation rules: which anomaly types can correlate, minimum confidence |
| `src/stores/correlationStore.ts` | NEW — Active correlations, generated reports |
| `src/components/panels/CorrelationPanel.tsx` | NEW — Visual correlation map with linked entities |
| `src/app/api/intel/correlate/route.ts` | NEW — AI-generated natural language correlation reports via Claude/Gemini |

**Correlation output**:
```typescript
interface CorrelatedIntelReport {
  id: string;
  classification: 'S' | 'TS' | 'C';
  involvedEntities: {
    type: string;
    id: string;
    domain: 'FLIGHT' | 'SEISMIC' | 'CCTV' | 'AQI' | 'SATELLITE';
  }[];
  spatialCenter: { lat: number; lon: number };
  radiusKm: number;
  temporalWindow: { start: string; end: string };
  narrative: string;       // AI-generated plain language summary
  confidenceScore: number; // 0-100
  recommendedAction: string;
}
```

---

### B6. Maritime Domain Awareness (AIS Ship Tracking)

**Neither project tracks ships.** PragyaX tracks flights and satellites — adding maritime completes the trifecta: air, space, sea.

**Data source**: MarineTraffic API / AISHub / VesselFinder

**Implementation**:

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `Vessel` type: MMSI, name, flag, shipType, lat, lon, speed, course, destination |
| `src/app/api/vessels/route.ts` | NEW — Proxies AIS data for bounding box |
| `src/services/vesselService.ts` | NEW — Fetch vessel positions |
| `src/hooks/useVesselPolling.ts` | NEW — 30s polling for vessel positions |
| `src/components/layers/VesselLayer.tsx` | NEW — Ship icons on CesiumJS with heading indicators, wake trails |
| `src/stores/dataStore.ts` | Add `vessels: Vessel[]`, `setVessels` |
| `src/constants/layers.ts` | Add `vessels` layer config |
| `src/stores/layerStore.ts` | Add `vessels` layer toggle |

**Vessel type icons**: Cargo (gray), Tanker (orange), Passenger (blue), Military (red), Fishing (green), Pleasure (cyan)

---

### B7. Electromagnetic Spectrum Analyzer

**Neither project visualizes the RF spectrum.** A waterfall display showing signal activity across frequency bands — mimics an SDR spectrum analyzer.

**Architecture**:

```
┌─────────────────────────────────────────────────┐
│  EM SPECTRUM ANALYZER — SECTOR 7G                │
│                                                   │
│  ▲ Power (dBm)                                    │
│  │  ┊   ╻                    ╻╻                   │
│  │  ┊  ╻║╻     ╻            ╻║║╻                  │
│  │  ┊ ╻║║║╻   ╻║╻    ╻╻   ╻║║║║╻     ╻           │
│  │▓▓█▓║║║║║▓▓╻║║║╻▓▓║║║▓▓║║║║║║║▓▓▓╻║╻▓▓▓▓▓▓   │
│  └──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──────▶   │
│    VLF LF MF HF VHF UHF SHF EHF                  │
│     3k 30k 300k 3M 30M 300M 3G 30G  Freq (Hz)   │
│                                                   │
│  Active signals: 14    Anomalous: 2               │
│  Band: FULL SPECTRUM   Gain: AUTO                 │
│                                                   │
│  Waterfall:                                       │
│  ░░▒▓█▓▒░░░▒▓▓▒░░░░▒▓█▓▒░░░░░░▒▓▒░░            │
│  ░░▒▓█▓▒░░░▒▓▒░░░░░▒▓█▓▒░░░░░░▒▓▒░░            │
│  ░░▒▓█▓░░░░▒▓▓▒░░░░▒▓██▓▒░░░░░▒▓▓▒░            │
│  ░░▒▓██▓▒░░▒▓▓▒░░░░▒▓██▓▒░░░░░▒▓▓▒░            │
└─────────────────────────────────────────────────┘
```

**Implementation**:

| File | Change |
|------|--------|
| `src/components/panels/SpectrumAnalyzer.tsx` | NEW — Canvas-rendered spectrum + waterfall display |
| `src/lib/spectrumSimulator.ts` | NEW — Procedural RF spectrum generation: known bands (ADS-B 1090MHz, GPS L1, WiFi 2.4/5GHz, military, satellite downlinks) with noise floor + random signal events |
| `src/stores/spectrumStore.ts` | NEW — Frequency range, gain, detected signals |
| Audio engine integration | Spectrum signals drive subtle audio feedback |

**Signal detection**:
```typescript
interface DetectedSignal {
  frequencyMHz: number;
  bandwidthKHz: number;
  powerDbm: number;
  modulation: 'AM' | 'FM' | 'PSK' | 'QAM' | 'FHSS' | 'UNKNOWN';
  classification: 'CIVILIAN' | 'MILITARY' | 'SATELLITE' | 'UNKNOWN';
  label: string;        // "ADS-B 1090", "GPS L1", "SATCOM Ku-Band"
  anomalous: boolean;   // unexpected signal in this band
}
```

---

### B8. Nuclear / CBRN Event Modeling

**Neither project models CBRN events.** A simulation tool that models the blast radius, fallout plume, and radiation zones of nuclear/chemical/biological events on the 3D globe.

**Implementation**:

| File | Change |
|------|--------|
| `src/components/panels/CBRNModeler.tsx` | NEW — Input panel: event type, yield/agent, wind speed/direction, terrain |
| `src/lib/cbrn/blastModel.ts` | NEW — Nukemap-style blast radius rings (fireball, air blast, thermal, radiation) |
| `src/lib/cbrn/plumeModel.ts` | NEW — Gaussian plume dispersion model for fallout/chemical spread |
| `src/components/layers/CBRNLayer.tsx` | NEW — CesiumJS rendering: concentric blast rings + directional plume polygon |
| `src/stores/cbrnStore.ts` | NEW — Scenario parameters, calculated zones |

**Blast ring calculations** (nuclear):
```
Fireball radius = Y^0.4 * 110 (meters, Y in kilotons)
20 psi overpressure = Y^(1/3) * 200m
5 psi overpressure = Y^(1/3) * 470m
1 psi overpressure = Y^(1/3) * 1400m
Thermal 3rd degree = Y^0.41 * 1200m
```

---

### B9. Mission Planning Overlay

**Neither project has a mission planning tool.** Operators draw routes, waypoints, extraction zones, and timing windows directly on the globe.

**Implementation**:

| File | Change |
|------|--------|
| `src/components/panels/MissionPlanner.tsx` | NEW — Mission editor: name, classification, phases, assets |
| `src/components/layers/MissionLayer.tsx` | NEW — Renders routes (polylines), waypoints (billboards), zones (polygons) on CesiumJS |
| `src/stores/missionStore.ts` | NEW — Mission CRUD, active mission, phase timer |
| `src/lib/missionExport.ts` | NEW — Export to KML, GeoJSON, or NATO STANAG format |

**Mission structure**:
```typescript
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
```

---

### B10. Network Graph Intelligence Visualization

**Neither project has entity relationship graphs.** A force-directed graph showing connections between entities — linking flights to airports, ships to ports, detections to cameras, anomalies to their sources.

**Implementation**:

| File | Change |
|------|--------|
| `src/components/panels/NetworkGraph.tsx` | NEW — Canvas-rendered force-directed graph (d3-force or custom) |
| `src/lib/graph/forceLayout.ts` | NEW — Force simulation: repulsion, attraction, centering |
| `src/lib/graph/entityLinker.ts` | NEW — Auto-generates edges: same airspace → linked, same region → linked, temporal proximity → linked |
| `src/stores/graphStore.ts` | NEW — Nodes, edges, layout state, selected cluster |

**Graph node types**: Aircraft (triangle), Ship (diamond), Camera (square), Earthquake (circle), Satellite (hexagon), AQI Station (pentagon)

**Edge types**: Spatial proximity, Temporal correlation, Causal link, Communication link

---

### B11. Voice Command Interface

**Neither project has voice commands.** Web Speech API integration for hands-free operation.

**Implementation**:

| File | Change |
|------|--------|
| `src/hooks/useVoiceCommand.ts` | NEW — `SpeechRecognition` API wrapper, continuous listening, wake word "PRAGYA" |
| `src/lib/voiceParser.ts` | NEW — Maps spoken phrases to command actions (fly to Delhi, enable flights, set mode drone) |
| `src/components/ui/VoiceIndicator.tsx` | NEW — Microphone icon with listening pulse animation |
| `TopHUD.tsx` | Add voice indicator next to uplink |

**Voice commands**:
- "PRAGYA, fly to Mumbai" → `{ action: 'fly_to', params: { city: 'Mumbai' } }`
- "Enable satellite layer" → `{ action: 'toggle_layer', params: { layer: 'satellites', enabled: true } }`
- "Switch to drone mode" → `{ action: 'set_mode', params: { mode: 'DRONE' } }`
- "Create geofence" → Opens geofence drawing tool
- "Show me the last earthquake" → Flies to most recent earthquake, opens detail panel

---

### B12. Space Debris Collision Prediction

**Neither project predicts collisions.** Using SGP4 orbital propagation, predict close approaches between tracked satellites and known debris objects.

**Implementation**:

| File | Change |
|------|--------|
| `src/lib/orbital/conjunctionAnalysis.ts` | NEW — SGP4 propagation + closest approach detection between TLE sets |
| `src/lib/orbital/debrisDatabase.ts` | NEW — Cached debris TLEs from Space-Track.org (18th Space Defense Squadron) |
| `src/components/panels/ConjunctionPanel.tsx` | NEW — Upcoming close approaches table: time, distance, probability, objects |
| `src/components/layers/ConjunctionLayer.tsx` | NEW — Visual lines between approaching objects on globe |
| `src/app/api/debris/route.ts` | NEW — Proxies Space-Track.org debris catalog |

---

### B13. Encrypted Tactical Messaging

**Neither project has secure comms.** A real-time messaging system between operators with end-to-end encryption simulation and classification banners.

**Implementation**:

| File | Change |
|------|--------|
| `src/components/panels/TacticalComms.tsx` | NEW — Message list with classification headers, formatted timestamps, sender callsigns |
| `src/lib/crypto/tacticalCrypto.ts` | NEW — AES-GCM encryption/decryption using Web Crypto API |
| `src/stores/commsStore.ts` | NEW — Message history, active channels, encryption status |
| `src/services/commsService.ts` | NEW — WebSocket channel for tactical messages |

**Message format**:
```typescript
interface TacticalMessage {
  id: string;
  channel: string;
  sender: { callsign: string; role: string };
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET//SCI';
  content: string;
  timestamp: string;
  encrypted: boolean;
  acknowledged: boolean;
}
```

---

### B14. Digital Twin City Mode

**Neither project has urban digital twins.** When zoomed into a city, load 3D building models (OSM Buildings / Google 3D Tiles) and overlay real-time sensor data onto individual buildings.

**Implementation**:

| File | Change |
|------|--------|
| `src/components/layers/DigitalTwinLayer.tsx` | NEW — OSM Buildings 3D tile layer on CesiumJS |
| `src/services/buildingService.ts` | NEW — Fetch building metadata: height, usage, occupancy |
| `src/components/panels/BuildingInspector.tsx` | NEW — Click-to-inspect: building details, AQI at location, nearest cameras, traffic density |

CesiumJS already supports Google Photorealistic 3D Tiles. This extends that with data overlays per building.

---

### B15. Predictive Threat Corridor

**Neither project predicts threats.** AI analyzes flight paths, ship routes, and entity trajectories to predict future positions and flag potential threat corridors.

**Implementation**:

| File | Change |
|------|--------|
| `src/lib/prediction/trajectoryPredictor.ts` | NEW — Linear + Kalman filter extrapolation of entity positions |
| `src/lib/prediction/threatCorridor.ts` | NEW — Generate corridor polygons around predicted paths |
| `src/components/layers/ThreatCorridorLayer.tsx` | NEW — Semi-transparent corridor cones projected ahead of tracked entities |
| `src/stores/predictionStore.ts` | NEW — Predicted positions, corridors, confidence intervals |

**Corridor visualization**: A translucent cone extending from the entity's current position along its predicted heading. Width increases with uncertainty (time from now). Color encodes threat level.

---

## PART C — IMPLEMENTATION PRIORITY MATRIX

| Priority | Feature | Impact | Complexity | Sprint |
|----------|---------|--------|------------|--------|
| P0 | WebSocket Real-Time Push | Architecture-level | High | 1 |
| P0 | Zod Validation Pipeline | Code quality | Medium | 1 |
| P1 | Temporal Playback Engine | Unique differentiator | High | 2 |
| P1 | Geofence Engine | Core intelligence tool | Medium | 2 |
| P1 | Anomaly Detection Engine | Automated intelligence | High | 2 |
| P1 | Panoptic Detection Pipeline | Vision intelligence | High | 2 |
| P2 | Cross-Domain Correlation | Intelligence fusion | High | 3 |
| P2 | Maritime Domain Awareness | Complete domain coverage | Medium | 3 |
| P2 | Multi-Camera Grid | Surveillance UX | Medium | 3 |
| P2 | Mission Planning Overlay | Operational planning | Medium | 3 |
| P3 | Satellite Imagery Layer | Earth observation | Medium | 4 |
| P3 | Network Graph Viz | Analysis tool | Medium | 4 |
| P3 | EM Spectrum Analyzer | SIGINT simulation | Medium | 4 |
| P3 | Voice Command Interface | Accessibility/UX | Low | 4 |
| P4 | CBRN Event Modeling | Niche simulation | Medium | 5 |
| P4 | Space Debris Collision | Space domain | Medium | 5 |
| P4 | Tactical Messaging | Collaboration | Medium | 5 |
| P4 | Digital Twin City | Urban intelligence | High | 5 |
| P4 | Predictive Threat Corridor | AI prediction | High | 5 |

---

## PART D — ESTIMATED FILE COUNT

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Part A (World Monitor absorb) | 12 | 8 |
| Part B (Exclusive features) | 48 | 15 |
| **Total** | **60** | **23** |

---

## PART E — TECH STACK ADDITIONS

| Technology | Purpose |
|------------|---------|
| `zod` | Runtime schema validation (replaces Pydantic pattern) |
| `ws` or `socket.io-client` | WebSocket client for real-time push |
| `d3-force` | Force-directed graph layout |
| `satellite.js` | SGP4 orbital propagation (already implied by TLE usage) |
| `@turf/turf` | Geospatial analysis: point-in-polygon, buffer, distance |
| Web Speech API | Voice command recognition (native, no package) |
| Web Crypto API | Tactical message encryption (native, no package) |

---

*This document is the architectural blueprint for making PragyaX the most advanced geospatial intelligence console ever built. Every feature above is absent from both PragyaX and World Monitor. Implementation follows the priority matrix above.*

*— PragyaX Architecture Division*
