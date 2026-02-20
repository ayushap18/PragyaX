import type { LayerConfig } from '@/types';

export const LAYERS: LayerConfig[] = [
  { id: 'flights', label: 'Live Flights', icon: 'plane', defaultEnabled: true, mockCount: 8247 },
  { id: 'earthquakes', label: 'Earthquakes', icon: 'activity', defaultEnabled: false, mockCount: 34 },
  { id: 'satellites', label: 'Satellites', icon: 'satellite', defaultEnabled: true, mockCount: 133 },
  { id: 'traffic', label: 'Street Traffic', icon: 'car', defaultEnabled: false },
  { id: 'weather', label: 'Weather Radar', icon: 'cloud', defaultEnabled: true },
  { id: 'cctv', label: 'CCTV Mesh', icon: 'video', defaultEnabled: false, mockCount: 94 },
];
