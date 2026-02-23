<p align="center">
  <img src="https://img.shields.io/badge/CLASSIFICATION-TOP%20SECRET%20%2F%2F%20SI--TK-red?style=for-the-badge" alt="Classification" />
  <img src="https://img.shields.io/badge/SYSTEM-PRAGYAX-00FFD1?style=for-the-badge&labelColor=000" alt="PragyaX" />
  <img src="https://img.shields.io/badge/VERSION-4.2.1-00FF41?style=for-the-badge&labelColor=000" alt="Version" />
</p>

<h1 align="center">PRAGYAX</h1>
<h3 align="center">Geospatial Intelligence Console</h3>

<p align="center">
  <strong>Real-time global surveillance and strategic intelligence system built with CesiumJS, Next.js, and AI-powered analytics.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/CesiumJS-1.138-6CADDF?style=flat-square" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-5-443E38?style=flat-square" />
</p>

---

## What is PragyaX?

PragyaX is a full-stack geospatial intelligence console that renders a real-time 3D globe with live data feeds from multiple intelligence sources. It features two operational modes -- **WORLDVIEW** (global surveillance) and **CHANAKYA** (India-focused strategic intelligence) -- with 7 visual rendering modes, 10+ data layers, AI-powered analysis, and a fully procedural audio engine.

This is not a template. This is not a wrapper around a map library. PragyaX is a ground-up intelligence operations platform with every pixel, animation, and sound effect purpose-built for the intelligence analysis workflow.

---

## System Architecture

```
                          +-----------------------------+
                          |      PRAGYAX CONSOLE        |
                          |    Next.js 16 App Router     |
                          +-------------+---------------+
                                        |
                    +-------------------+-------------------+
                    |                   |                    |
              +-----+-----+      +-----+-----+      +------+----+
              |   GLOBE   |      |   STATE   |      |    AI     |
              |  ENGINE   |      |  SYSTEM   |      |  ENGINE   |
              |           |      |           |      |           |
              | CesiumJS  |      | Zustand   |      | Gemini    |
              | 3D Tiles  |      | 8 Stores  |      | Claude    |
              | satellite |      | React 19  |      | Commands  |
              +-----+-----+      +-----+-----+      +-----+-----+
                    |                   |                    |
              +-----+-------------------+--------------------+-----+
              |              DATA PIPELINE                          |
              |                                                     |
              |  OpenSky --- Flights (ADS-B transponders)           |
              |  Celestrak -- Satellites (TLE orbital data)         |
              |  USGS ------ Earthquakes (seismic events)           |
              |  CPCB ------ Air Quality (India stations)           |
              |  Google ---- 3D Tiles + Traffic tiles               |
              |  CCTV ------ Street-level camera feeds              |
              +-----------------------------------------------------+
```

---

## Features

### Operational Modes

| Mode | Description |
|------|-------------|
| **WORLDVIEW** | Global surveillance -- all data layers, worldwide coverage |
| **CHANAKYA** | India strategic intelligence -- border monitoring, ISRO tracking, AQI network, strategic node analysis, 8 intelligence operations (SIGINT/HUMINT/IMINT/COMINT/OSINT/CYBER/ELINT/MASINT) |

### Visual Rendering Modes

| Mode | Effect |
|------|--------|
| `NORMAL` | Clean high-contrast display |
| `CRT` | Retro CRT monitor with scanlines, flicker, and bloom |
| `NVG` | Night vision green intensifier with grain |
| `FLIR` | Forward-looking infrared thermal palette |
| `DRONE` | UAV camera with stabilization HUD |
| `GREEN` | Classic green phosphor terminal display |
| `CHANAKYA` | Saffron-themed intelligence console |

Each mode has unique: color palette, overlay effects, audio ambience, scanline patterns, and HUD styling.

### Live Data Layers

| Layer | Source | Update Interval |
|-------|--------|----------------|
| Flights | OpenSky Network (ADS-B) | 15 seconds |
| Satellites | Celestrak (TLE data) | 5 minutes |
| Earthquakes | USGS GeoJSON Feed | 60 seconds |
| Weather | Tile-based weather imagery | 5 minutes |
| Traffic | Google Traffic Tiles | 60 seconds |
| CCTV | Street-level camera feeds | On-demand |
| Air Quality | CPCB India stations | 10 minutes |
| ISRO Satellites | Celestrak India catalog | 5 minutes |
| India Borders | GeoJSON border polylines | Static |
| Strategic Nodes | Military/naval/space installations | Static |

### AI Integration

- **ARGUS Command Console** -- Natural language commands interpreted by Claude AI
  - "Fly to Mumbai" / "Show me flights over Delhi" / "Switch to night vision"
- **CCTV Vision Analysis** -- Gemini-powered real-time video feed analysis
  - Vehicle counting, traffic flow, crowd density, anomaly detection
- **Intel Brief Generator** -- AI-generated situation reports based on current viewport context
- **Satellite Profile Generator** -- AI descriptions of tracked orbital objects

### Audio Engine

Fully procedural audio engine using the Web Audio API -- no audio files, every sound is synthesized in real-time:

- 20+ unique sound effects (boot beeps, mode switches, alerts, clicks)
- Biometric scan audio for boot authentication sequence
- Per-interaction sounds (hover, click, toggle, navigate)
- Different tonal profiles per visual mode

### Boot Sequence

Cinematic 8-second boot sequence:
1. **Biometric Authentication** (2s) -- Canvas-animated fingerprint scan with verification
2. **Radar Scope** -- Animated radar with sweep line, blips, and progress arc
3. **Terminal Boot** -- Line-by-line system initialization with sound effects
4. **Status Bars** -- CPU, Memory, GPU, and Uplink progress indicators

### Chanakya Mode Intelligence Operations

| Operation | Description |
|-----------|-------------|
| SIGINT | Signal Intelligence -- frequency monitoring, intercept log, signal strength bars |
| HUMINT | Human Intelligence -- agent network roster with status and reliability ratings |
| IMINT | Imagery Intelligence -- satellite imagery analysis dashboard |
| COMINT | Communications Intelligence -- intercepted communications feed |
| OSINT | Open Source Intelligence -- public data aggregation |
| CYBER | Cyber Operations -- threat monitoring, firewall status, traffic analysis |
| ELINT | Electronic Intelligence -- emitter database, radar/SAM classification |
| MASINT | Measurement and Signature Intelligence -- sensor array with anomaly detection |

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.6 | App Router, API routes, SSR |
| React | 19.2.3 | UI framework with concurrent features |
| TypeScript | 5.x | Type safety across entire codebase |
| CesiumJS | 1.138.0 | 3D globe rendering engine |
| Google 3D Tiles | Latest | Photorealistic terrain and buildings |
| Tailwind CSS | 4.x | Utility-first styling |
| Zustand | 5.0.11 | Lightweight state management (8 stores) |
| satellite.js | 6.0.2 | SGP4/SDP4 satellite orbit propagation |
| Lucide React | 0.575.0 | Icon system |
| Web Audio API | Native | Procedural sound synthesis |

---

## Project Structure

```
worldview/
  src/
    app/
      api/                    # 12 API routes
        earthquakes/          # USGS earthquake proxy
        flights/              # OpenSky flight data proxy
        satellites/           # Celestrak TLE proxy
        india/aqi/            # CPCB air quality proxy
        intel/                # AI-powered intel endpoints
          brief/              # Situation report generator
          command/            # NL command interpreter
          breadcrumbs/        # Location breadcrumb generator
          satellite-profile/  # Satellite description
        vision/analyze/       # Gemini CCTV analysis
        weather/tile/         # Weather tile proxy
        status/ticker/        # Status ticker messages
        health/               # System health check
      layout.tsx              # Root layout with fonts
      page.tsx                # Entry point
      globals.css             # 440+ lines of animations

    components/
      chanakya/               # Chanakya mode components
      layers/                 # 11 Cesium entity layer renderers
      layout/                 # Shell, boot, HUD, panels, nav
      map/                    # Globe viewer, overlays, filters
      panels/                 # Information panels (CCTV, command, intel)
      ui/                     # Shared UI (toast, shortcuts, metrics)
      data/                   # Data polling manager

    stores/                   # 8 Zustand state stores
    hooks/                    # 12 custom React hooks
    services/                 # 6 API service clients
    constants/                # 10 configuration modules
    utils/                    # Audio engine, Cesium helpers
    lib/                      # Cache, rate limiter, prompts
    types/                    # TypeScript type definitions
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Google Maps API key (for 3D Tiles and Traffic)
- Google Gemini API key (for CCTV analysis)
- Anthropic Claude API key (for intel briefs and commands)

### Environment Variables

Create `.env.local` in the `worldview/` directory:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_cesium_ion_token
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_claude_api_key
```

### Installation

```bash
cd worldview
npm install
npm run dev
```

The application starts at `http://localhost:3000`.

### Build

```bash
npm run build
npm start
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-6` | Switch visual mode (NORMAL, CRT, NVG, FLIR, DRONE, GREEN) |
| `C` | Toggle Chanakya mode |
| `F` | Toggle flights layer |
| `S` | Toggle satellites layer |
| `E` | Toggle earthquakes layer |
| `Space` | Toggle auto-rotate globe |
| `Escape` | Close modals and overlays |
| `?` | Show keyboard shortcut help |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/flights` | GET | Fetch live ADS-B flight data |
| `/api/satellites` | GET | Fetch satellite TLE orbital data |
| `/api/earthquakes` | GET | Fetch recent seismic events |
| `/api/india/aqi` | GET | Fetch India air quality stations |
| `/api/weather/tile/[layer]/[z]/[x]/[y]` | GET | Proxy weather map tiles |
| `/api/intel/brief` | POST | Generate AI intelligence brief |
| `/api/intel/command` | POST | Interpret natural language command |
| `/api/intel/breadcrumbs` | POST | Generate location breadcrumbs |
| `/api/intel/satellite-profile` | POST | Generate satellite description |
| `/api/vision/analyze` | POST | AI-analyze CCTV camera feed |
| `/api/status/ticker` | GET | Get status ticker messages |
| `/api/health` | GET | System health check |

---

## State Management

PragyaX uses 8 Zustand stores for granular state management:

| Store | Purpose |
|-------|---------|
| `modeStore` | Visual mode, optics settings, Chanakya state |
| `dataStore` | Flight, satellite, earthquake, AQI data cache |
| `layerStore` | Layer visibility toggles |
| `mapStore` | Camera position (lat/lon/altitude/city) |
| `cesiumStore` | Cesium viewer instance and entity registry |
| `aiStore` | Command modal state, selected entity |
| `hudStore` | Performance metrics, intel feed, signal data |
| `trailStore` | Flight trail position history |

---

## Performance

- **Build:** Compiles with 0 errors
- **Bundle:** Optimized with Next.js Turbopack
- **Globe:** 60 FPS target with adaptive quality
- **Data:** All API responses cached with configurable TTL
- **Rate Limiting:** Built-in rate limiter prevents API abuse
- **Memory:** Entity cleanup on layer toggle and mode switch

---

## Author

**Ayush Pandey**

PragyaX is a proprietary project. See [LICENSE.md](./LICENSE.md) for usage terms.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

See [ui-ux-changes.md](./ui-ux-changes.md) for the UI/UX enhancement roadmap.

---

<p align="center">
  <sub>Built with precision. Designed for intelligence.</sub>
</p>
