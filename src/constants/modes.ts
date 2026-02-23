import type { VisualMode } from '@/types';

export const MODE_FILTERS: Record<VisualMode, string> = {
  NORMAL: 'none',
  CRT: 'sepia(40%) brightness(1.1) contrast(1.2) saturate(150%)',
  NVG: 'hue-rotate(90deg) saturate(800%) brightness(0.8) contrast(1.4)',
  FLIR: 'grayscale(100%) brightness(1.2) contrast(1.6) invert(1)',
  DRONE: 'none',
  GREEN: 'hue-rotate(100deg) saturate(600%) brightness(0.9) contrast(1.3)',
  CHANAKYA: 'sepia(25%) brightness(1.05) contrast(1.15) saturate(120%) hue-rotate(-15deg)',
};

export const MODE_ACCENTS: Record<VisualMode, string> = {
  NORMAL: '#00FFD1',
  CRT: '#FFA500',
  NVG: '#00FF41',
  FLIR: '#CCCCCC',
  DRONE: '#00FFD1',
  GREEN: '#39FF14',
  CHANAKYA: '#FF9933',
};

export const MODE_LABELS: Record<VisualMode, string> = {
  NORMAL: 'Normal',
  CRT: 'CRT',
  NVG: 'NVG',
  FLIR: 'FLIR',
  DRONE: 'Drone',
  GREEN: 'Green',
  CHANAKYA: 'Chanakya',
};

export const MODE_ICONS: Record<VisualMode, string> = {
  NORMAL: 'globe',
  CRT: 'monitor',
  NVG: 'binoculars',
  FLIR: 'thermometer',
  DRONE: 'plane',
  GREEN: 'shield',
  CHANAKYA: 'eye',
};

export const ALL_MODES: VisualMode[] = ['NORMAL', 'CRT', 'NVG', 'FLIR', 'DRONE', 'GREEN', 'CHANAKYA'];

export const BOTTOM_MODES: { mode: VisualMode | 'ANIMATE' | 'REFS' | 'AI'; label: string; icon: string }[] = [
  { mode: 'NORMAL', label: 'Normal', icon: 'globe' },
  { mode: 'CRT', label: 'CRT', icon: 'monitor' },
  { mode: 'NVG', label: 'NVG', icon: 'binoculars' },
  { mode: 'FLIR', label: 'FLIR', icon: 'thermometer' },
  { mode: 'GREEN', label: 'Green', icon: 'shield' },
  { mode: 'CHANAKYA', label: 'Chanakya', icon: 'eye' },
  { mode: 'ANIMATE', label: 'Animate', icon: 'play' },
  { mode: 'REFS', label: 'Refs', icon: 'layout-grid' },
  { mode: 'DRONE', label: 'Drone', icon: 'plane' },
  { mode: 'AI', label: 'AI', icon: 'brain' },
];
