import type { Vessel } from '@/stores/exclusiveStores';

// Major port cities with simulated vessel data
const MAJOR_PORTS: { name: string; lat: number; lon: number }[] = [
  { name: 'Singapore', lat: 1.2644, lon: 103.8222 },
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { name: 'Rotterdam', lat: 51.9225, lon: 4.4792 },
  { name: 'Dubai', lat: 25.2760, lon: 55.2962 },
  { name: 'Mumbai', lat: 18.9523, lon: 72.8337 },
  { name: 'Los Angeles', lat: 33.7175, lon: -118.2607 },
  { name: 'New York', lat: 40.6892, lon: -74.0445 },
  { name: 'Tokyo', lat: 35.4498, lon: 139.6649 },
  { name: 'London', lat: 51.5074, lon: 0.0714 },
  { name: 'Houston', lat: 29.7267, lon: -95.0158 },
];

const SHIP_TYPES: Vessel['shipType'][] = ['CARGO', 'TANKER', 'PASSENGER', 'MILITARY', 'FISHING', 'PLEASURE', 'TUG', 'OTHER'];
const FLAGS = ['PA', 'LR', 'MH', 'HK', 'SG', 'BS', 'MT', 'CY', 'GB', 'US', 'IN', 'JP', 'CN', 'GR', 'NO'];
const VESSEL_NAMES_PREFIX = ['PACIFIC', 'ATLANTIC', 'GOLDEN', 'STAR', 'BLUE', 'CORAL', 'EVER', 'MAERSK', 'ORIENT', 'SEA'];
const VESSEL_NAMES_SUFFIX = ['FORTUNE', 'SPIRIT', 'CROWN', 'WAVE', 'LIGHT', 'GLORY', 'DAWN', 'PEARL', 'HORIZON', 'BRIDGE'];

function generateMMSI(): string {
  return String(200000000 + Math.floor(Math.random() * 600000000));
}

function generateVesselName(): string {
  const pre = VESSEL_NAMES_PREFIX[Math.floor(Math.random() * VESSEL_NAMES_PREFIX.length)];
  const suf = VESSEL_NAMES_SUFFIX[Math.floor(Math.random() * VESSEL_NAMES_SUFFIX.length)];
  return `${pre} ${suf}`;
}

let cachedVessels: Vessel[] | null = null;

/**
 * Generate simulated vessel positions clustered around major ports.
 * In production, this would call MarineTraffic / AISHub API.
 */
export function fetchVessels(
  bbox?: { lamin: number; lamax: number; lomin: number; lomax: number }
): { vessels: Vessel[]; count: number; source: string; cached: boolean } {
  if (!cachedVessels) {
    cachedVessels = [];
    for (const port of MAJOR_PORTS) {
      const count = 8 + Math.floor(Math.random() * 15);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 2; // degrees from port
        const shipType = SHIP_TYPES[Math.floor(Math.random() * SHIP_TYPES.length)];
        const destPort = MAJOR_PORTS[Math.floor(Math.random() * MAJOR_PORTS.length)];

        cachedVessels.push({
          mmsi: generateMMSI(),
          name: generateVesselName(),
          flag: FLAGS[Math.floor(Math.random() * FLAGS.length)],
          shipType,
          lat: port.lat + dist * Math.cos(angle),
          lon: port.lon + dist * Math.sin(angle),
          speed: shipType === 'CARGO' ? 10 + Math.random() * 14 :
                 shipType === 'TANKER' ? 8 + Math.random() * 10 :
                 shipType === 'PASSENGER' ? 15 + Math.random() * 10 :
                 shipType === 'MILITARY' ? 20 + Math.random() * 15 :
                 5 + Math.random() * 12,
          course: Math.random() * 360,
          heading: Math.random() * 360,
          destination: destPort.name,
          length: shipType === 'CARGO' ? 150 + Math.random() * 250 :
                  shipType === 'TANKER' ? 200 + Math.random() * 150 :
                  shipType === 'PASSENGER' ? 250 + Math.random() * 100 :
                  shipType === 'MILITARY' ? 100 + Math.random() * 100 :
                  20 + Math.random() * 80,
          status: 'Under way using engine',
        });
      }
    }
  } else {
    // Drift vessels
    cachedVessels = cachedVessels.map((v) => ({
      ...v,
      lat: v.lat + Math.cos(v.course * Math.PI / 180) * 0.001 * (v.speed / 20) + (Math.random() - 0.5) * 0.0005,
      lon: v.lon + Math.sin(v.course * Math.PI / 180) * 0.001 * (v.speed / 20) + (Math.random() - 0.5) * 0.0005,
      course: (v.course + (Math.random() - 0.5) * 2 + 360) % 360,
    }));
  }

  let filtered = cachedVessels;
  if (bbox) {
    filtered = cachedVessels.filter((v) =>
      v.lat >= bbox.lamin && v.lat <= bbox.lamax &&
      v.lon >= bbox.lomin && v.lon <= bbox.lomax
    );
  }

  return {
    vessels: filtered,
    count: filtered.length,
    source: 'simulated-ais',
    cached: false,
  };
}

/**
 * Reset vessel cache (useful for testing).
 */
export function resetVesselCache() {
  cachedVessels = null;
}
