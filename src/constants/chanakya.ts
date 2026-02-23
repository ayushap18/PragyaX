import type { City, StrategicNode, BorderZone } from '@/types';

export const INDIAN_CITIES: City[] = [
  {
    name: 'New Delhi',
    lat: 28.6139,
    lon: 77.2090,
    landmarks: [
      { name: 'Rashtrapati Bhavan', lat: 28.6143, lon: 77.1994 },
      { name: 'India Gate', lat: 28.6129, lon: 77.2295 },
      { name: 'Red Fort', lat: 28.6562, lon: 77.2410 },
      { name: 'Parliament House', lat: 28.6175, lon: 77.2086 },
      { name: 'South Block (MoD)', lat: 28.6148, lon: 77.2069 },
    ],
  },
  {
    name: 'Mumbai',
    lat: 19.0760,
    lon: 72.8777,
    landmarks: [
      { name: 'Gateway of India', lat: 19.0402, lon: 72.8347 },
      { name: 'Naval Dockyard', lat: 18.9322, lon: 72.8424 },
      { name: 'BARC Trombay', lat: 19.0194, lon: 72.9194 },
      { name: 'BKC Command', lat: 19.0644, lon: 72.8650 },
      { name: 'Mazagon Dock', lat: 18.9594, lon: 72.8422 },
    ],
  },
  {
    name: 'Bengaluru',
    lat: 12.9716,
    lon: 77.5946,
    landmarks: [
      { name: 'ISRO HQ', lat: 12.9617, lon: 77.5680 },
      { name: 'HAL Aerospace', lat: 12.9499, lon: 77.6681 },
      { name: 'DRDO Campus', lat: 13.0224, lon: 77.5738 },
      { name: 'Electronic City', lat: 12.8399, lon: 77.6770 },
      { name: 'Vidhana Soudha', lat: 12.9791, lon: 77.5913 },
    ],
  },
  {
    name: 'Chennai',
    lat: 13.0827,
    lon: 80.2707,
    landmarks: [
      { name: 'Fort St George', lat: 13.0801, lon: 80.2875 },
      { name: 'IIT Madras', lat: 12.9916, lon: 80.2336 },
      { name: 'Marina Beach', lat: 13.0500, lon: 80.2824 },
      { name: 'INS Adyar (Navy)', lat: 13.0120, lon: 80.2560 },
      { name: 'Kapaleeshwarar Temple', lat: 13.0339, lon: 80.2695 },
    ],
  },
  {
    name: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    landmarks: [
      { name: 'Fort William', lat: 22.5554, lon: 88.3425 },
      { name: 'Victoria Memorial', lat: 22.5448, lon: 88.3426 },
      { name: 'Howrah Bridge', lat: 22.5851, lon: 88.3468 },
      { name: 'Writers Building', lat: 22.5726, lon: 88.3530 },
      { name: 'Eastern Command HQ', lat: 22.5560, lon: 88.3400 },
    ],
  },
  {
    name: 'Hyderabad',
    lat: 17.3850,
    lon: 78.4867,
    landmarks: [
      { name: 'Charminar', lat: 17.3616, lon: 78.4747 },
      { name: 'DRDO DRDL', lat: 17.4535, lon: 78.5310 },
      { name: 'Golconda Fort', lat: 17.3833, lon: 78.4011 },
      { name: 'ECIL', lat: 17.4771, lon: 78.5340 },
      { name: 'Hussain Sagar', lat: 17.4239, lon: 78.4738 },
    ],
  },
  {
    name: 'Ahmedabad',
    lat: 23.0225,
    lon: 72.5714,
    landmarks: [
      { name: 'Sabarmati Ashram', lat: 23.0607, lon: 72.5804 },
      { name: 'ISRO SAC', lat: 23.0271, lon: 72.5472 },
      { name: 'IIM Ahmedabad', lat: 23.0292, lon: 72.5303 },
      { name: 'Sardar Patel Stadium', lat: 23.0931, lon: 72.5963 },
      { name: 'Sidi Saiyyed Mosque', lat: 23.0247, lon: 72.5808 },
    ],
  },
  {
    name: 'ISRO',
    lat: 13.7199,
    lon: 80.2304,
    landmarks: [
      { name: 'Launch Pad 1', lat: 13.7313, lon: 80.2344 },
      { name: 'Launch Pad 2', lat: 13.7349, lon: 80.2368 },
      { name: 'Mission Control', lat: 13.7181, lon: 80.2295 },
      { name: 'Vehicle Assembly', lat: 13.7271, lon: 80.2311 },
      { name: 'Tracking Radar', lat: 13.7220, lon: 80.2278 },
    ],
  },
  {
    name: 'Srinagar',
    lat: 34.0837,
    lon: 74.7973,
    landmarks: [
      { name: 'Dal Lake', lat: 34.0860, lon: 74.8600 },
      { name: 'Srinagar Air Base', lat: 33.9871, lon: 74.7744 },
      { name: 'Shankaracharya Hill', lat: 34.0710, lon: 74.8403 },
      { name: 'Lal Chowk', lat: 34.0756, lon: 74.7893 },
      { name: 'Hazratbal Shrine', lat: 34.1287, lon: 74.8391 },
    ],
  },
  {
    name: 'Leh',
    lat: 34.1526,
    lon: 77.5771,
    landmarks: [
      { name: 'Leh Palace', lat: 34.1639, lon: 77.5853 },
      { name: 'Khardung La Pass', lat: 34.2817, lon: 77.6025 },
      { name: 'Thiksey Monastery', lat: 33.9133, lon: 77.6647 },
      { name: 'Pangong Tso (LAC)', lat: 33.7595, lon: 78.6578 },
      { name: 'DBO Airstrip', lat: 35.3896, lon: 77.9500 },
    ],
  },
];

// Strategic border zones for the Chanakya overlay
export const BORDER_ZONES: BorderZone[] = [
  { name: 'LOC SECTOR', label: 'Line of Control', status: 'MONITORED', threat: 'ELEVATED', lat: 34.0, lon: 74.5, color: '#FF4444' },
  { name: 'LAC SECTOR', label: 'Line of Actual Control', status: 'ACTIVE WATCH', threat: 'HIGH', lat: 34.5, lon: 78.0, color: '#FF6600' },
  { name: 'EASTERN CMD', label: 'Sikkim-Arunachal Frontier', status: 'PATROL ACTIVE', threat: 'MODERATE', lat: 27.5, lon: 92.0, color: '#FFAA00' },
  { name: 'MARITIME WEST', label: 'Arabian Sea Corridor', status: 'FLEET DEPLOYED', threat: 'LOW', lat: 15.0, lon: 68.0, color: '#44AAFF' },
  { name: 'MARITIME EAST', label: 'Bay of Bengal & Andaman', status: 'SURVEILLANCE', threat: 'LOW', lat: 12.0, lon: 85.0, color: '#44AAFF' },
  { name: 'SIR CREEK', label: 'Western Maritime Border', status: 'DISPUTED', threat: 'MODERATE', lat: 23.7, lon: 68.5, color: '#FFAA00' },
];

// Arthashastra quotes for the intel ticker
export const ARTHASHASTRA_QUOTES = [
  'सामा दान भेद दण्ड — The four pillars: Diplomacy, Economy, Intelligence, Force',
  'षाड्गुण्य — The six measures of foreign policy shall guide the sovereign',
  'Before you start a war, you must know what you wish to win through it — Kautilya',
  'The serpent, the king, the tiger — they must never be underestimated — Arthashastra',
  'He who maintains intelligence networks across all frontiers shall never be surprised',
  'A wise king has his agents in every court and marketplace — Kautilya III.1',
  'The treasury is the root of the state; from it flows all power — Arthashastra II.6',
  'गुप्तचर — Covert operations are the eye of the sovereign',
  'राजमण्डल — The circle of states determines allies and adversaries',
  'Control the borders and you control the destiny of the nation — Kautilya VII',
  'The king\'s highway is the artery of commerce — Arthashastra 2.1',
  'Know the enemy\'s moves through rivers, winds, and seasons — Arthashastra 9.1',
  'A wise king makes his frontier his first line of intelligence — Arthashastra 6.2',
  'The kingdom\'s health is the king\'s first duty — Arthashastra 1.19',
  'The earth itself warns of coming upheaval — Arthashastra 14.3',
];

// Strategic nodes for India map overlay (expanded)
export const STRATEGIC_NODES: StrategicNode[] = [
  // Army Commands
  { name: 'Northern Command', lat: 34.08, lon: 74.79, type: 'military' },
  { name: 'Western Command', lat: 30.73, lon: 76.78, type: 'military' },
  { name: 'Eastern Command', lat: 22.57, lon: 88.36, type: 'military' },
  { name: 'Southern Command', lat: 18.52, lon: 73.86, type: 'military' },
  { name: 'Central Command', lat: 26.85, lon: 80.95, type: 'military' },
  { name: 'South Western Command', lat: 26.29, lon: 73.02, type: 'military' },
  // Naval Commands
  { name: 'Western Naval Command', lat: 18.93, lon: 72.83, type: 'naval' },
  { name: 'Eastern Naval Command', lat: 17.69, lon: 83.22, type: 'naval' },
  { name: 'Southern Naval Command', lat: 9.97, lon: 76.27, type: 'naval' },
  { name: 'INS Kadamba (Karwar)', lat: 14.81, lon: 74.12, type: 'naval' },
  { name: 'Andaman & Nicobar Command', lat: 11.62, lon: 92.72, type: 'naval' },
  // Space
  { name: 'ISRO Sriharikota', lat: 13.72, lon: 80.23, type: 'space' },
  { name: 'ISRO Thumba', lat: 8.53, lon: 76.86, type: 'space' },
  { name: 'ISRO SAC Ahmedabad', lat: 23.03, lon: 72.55, type: 'space' },
  { name: 'ISRO NRSC Hyderabad', lat: 17.47, lon: 78.53, type: 'space' },
  // Research
  { name: 'DRDO HQ', lat: 28.61, lon: 77.23, type: 'research' },
  { name: 'Bhabha ARC', lat: 19.18, lon: 72.86, type: 'research' },
  { name: 'IGCAR Kalpakkam', lat: 12.57, lon: 80.17, type: 'research' },
  // Intelligence
  { name: 'RAW HQ', lat: 28.5850, lon: 77.1993, type: 'intelligence' },
  { name: 'IB HQ', lat: 28.6127, lon: 77.2118, type: 'intelligence' },
  { name: 'NIA HQ', lat: 28.6138, lon: 77.2273, type: 'intelligence' },
  // Nuclear
  { name: 'Tarapur Nuclear', lat: 19.83, lon: 72.67, type: 'nuclear' },
  { name: 'Kudankulam Nuclear', lat: 8.17, lon: 77.71, type: 'nuclear' },
  { name: 'Kaiga Nuclear', lat: 14.85, lon: 74.43, type: 'nuclear' },
  { name: 'Rawatbhata Nuclear', lat: 24.88, lon: 75.59, type: 'nuclear' },
  // Major Ports
  { name: 'Jawaharlal Nehru Port', lat: 18.95, lon: 72.95, type: 'port' },
  { name: 'Mundra Port', lat: 22.74, lon: 69.72, type: 'port' },
  { name: 'Visakhapatnam Port', lat: 17.69, lon: 83.28, type: 'port' },
  { name: 'Chennai Port', lat: 13.10, lon: 80.30, type: 'port' },
];

// ISRO satellite name patterns for TLE filtering
export const ISRO_SATELLITE_PATTERNS = [
  'CARTOSAT', 'RESOURCESAT', 'OCEANSAT', 'EOS-',
  'RISAT', 'INSAT', 'GSAT', 'IRNSS', 'NAVIC',
  'ASTROSAT', 'SARAL', 'SCATSAT', 'EMISAT',
  'MICROSAT', 'HAMSAT', 'ANUSAT', 'NISAR',
  'PRATHAM', 'KALAMSAT', 'AMAZONIA',
];

// NORAD IDs for key ISRO satellites
export const ISRO_NORAD_IDS = [
  44233,  // CARTOSAT-3
  54361,  // EOS-06 (OceanSat-3)
  41752,  // INSAT-3DR
  42063,  // RESOURCESAT-2A
  51657,  // EOS-04 (RISAT-1A)
  59671,  // NISAR
];

// India simplified outline (lon, lat) for polyline rendering on Cesium
export const INDIA_OUTLINE: [number, number][] = [
  [68.2, 23.6], [68.5, 23.8], [69.0, 22.8], [70.0, 22.0], [70.5, 21.0],
  [72.0, 21.0], [72.8, 19.9], [73.0, 17.5], [74.0, 15.0], [74.5, 14.5],
  [74.0, 12.8], [75.0, 11.5], [76.3, 9.5], [77.0, 8.1], [77.5, 8.0],
  [78.5, 9.0], [79.0, 10.0], [80.0, 9.5], [80.3, 13.0], [80.2, 15.5],
  [81.0, 16.3], [82.0, 16.5], [83.5, 17.5], [84.0, 18.0], [85.5, 19.5],
  [86.5, 20.5], [87.0, 21.5], [87.5, 21.8], [88.0, 22.0], [89.0, 21.8],
  [89.0, 22.5], [88.5, 23.5], [88.0, 24.5], [88.5, 25.5], [89.0, 26.5],
  [89.5, 26.7], [90.0, 26.8], [91.5, 26.8], [92.0, 26.0], [92.5, 25.0],
  [93.0, 24.5], [94.0, 24.0], [95.0, 24.5], [96.0, 27.5], [97.0, 28.0],
  [97.5, 28.5], [96.0, 29.0], [94.5, 29.0], [92.5, 27.8], [90.0, 28.0],
  [88.0, 27.8], [87.0, 28.0], [85.0, 28.5], [84.0, 28.8], [83.0, 29.0],
  [81.0, 30.0], [80.0, 30.8], [79.0, 32.5], [78.0, 34.5], [77.0, 35.5],
  [76.0, 35.2], [75.5, 36.0], [74.5, 37.0], [74.0, 36.5], [73.0, 36.0],
  [72.0, 35.5], [71.0, 34.5], [70.5, 33.5], [69.5, 31.5], [69.0, 30.0],
  [70.0, 28.0], [71.0, 27.0], [71.5, 25.5], [70.0, 24.5], [68.5, 24.0],
  [68.2, 23.6],
];

// LoC (Line of Control) approximate coordinates
export const LOC_LINE: [number, number][] = [
  [73.75, 32.8], [74.0, 33.2], [74.3, 33.8], [74.6, 34.2],
  [74.8, 34.5], [75.0, 34.8], [75.5, 35.0], [76.0, 35.5],
  [76.5, 36.0], [77.0, 36.8],
];

// LAC (Line of Actual Control) approximate coordinates
export const LAC_LINE: [number, number][] = [
  [78.0, 34.5], [78.5, 34.0], [79.0, 33.5], [79.5, 32.5],
  [80.0, 31.5], [80.5, 31.0], [81.0, 30.5], [82.0, 30.0],
  [83.0, 29.5], [84.0, 29.2], [85.0, 28.8], [86.0, 28.3],
  [87.0, 28.0], [88.0, 27.5], [89.0, 27.0], [90.0, 27.5],
  [91.0, 27.8], [92.0, 27.5], [93.0, 28.0], [94.0, 28.5],
  [95.0, 28.0], [96.0, 28.5], [97.0, 28.0],
];

// Nuclear Triad status (static OSINT data)
export const NUCLEAR_TRIAD = {
  land: { label: 'AGNI CORPS', status: 'OPERATIONAL', count: 4, type: 'ICBM/MRBM' },
  sea: { label: 'SSBN FLEET', status: 'PATROL', count: 2, type: 'SLBM' },
  air: { label: 'AIR WING', status: 'STANDBY', count: 3, type: 'AIR-LAUNCH' },
};

// Military commands with HQ locations
export const MILITARY_COMMANDS = [
  { name: 'Northern Command', hq: 'Udhampur', lat: 32.93, lon: 75.13, sector: 'J&K / Ladakh' },
  { name: 'Western Command', hq: 'Chandimandir', lat: 30.73, lon: 76.78, sector: 'Punjab / Rajasthan' },
  { name: 'South Western Command', hq: 'Jaipur', lat: 26.91, lon: 75.79, sector: 'Rajasthan / Gujarat' },
  { name: 'Central Command', hq: 'Lucknow', lat: 26.85, lon: 80.95, sector: 'UP / MP' },
  { name: 'Eastern Command', hq: 'Kolkata', lat: 22.57, lon: 88.36, sector: 'NE India' },
  { name: 'Southern Command', hq: 'Pune', lat: 18.52, lon: 73.86, sector: 'South India' },
];

// Chanakya color tokens
export const CHANAKYA_COLORS = {
  saffron: '#FF9933',
  green: '#138808',
  white: '#FFFFFF',
  navy: '#000080',
  chakra: '#0000CD',
  bg: '#00050A',
  panel: 'rgba(10, 5, 0, 0.93)',
  alertRed: '#DC143C',
  alertAmber: '#FF9933',
  alertGreen: '#138808',
  nvgAmber: '#FFB347',
};

// Strategic node type colors
export const NODE_TYPE_COLORS: Record<string, string> = {
  military: '#FF4444',
  naval: '#4488FF',
  space: '#00FFAA',
  research: '#FFDD00',
  intelligence: '#FF9933',
  nuclear: '#FF00FF',
  port: '#00CCFF',
};

// India airspace bounding box for flight filtering
export const INDIA_BBOX = {
  lamin: 6.5,
  lamax: 37.5,
  lomin: 68.0,
  lomax: 97.5,
};

// Indian airline identification by callsign prefix
export const INDIAN_AIRLINES: Record<string, { name: string; color: string }> = {
  'IGO': { name: 'IndiGo', color: '#0057A3' },
  'AIC': { name: 'Air India', color: '#DC143C' },
  'SEJ': { name: 'SpiceJet', color: '#FFD700' },
  'VTI': { name: 'Vistara', color: '#6A0DAD' },
  'AXB': { name: 'Air India Express', color: '#FF6600' },
  'JAI': { name: 'Jet Airways', color: '#FFD700' },
  'ALW': { name: 'Alliance Air', color: '#336699' },
  'GAL': { name: 'GoAir', color: '#00AA55' },
  'AKJ': { name: 'Akasa Air', color: '#FF5722' },
};

// Intel message templates for LiveIntelFeed
export const INTEL_TEMPLATES = {
  FLIGHT: [
    '{count} aircraft detected in {zone} sector airspace',
    'High-altitude traffic detected near {zone} — {count} ac tracked',
    'Civilian traffic nominal over {zone} — {count} contacts',
    'Air defense perimeter {zone}: {count} aircraft under surveillance',
  ],
  SEISMIC: [
    'Seismic event M{magnitude} detected near {place} — monitoring',
    'NCS ALERT: M{magnitude} at {place} — depth {depth}km',
    'Tremor activity M{magnitude} in {place} region',
  ],
  BORDER: [
    '{zone} sector: patrol status {status}',
    'Border surveillance {zone}: threat level {threat}',
    '{zone} perimeter integrity: {status}',
  ],
  AQI: [
    'Environmental alert: {count} stations reporting POOR+ AQI',
    'Air quality degraded in {city}: AQI {value}',
    '{count} monitoring stations in critical range',
  ],
  ISRO: [
    'ISRO satellite {name} passing over India at {alt}km',
    'NavIC constellation: {count} satellites in active orbit',
    'Ground track acquired: {name} — orbital pass in progress',
  ],
};

// Seismic zone data for India
export const SEISMIC_ZONES = [
  { zone: 'V', label: 'Very Severe', color: 'rgba(139, 0, 0, 0.15)', regions: ['Himalayan Belt', 'NE India', 'Andaman'] },
  { zone: 'IV', label: 'Severe', color: 'rgba(255, 0, 0, 0.10)', regions: ['Delhi NCR', 'J&K', 'Himachal', 'Bihar'] },
  { zone: 'III', label: 'Moderate', color: 'rgba(255, 165, 0, 0.08)', regions: ['Mumbai', 'Kolkata', 'Central India'] },
  { zone: 'II', label: 'Low', color: 'rgba(255, 255, 0, 0.05)', regions: ['South India', 'Rajasthan'] },
];

// Cyclone watch default state
export const CYCLONE_WATCH = {
  bayOfBengal: 'CALM',
  arabianSea: 'CALM',
  activeCyclones: 0,
  imdStatus: 'GREEN',
};

// ISRO mission clock (next upcoming launch — update manually)
export const NEXT_ISRO_LAUNCH = {
  vehicle: 'PSLV-C62',
  payload: 'EOS-08',
  targetDate: '2026-03-15T03:30:00Z',
};

// India AQI color scale
export const AQI_COLORS: Record<string, string> = {
  GOOD: '#00E400',
  SATISFACTORY: '#FFFF00',
  MODERATE: '#FF7E00',
  POOR: '#FF0000',
  VERY_POOR: '#8F3F97',
  SEVERE: '#7E0023',
};

export function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'GOOD';
  if (aqi <= 100) return 'SATISFACTORY';
  if (aqi <= 200) return 'MODERATE';
  if (aqi <= 300) return 'POOR';
  if (aqi <= 400) return 'VERY_POOR';
  return 'SEVERE';
}

export function getAQIColor(aqi: number): string {
  return AQI_COLORS[getAQICategory(aqi)] ?? '#7E0023';
}
