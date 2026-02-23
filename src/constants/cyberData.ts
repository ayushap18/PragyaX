export const CYBER_THREATS = [
  { vector: 'PHISHING', origin: 'CN', severity: 'HIGH', blocked: 1247 },
  { vector: 'DDoS', origin: 'RU', severity: 'MEDIUM', blocked: 89 },
  { vector: 'APT', origin: 'PK', severity: 'CRITICAL', blocked: 3 },
  { vector: 'MALWARE', origin: 'UNKNOWN', severity: 'LOW', blocked: 456 },
];

export const CYBER_SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#FF3333',
  HIGH: '#FF6633',
  MEDIUM: '#FFA500',
  LOW: '#00FFD1',
};

export const FIREWALL_STATUS = {
  rules: 14892,
  blocked24h: 1795,
  uptime: '99.97%',
};
