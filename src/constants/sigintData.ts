export const SIGINT_FREQUENCIES = [
  { freq: '14.223 GHz', type: 'SATCOM', status: 'DECODED', strength: 87 },
  { freq: '8.175 GHz', type: 'RADAR', status: 'MONITORING', strength: 62 },
  { freq: '2.4 GHz', type: 'COMM', status: 'INTERCEPTED', strength: 94 },
  { freq: '433 MHz', type: 'TELEMETRY', status: 'TRACKING', strength: 71 },
  { freq: '156.8 MHz', type: 'MARITIME', status: 'PASSIVE', strength: 55 },
];

export const SIGINT_INTERCEPTS = [
  'FREQ 14.223: Encoded burst — 4.2KB — pattern match 73%',
  'FREQ 8.175: Radar signature — X-band — emitter classified',
  'FREQ 2.4: Voice comm — language ID: Mandarin — sector NE',
  'FREQ 433: Telemetry packet — heartbeat interval 30s',
  'FREQ 156.8: Maritime transponder — vessel MMSI 412xxxxxx',
  'FREQ 14.223: Uplink detected — TDMA frame — encrypted',
  'FREQ 8.175: Pulse pattern change — scan mode shift',
];

export const SIGINT_STATUS_COLORS: Record<string, string> = {
  DECODED: '#00FF41',
  INTERCEPTED: '#00FFD1',
  MONITORING: '#FFA500',
  TRACKING: '#4488FF',
  PASSIVE: 'rgba(200,230,255,0.5)',
};
