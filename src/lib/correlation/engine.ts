import { haversineKm } from '@/lib/geo';
import type { Anomaly } from '@/stores/exclusiveStores';

interface CorrelatedIntelReport {
  id: string;
  classification: 'S' | 'TS' | 'C';
  involvedEntities: {
    type: string;
    id: string;
    domain: 'FLIGHT' | 'SEISMIC' | 'CCTV' | 'AQI' | 'SATELLITE' | 'MARITIME';
  }[];
  spatialCenter: { lat: number; lon: number };
  radiusKm: number;
  temporalWindow: { start: string; end: string };
  narrative: string;
  confidenceScore: number;
  recommendedAction: string;
}

const SPATIAL_THRESHOLD_KM = 50;
const TEMPORAL_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Cross-domain intelligence correlation engine.
 * Finds clusters of anomalies across different data domains
 * that are spatially and temporally correlated.
 */
export function correlateAnomalies(anomalies: Anomaly[]): CorrelatedIntelReport[] {
  const reports: CorrelatedIntelReport[] = [];
  const used = new Set<string>();

  // Sort by severity (most severe first)
  const sorted = [...anomalies].sort((a, b) => {
    const ord = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (ord[a.severity] || 3) - (ord[b.severity] || 3);
  });

  for (const anchor of sorted) {
    if (used.has(anchor.id)) continue;

    // Find all anomalies within spatial+temporal window of this anchor
    const cluster: Anomaly[] = [anchor];

    for (const candidate of sorted) {
      if (candidate.id === anchor.id || used.has(candidate.id)) continue;

      const distance = haversineKm(anchor.position, candidate.position);
      const timeDelta = Math.abs(
        new Date(anchor.detectedAt).getTime() - new Date(candidate.detectedAt).getTime()
      );

      if (distance <= SPATIAL_THRESHOLD_KM && timeDelta <= TEMPORAL_THRESHOLD_MS) {
        cluster.push(candidate);
      }
    }

    // Only generate reports for multi-domain correlations
    const domains = new Set(cluster.map((a) => getDomain(a.type)));
    if (domains.size >= 2 && cluster.length >= 2) {
      for (const a of cluster) used.add(a.id);

      const center = {
        lat: cluster.reduce((s, a) => s + a.position.lat, 0) / cluster.length,
        lon: cluster.reduce((s, a) => s + a.position.lon, 0) / cluster.length,
      };

      const maxDistance = Math.max(...cluster.map((a) => haversineKm(center, a.position)));
      const times = cluster.map((a) => new Date(a.detectedAt).getTime());

      const report: CorrelatedIntelReport = {
        id: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        classification: cluster.some((a) => a.severity === 'CRITICAL') ? 'TS' : 'S',
        involvedEntities: cluster.map((a) => ({
          type: a.type,
          id: a.entity,
          domain: getDomain(a.type),
        })),
        spatialCenter: center,
        radiusKm: Math.max(1, maxDistance),
        temporalWindow: {
          start: new Date(Math.min(...times)).toISOString(),
          end: new Date(Math.max(...times)).toISOString(),
        },
        narrative: generateNarrative(cluster),
        confidenceScore: calculateConfidence(cluster),
        recommendedAction: generateAction(cluster),
      };

      reports.push(report);
    }
  }

  return reports;
}

function getDomain(type: Anomaly['type']): CorrelatedIntelReport['involvedEntities'][0]['domain'] {
  const map: Record<string, CorrelatedIntelReport['involvedEntities'][0]['domain']> = {
    FLIGHT_PATH: 'FLIGHT',
    SEISMIC_SWARM: 'SEISMIC',
    AQI_SPIKE: 'AQI',
    TRAFFIC: 'CCTV',
    DETECTION: 'CCTV',
    MARITIME: 'MARITIME',
    CORRELATION: 'FLIGHT',
  };
  return map[type] || 'FLIGHT';
}

function generateNarrative(cluster: Anomaly[]): string {
  const parts: string[] = [];

  const flights = cluster.filter((a) => a.type === 'FLIGHT_PATH');
  const seismic = cluster.filter((a) => a.type === 'SEISMIC_SWARM');
  const aqi = cluster.filter((a) => a.type === 'AQI_SPIKE');
  const traffic = cluster.filter((a) => a.type === 'TRAFFIC' || a.type === 'DETECTION');
  const maritime = cluster.filter((a) => a.type === 'MARITIME');

  if (flights.length > 0) {
    parts.push(`${flights.length} flight anomal${flights.length > 1 ? 'ies' : 'y'} detected (${flights.map((f) => f.entity).join(', ')})`);
  }
  if (seismic.length > 0) {
    parts.push(`seismic activity cluster (${seismic.length} event${seismic.length > 1 ? 's' : ''})`);
  }
  if (aqi.length > 0) {
    parts.push(`air quality deviation at ${aqi.length} station${aqi.length > 1 ? 's' : ''}`);
  }
  if (traffic.length > 0) {
    parts.push(`surface surveillance anomaly (${traffic.length} detection${traffic.length > 1 ? 's' : ''})`);
  }
  if (maritime.length > 0) {
    parts.push(`maritime domain alert (${maritime.length} vessel${maritime.length > 1 ? 's' : ''})`);
  }

  return `MULTI-DOMAIN CORRELATION: ${parts.join(' coincident with ')}. Pattern suggests coordinated activity warranting elevated surveillance posture.`;
}

function calculateConfidence(cluster: Anomaly[]): number {
  const domains = new Set(cluster.map((a) => getDomain(a.type)));
  const avgScore = cluster.reduce((s, a) => s + a.score, 0) / cluster.length;
  const domainBonus = (domains.size - 1) * 15;
  const countBonus = Math.min(20, cluster.length * 5);
  return Math.min(100, avgScore * 0.5 + domainBonus + countBonus);
}

function generateAction(cluster: Anomaly[]): string {
  const maxSeverity = cluster.reduce((max, a) => {
    const ord = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (ord[a.severity] || 3) < (ord[max.severity] || 3) ? a : max;
  });

  if (maxSeverity.severity === 'CRITICAL') {
    return 'IMMEDIATE: Elevate to watch floor. Dispatch ISR asset for verification. Initiate cross-agency notification protocol.';
  }
  if (maxSeverity.severity === 'HIGH') {
    return 'PRIORITY: Increase collection posture in affected area. Task available surveillance assets for pattern confirmation.';
  }
  return 'ROUTINE: Continue monitoring. Flag for next intelligence summary. Update pattern database.';
}

export type { CorrelatedIntelReport };
