import type { VisualMode } from '@/types';

export const MODE_FILTERS: Record<VisualMode, string> = {
  NORMAL: 'none',
  CRT: 'sepia(40%) brightness(1.1) contrast(1.2) saturate(150%)',
  NVG: 'hue-rotate(90deg) saturate(800%) brightness(0.8) contrast(1.4)',
  FLIR: 'grayscale(100%) brightness(1.2) contrast(1.6) invert(1)',
  DRONE: 'none',
};

export const MODE_ACCENTS: Record<VisualMode, string> = {
  NORMAL: '#00FFD1',
  CRT: '#FFA500',
  NVG: '#00FF41',
  FLIR: '#CCCCCC',
  DRONE: '#00FFD1',
};

export const MODE_LABELS: Record<VisualMode, string> = {
  NORMAL: 'Normal',
  CRT: 'CRT',
  NVG: 'NVG',
  FLIR: 'FLIR',
  DRONE: 'Drone',
};

export const MODE_ICONS: Record<VisualMode, string> = {
  NORMAL: 'globe',
  CRT: 'monitor',
  NVG: 'binoculars',
  FLIR: 'thermometer',
  DRONE: 'plane',
};

export const ALL_MODES: VisualMode[] = ['NORMAL', 'CRT', 'NVG', 'FLIR', 'DRONE'];

export const BOTTOM_MODES: { mode: VisualMode | 'ANIMATE' | 'REFS' | 'AI'; label: string; icon: string }[] = [
  { mode: 'NORMAL', label: 'Normal', icon: 'globe' },
  { mode: 'CRT', label: 'CRT', icon: 'monitor' },
  { mode: 'NVG', label: 'NVG', icon: 'binoculars' },
  { mode: 'FLIR', label: 'FLIR', icon: 'thermometer' },
  { mode: 'ANIMATE', label: 'Animate', icon: 'play' },
  { mode: 'REFS', label: 'Refs', icon: 'layout-grid' },
  { mode: 'DRONE', label: 'Drone', icon: 'plane' },
  { mode: 'AI', label: 'AI', icon: 'brain' },
];
