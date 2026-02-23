export const HUMINT_NETWORKS = [
  { codename: 'LOTUS', sector: 'LOC', status: 'ACTIVE', lastContact: '2h ago', reliability: 'A' },
  { codename: 'COBRA', sector: 'LAC', status: 'ACTIVE', lastContact: '6h ago', reliability: 'B' },
  { codename: 'PHOENIX', sector: 'MARITIME', status: 'DARK', lastContact: '48h ago', reliability: 'A' },
  { codename: 'GARUDA', sector: 'NE CMD', status: 'ACTIVE', lastContact: '1h ago', reliability: 'C' },
  { codename: 'VAJRA', sector: 'CYBER', status: 'STANDBY', lastContact: '12h ago', reliability: 'B' },
];

export const HUMINT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#00FF41',
  STANDBY: '#FFA500',
  DARK: '#FF3333',
};

export const HUMINT_RELIABILITY_COLORS: Record<string, string> = {
  A: '#00FF41',
  B: '#FFA500',
  C: '#FF6666',
};
