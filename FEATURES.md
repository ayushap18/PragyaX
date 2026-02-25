# PragyaX — Feature Guide

> Geospatial Intelligence System — All Features & Locations

---

## Table of Contents

1. [Boot Sequence](#1-boot-sequence)
2. [TopHUD Metrics Bar](#2-tophud-metrics-bar)
3. [Left Panel — Operations](#3-left-panel--operations)
4. [EM Spectrum Analyzer](#4-em-spectrum-analyzer)
5. [Anomaly Detection System](#5-anomaly-detection-system)
6. [Geofence Engine](#6-geofence-engine)
7. [Mission Planner](#7-mission-planner)
8. [Multi-Camera Surveillance Grid](#8-multi-camera-surveillance-grid)
9. [Realtime GPS Location](#9-realtime-gps-location)
10. [Timeline Scrubber](#10-timeline-scrubber)
11. [Maritime Vessel Tracking](#11-maritime-vessel-tracking)
12. [Cross-Domain Correlation Engine](#12-cross-domain-correlation-engine)
13. [Intel Summary](#13-intel-summary)
14. [Data Layers Panel](#14-data-layers-panel)
15. [AI Command Modal](#15-ai-command-modal)
16. [Keyboard Shortcuts](#16-keyboard-shortcuts)
17. [Chanakya Mode (India Intelligence)](#17-chanakya-mode)
18. [Visual Modes](#18-visual-modes)

---

## 1. Boot Sequence

**Location in UI:** Full-screen overlay on app load, before any panels appear.

**What it does:** Simulates a classified system boot with biometric authentication, radar scope animation, and terminal-style log output. The globe loads behind it while the sequence plays.

**How to see it:** Refresh the page. The boot sequence plays automatically on every load.

```
File: src/components/layout/BootSequence.tsx
```

---

## 2. TopHUD Metrics Bar

**Location in UI:** Fixed bar at the very top of the screen (38px tall). Always visible.

**What it does:** Displays real-time system metrics in a classified-style heads-up display:
- UTC clock (top-left)
- Classification banner (center — "TOP SECRET // SI // NOFORN")
- FPS, CPU %, MEM % gauges (top-right)
- Current visual mode indicator

**How to see it:** Always visible at the top after boot completes.

```
File: src/components/layout/TopHUD.tsx
```

---

## 3. Left Panel — Operations

**Location in UI:** Left sidebar, 220px wide, between TopHUD and BottomNav.

**What it does:** The left panel contains multiple sections stacked vertically:
- **PRAGYAX logo** with pulsing accent dot
- **Intel Brief** — classification + search
- **Data Layers** — toggle switches for flights, satellites, earthquakes, etc.
- **Intel Feed** — real-time scrolling event log (SIGINT intercepts, SAT passes, etc.)
- **Operations buttons** — quick-access buttons for all exclusive features:
  - `SPECTRUM` — opens EM Spectrum Analyzer
  - `ANOMALY (n)` — opens Anomaly Panel (shows unacknowledged count)
  - `GEOFENCE (n)` — opens Geofence Panel (shows armed count)
  - `MISSION` — opens Mission Planner
  - `GRID` — opens Surveillance Grid
  - `GPS` — toggles Realtime GPS Location tracking
- **System Status** — subsystem health dots, uplink, signal, latency, encryption
- **Intel Summary** — active feeds count, anomaly count, vessel count, geofence count
- **Coordinate readout** — current map center with MGRS grid reference

**How to see it:** Always visible on the left side after boot. Scroll down to see all sections.

```
File: src/components/layout/LeftPanel.tsx
```

---

## 4. EM Spectrum Analyzer

**Location in UI:** Opens as a floating panel (right side) when you click the `SPECTRUM` button in Operations.

**What it does:** Real-time canvas-based RF spectrum visualization:
- Renders a frequency spectrum from 0.1 MHz to 40 GHz
- Shows 39 known signal bands (GPS L1, ADS-B 1090 MHz, Thuraya, X-band radar, etc.)
- Animated waveform with noise floor and signal peaks
- Hover to see frequency/power readout
- Panning controls to scroll through frequency ranges

**How to access:**
1. Click `SPECTRUM` button in the Operations section of the left panel
2. The panel opens on the right side with the spectrum display

```
Files:
  src/components/panels/SpectrumAnalyzer.tsx
  src/lib/spectrumSimulator.ts
```

---

## 5. Anomaly Detection System

**Location in UI:** Opens as a floating panel when you click the `ANOMALY` button in Operations.

**What it does:** Autonomous anomaly detection engine that runs in the background:
- Monitors flight data for ADS-B anomalies (squawk codes, altitude deviations, callsign mismatches)
- Detects seismic swarm clusters using spatial grouping
- Cross-domain correlation (links anomalies across flight/seismic/maritime domains)
- Each anomaly has a severity (LOW/MEDIUM/HIGH/CRITICAL) and a confidence score
- Click anomalies to acknowledge them
- Button shows unacknowledged count: `ANOMALY (3)`

**How to access:**
1. Click `ANOMALY` button in Operations
2. Anomalies auto-generate in the background as data is polled
3. The panel lists all anomalies with severity, description, and timestamp

```
Files:
  src/components/panels/AnomalyPanel.tsx
  src/hooks/useAnomalyEngine.ts
  src/lib/correlation/engine.ts
```

---

## 6. Geofence Engine

**Location in UI:** Opens as a floating panel when you click the `GEOFENCE` button in Operations.

**What it does:** Draw and manage geographic perimeters on the globe:
- Create polygon geofences by clicking points on the map
- Arm/disarm individual geofences
- 1Hz evaluation loop checks all tracked entities against armed geofence boundaries
- Uses ray-casting point-in-polygon algorithm
- Breach alerts appear in the Intel Feed and as AlertToasts
- Button shows armed count: `GEOFENCE (2)`

**How to access:**
1. Click `GEOFENCE` button in Operations
2. Use the panel controls to create new geofences or manage existing ones

```
Files:
  src/components/panels/GeofencePanel.tsx
  src/hooks/useGeofenceEngine.ts
  src/lib/geo.ts (point-in-polygon, haversine)
```

---

## 7. Mission Planner

**Location in UI:** Opens as a floating panel when you click the `MISSION` button in Operations.

**What it does:** Plan and manage multi-waypoint missions:
- Add waypoints with coordinates, altitude, and speed
- Visual route display on the globe
- Mission timing calculations
- Export mission plans

**How to access:**
1. Click `MISSION` button in Operations

```
File: src/components/panels/MissionPlanner.tsx
```

---

## 8. Multi-Camera Surveillance Grid

**Location in UI:** Opens as a floating panel when you click the `GRID` button in Operations.

**What it does:** Displays a multi-camera CCTV surveillance grid:
- Grid layout showing multiple camera feeds simultaneously
- Camera feeds from predefined surveillance positions
- Camera status indicators (online/offline)
- Click individual cameras to expand view

**How to access:**
1. Click `GRID` button in Operations
2. Only one exclusive panel can be open at a time (opening GRID closes SPECTRUM, etc.)

```
Files:
  src/components/panels/SurveillanceGrid.tsx
  src/components/panels/CCTVPanel.tsx
  src/constants/cameras.ts
```

---

## 9. Realtime GPS Location

**Location in UI:** `GPS` button in the Operations section of the left panel. Also accessible via keyboard shortcut `G`.

**What it does:** Uses your browser's Geolocation API to:
- Acquire your real-world GPS position
- Fly the CesiumJS globe camera to your location
- Place a cyan pulsing marker at your position labeled "GPS POSITION"
- Show an accuracy circle around your position
- Continuously track your position in realtime as you move
- Display GPS status in the subsystem health indicators
- Push GPS events to the Intel Feed
- Button highlights when active and shows accuracy: `GPS ±15m`

**How to access:**
1. Click `GPS` button in the Operations section of the left panel
2. Or press `G` on your keyboard
3. Browser will ask for location permission — grant it
4. Globe flies to your position with a marker
5. Click GPS again (or press G) to deactivate

```
Files:
  src/hooks/useRealtimeLocation.ts
  src/components/layout/LeftPanel.tsx (GPS button at line ~115)
  src/components/layout/PragyaXShell.tsx (integration)
  src/hooks/useKeyboardShortcuts.ts (G key shortcut)
```

---

## 10. Timeline Scrubber

**Location in UI:** Fixed bar directly above the bottom navigation bar, spanning the full width.

**What it does:** Temporal navigation for playback:
- Draggable timeline showing the last 24 hours
- Scrub to any point in time to see historical data positions
- Current playback time displayed in UTC
- Progress bar with thumb indicator

**How to see it:** Always visible above the bottom navigation bar.

```
File: src/components/ui/TimelineScrubber.tsx
```

---

## 11. Maritime Vessel Tracking

**Location in UI:** Vessel data appears as entities on the globe. Vessel count is shown in the Intel Summary section of the left panel.

**What it does:** Simulated AIS (Automatic Identification System) vessel tracking:
- Polls vessel positions every 30 seconds
- Tracks vessels across 10 major global ports
- Vessel entities rendered on the CesiumJS globe
- Vessel count displayed in Intel Summary: `VESSELS: 47`
- Trail history stored for each vessel

**How to see it:**
1. Look at the Intel Summary in the left panel for vessel count
2. Vessels appear as entities on the globe near major ports

```
Files:
  src/hooks/useVesselPolling.ts
  src/services/vesselService.ts
  src/stores/exclusiveStores.ts (vessel store)
  src/stores/trailStore.ts
```

---

## 12. Cross-Domain Correlation Engine

**Location in UI:** Correlation results appear as CORRELATION-type anomalies in the Anomaly Panel.

**What it does:** Analyzes anomalies across different intelligence domains:
- Clusters anomalies by spatial proximity (haversine distance)
- Links flight anomalies with seismic events and maritime deviations
- Generates correlation reports with confidence scores
- Runs automatically every 30 seconds
- Results appear as CRITICAL/HIGH severity anomalies in the Anomaly Panel
- Narrative descriptions explain multi-domain patterns

**How to see it:**
1. Wait for anomalies to accumulate across different domains
2. Open the Anomaly Panel — look for entries of type "CORRELATION"
3. These entries describe multi-domain patterns (e.g., "3 entities, confidence 87%")

```
Files:
  src/lib/correlation/engine.ts
  src/hooks/useAnomalyEngine.ts (correlation integration at ~line 205)
```

---

## 13. Intel Summary

**Location in UI:** Bottom section of the left panel, below System Status.

**What it does:** At-a-glance intelligence metrics:
- **ACTIVE FEEDS** — total tracked entities count (with Activity icon)
- **ANOMALIES** — unacknowledged anomaly count, blinks if > 0 (with AlertTriangle icon)
- **VESSELS** — tracked maritime vessel count (with Anchor icon)
- **GEOFENCES** — armed geofence count (with ShieldCheck icon)
- **LAST UPDATE** — seconds since last data refresh

**How to see it:** Scroll to the bottom of the left panel. It's always there below System Status.

```
File: src/components/layout/LeftPanel.tsx (lines ~145-156)
```

---

## 14. Data Layers Panel

**Location in UI:** In the left panel, between Intel Brief and Intel Feed.

**What it does:** Toggle switches to enable/disable data visualization layers on the globe:
- Flights (ADS-B aircraft tracking)
- Satellites (TLE orbital tracking)
- Earthquakes (USGS seismic data)
- Weather (tile overlay)
- CCTV (surveillance camera positions)
- Traffic
- Graticule (lat/lon grid lines)
- India-specific: Borders, Strategic nodes, ISRO satellites, AQI

**How to see it:** Look at the left panel — the layer toggles are between the Intel Brief and Intel Feed sections.

```
Files:
  src/components/panels/DataLayers.tsx
  src/stores/layerStore.ts
  src/components/layers/ (11 layer components)
```

---

## 15. AI Command Modal

**Location in UI:** Opens as a centered overlay modal.

**What it does:** Natural language command interface powered by Claude/Gemini:
- Type commands in natural language
- AI interprets and executes geospatial operations
- Generates intel briefs on demand
- Can control the map, query data, and provide analysis

**How to access:**
1. Click the `AI` button in the bottom navigation bar
2. Or press `Cmd+K` (keyboard shortcut)
3. Type your command and press Enter

```
File: src/components/panels/CommandModal.tsx
```

---

## 16. Keyboard Shortcuts

**Location in UI:** Press `?` or `/` to see the overlay.

| Key | Action |
|-----|--------|
| `1-6` | Switch visual mode (NORMAL/CRT/NVG/FLIR/GREEN/DRONE) |
| `C` | Toggle Chanakya mode |
| `F` | Toggle flights layer |
| `S` | Toggle satellites layer |
| `E` | Toggle earthquakes layer |
| `G` | Toggle GPS realtime location |
| `SPACE` | Toggle globe auto-rotation |
| `Cmd+K` | Open AI command modal |
| `ESC` | Close modal / overlay |
| `?` | Show keyboard shortcuts overlay |

```
Files:
  src/hooks/useKeyboardShortcuts.ts
  src/components/ui/ShortcutOverlay.tsx
```

---

## 17. Chanakya Mode

**Location in UI:** Press `C` or click `Chanakya` in the bottom mode selector.

**What it does:** India-focused intelligence mode that replaces the standard panels:
- India border layer with LOC/LAC
- Strategic node visualization
- ISRO satellite tracking
- AQI (Air Quality Index) overlay
- India-specific left panel, right panel, and bottom nav
- ISRO mission clock
- Orange accent theme (saffron)

**How to access:**
1. Press `C` on keyboard, or
2. Click `Chanakya` in the bottom mode selector bar

```
Files:
  src/components/chanakya/ChanakyaLeftPanel.tsx
  src/components/chanakya/ChanakyaRightPanel.tsx
  src/components/chanakya/ChanakyaBottomNav.tsx
  src/components/chanakya/ISROMissionClock.tsx
  src/hooks/useChanakyaMode.ts
```

---

## 18. Visual Modes

**Location in UI:** Bottom navigation bar — mode selector row.

| Mode | Key | Filter Effect | Accent Color |
|------|-----|---------------|--------------|
| Normal | `1` | None | Cyan `#00FFD1` |
| CRT | `2` | Sepia + warm glow | Orange `#FFA500` |
| NVG | `3` | Green night vision | Green `#00FF41` |
| FLIR | `4` | Thermal infrared | Gray `#CCCCCC` |
| GREEN | `5` | Matrix green | Lime `#39FF14` |
| DRONE | `6` | None (drone HUD) | Cyan `#00FFD1` |
| Chanakya | `C` | Warm sepia | Saffron `#FF9933` |

**How to access:** Click mode buttons in the bottom bar, or press number keys 1-6.

```
Files:
  src/constants/modes.ts
  src/stores/modeStore.ts
  src/components/ui/ModeButton.tsx
  src/components/map/VisualModeFilter.tsx
```

---

## UI Layout Reference

```
┌─────────────────────────────────────────────────────────┐
│                    TopHUD (38px)                         │  ← Always visible
├──────────┬──────────────────────────────────┬───────────┤
│          │                                  │           │
│  Left    │         CesiumJS Globe           │   Right   │
│  Panel   │    (full viewport, z-0)          │   Panel   │
│  (220px) │                                  │           │
│          │   ┌─────────────────────┐        │           │
│  Logo    │   │  Exclusive Panels   │        │           │
│  Intel   │   │  (Spectrum, Anomaly │        │           │
│  Layers  │   │   Geofence, Mission │        │           │
│  Feed    │   │   Grid)             │        │           │
│  Ops     │   └─────────────────────┘        │           │
│  Status  │                                  │           │
│  Summary │                                  │           │
│  Coords  │                                  │           │
│          │  ┌───────────────────────────┐   │           │
│          │  │    MiniGlobe (corner)     │   │           │
├──────────┴──┴───────────────────────────┴───┴───────────┤
│               Timeline Scrubber                          │
├─────────────────────────────────────────────────────────┤
│  Landmarks  │  Cities  │  Mode Selector (bottom, 56px)  │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # 12 API routes
│   ├── page.tsx           # Root page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── layout/            # Shell, TopHUD, LeftPanel, RightPanel, BottomNav, BootSequence
│   ├── panels/            # SpectrumAnalyzer, AnomalyPanel, GeofencePanel, MissionPlanner,
│   │                        SurveillanceGrid, CCTVPanel, IntelBrief, DataLayers, CommandModal
│   ├── ui/                # TimelineScrubber, AlertToast, ModeButton, ShortcutOverlay
│   ├── layers/            # 11 data visualization layers
│   ├── map/               # CesiumViewer, MiniGlobe, ScopeOverlay, VisualModeFilter
│   ├── chanakya/          # India-focused mode panels
│   └── data/              # DataPollingManager
├── stores/                # Zustand state stores (mode, data, layer, map, cesium, ai, hud, exclusive, trail)
├── hooks/                 # Custom React hooks (17 hooks)
├── services/              # API service clients
├── lib/                   # Utilities (cache, rateLimit, geo, spectrum, correlation)
├── constants/             # Static data (modes, layers, cities, cameras, intel data)
├── utils/                 # Audio engine, Cesium helpers, command executor
└── types/                 # TypeScript type definitions
```
