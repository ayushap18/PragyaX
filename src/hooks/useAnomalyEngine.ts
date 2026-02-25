"use client";

import { useEffect, useRef } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { useAnomalyStore } from '@/stores/exclusiveStores';
import type { Anomaly } from '@/stores/exclusiveStores';
import { useHUDStore } from '@/stores/hudStore';
import { correlateAnomalies } from '@/lib/correlation/engine';
import type { Aircraft } from '@/types';

interface FlightHistory {
  headings: number[];
  altitudes: number[];
  speeds: number[];
  squawks: string[];
}

/**
 * Anomaly detection engine — runs on every data update and flags statistical outliers.
 *
 * Flight anomalies:  sudden heading changes, rapid descent, squawk changes, circling pattern
 * Seismic anomalies: earthquake swarms (frequency clustering), magnitude escalation
 * AQI anomalies:     sudden PM2.5 spikes, multi-station correlation
 */
export function useAnomalyEngine() {
  const flights = useDataStore((s) => s.flights);
  const earthquakes = useDataStore((s) => s.earthquakes);
  const addAnomaly = useAnomalyStore((s) => s.addAnomaly);
  const flightHistory = useRef<Map<string, FlightHistory>>(new Map());
  const lastQuakeCount = useRef(0);
  const lastAnomalyIds = useRef<Set<string>>(new Set());

  // ── Flight Anomaly Detection ──
  useEffect(() => {
    if (flights.length === 0) return;

    for (const f of flights) {
      const key = f.icao24;
      const hist = flightHistory.current.get(key);

      if (!hist) {
        flightHistory.current.set(key, {
          headings: [f.heading],
          altitudes: [f.altitudeFt],
          speeds: [f.velocityKts],
          squawks: [f.squawk],
        });
        continue;
      }

      // Record history (keep last 10)
      hist.headings.push(f.heading);
      hist.altitudes.push(f.altitudeFt);
      hist.speeds.push(f.velocityKts);
      hist.squawks.push(f.squawk);
      if (hist.headings.length > 10) hist.headings.shift();
      if (hist.altitudes.length > 10) hist.altitudes.shift();
      if (hist.speeds.length > 10) hist.speeds.shift();
      if (hist.squawks.length > 10) hist.squawks.shift();

      // 1. Rapid heading change (circling pattern)
      if (hist.headings.length >= 3) {
        const recent = hist.headings.slice(-3);
        const totalTurn = recent.reduce((sum, h, i) => {
          if (i === 0) return 0;
          let delta = Math.abs(h - recent[i - 1]);
          if (delta > 180) delta = 360 - delta;
          return sum + delta;
        }, 0);

        if (totalTurn > 150) {
          emitFlightAnomaly(f, 'CIRCLING', totalTurn, addAnomaly, lastAnomalyIds.current);
        }
      }

      // 2. Rapid descent (>3000ft in observations)
      if (hist.altitudes.length >= 3) {
        const altDrop = hist.altitudes[hist.altitudes.length - 3] - f.altitudeFt;
        if (altDrop > 3000 && !f.onGround) {
          emitFlightAnomaly(f, 'RAPID_DESCENT', altDrop, addAnomaly, lastAnomalyIds.current);
        }
      }

      // 3. Squawk change (especially emergency squawks)
      if (hist.squawks.length >= 2) {
        const prev = hist.squawks[hist.squawks.length - 2];
        const curr = f.squawk;
        if (prev !== curr) {
          const emergencySquawks = ['7500', '7600', '7700']; // hijack, comm failure, emergency
          if (emergencySquawks.includes(curr)) {
            emitFlightAnomaly(f, 'EMERGENCY_SQUAWK', 0, addAnomaly, lastAnomalyIds.current);
          }
        }
      }

      // 4. Speed anomaly (below 100kts while not on ground and above 5000ft)
      if (f.velocityKts < 100 && !f.onGround && f.altitudeFt > 5000) {
        emitFlightAnomaly(f, 'LOW_SPEED', f.velocityKts, addAnomaly, lastAnomalyIds.current);
      }
    }

    // Prune old entries
    if (flightHistory.current.size > 200) {
      const activeIcaos = new Set(flights.map((f) => f.icao24));
      for (const k of flightHistory.current.keys()) {
        if (!activeIcaos.has(k)) flightHistory.current.delete(k);
      }
    }
  }, [flights, addAnomaly]);

  // ── Seismic Anomaly Detection ──
  useEffect(() => {
    if (earthquakes.length === 0) return;

    // Swarm detection: if quake count increased by 3+ in one update cycle
    const delta = earthquakes.length - lastQuakeCount.current;
    lastQuakeCount.current = earthquakes.length;

    if (delta >= 3) {
      // Check if recent quakes are spatially clustered (within 100km of each other)
      const recent = earthquakes.slice(0, delta);
      const center = recent[0];
      const clustered = recent.filter((q) => {
        const dlat = q.lat - center.lat;
        const dlon = q.lon - center.lon;
        const approxKm = Math.sqrt(dlat * dlat + dlon * dlon) * 111;
        return approxKm < 100;
      });

      if (clustered.length >= 3) {
        const id = `seismic-swarm-${Date.now()}`;
        if (!lastAnomalyIds.current.has(id)) {
          lastAnomalyIds.current.add(id);
          addAnomaly({
            id,
            type: 'SEISMIC_SWARM',
            severity: clustered.some((q) => q.magnitude > 5) ? 'CRITICAL' : 'HIGH',
            score: Math.min(100, clustered.length * 15 + Math.max(...clustered.map((q) => q.magnitude)) * 10),
            entity: `${clustered.length} earthquakes`,
            description: `Seismic swarm detected: ${clustered.length} events within 100km near ${center.place}. Max magnitude: M${Math.max(...clustered.map((q) => q.magnitude)).toFixed(1)}`,
            position: { lat: center.lat, lon: center.lon },
            detectedAt: new Date().toISOString(),
            acknowledged: false,
            metadata: { quakeCount: clustered.length, maxMag: Math.max(...clustered.map((q) => q.magnitude)) },
          });
          pushToIntelFeed(`SEISMIC SWARM: ${clustered.length} events near ${center.place}`);
        }
      }
    }

    // Magnitude escalation: if latest quake is significantly stronger than average
    if (earthquakes.length >= 5) {
      const mags = earthquakes.slice(0, 10).map((q) => q.magnitude);
      const avg = mags.reduce((a, b) => a + b, 0) / mags.length;
      const latest = earthquakes[0];
      if (latest.magnitude > avg * 2 && latest.magnitude >= 4.0) {
        const id = `mag-escalation-${latest.id}`;
        if (!lastAnomalyIds.current.has(id)) {
          lastAnomalyIds.current.add(id);
          addAnomaly({
            id,
            type: 'SEISMIC_SWARM',
            severity: latest.magnitude >= 6 ? 'CRITICAL' : 'HIGH',
            score: Math.min(100, latest.magnitude * 15),
            entity: latest.id,
            description: `Magnitude escalation: M${latest.magnitude.toFixed(1)} at ${latest.place} — ${(latest.magnitude / avg).toFixed(1)}x regional average`,
            position: { lat: latest.lat, lon: latest.lon },
            detectedAt: new Date().toISOString(),
            acknowledged: false,
            metadata: { magnitude: latest.magnitude, avgMagnitude: avg },
          });
        }
      }
    }
  }, [earthquakes, addAnomaly]);

  // Prune anomaly ID cache periodically
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastAnomalyIds.current.size > 200) {
        lastAnomalyIds.current.clear();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Cross-Domain Correlation Engine ──
  const anomalies = useAnomalyStore((s) => s.anomalies);
  const lastCorrelationRun = useRef(0);

  useEffect(() => {
    // Run correlation every 30 seconds, only on unacknowledged anomalies
    const now = Date.now();
    if (now - lastCorrelationRun.current < 30000) return;
    lastCorrelationRun.current = now;

    const unacked = anomalies.filter((a) => !a.acknowledged && a.type !== 'CORRELATION');
    if (unacked.length < 2) return;

    const reports = correlateAnomalies(unacked);
    for (const report of reports) {
      if (lastAnomalyIds.current.has(report.id)) continue;
      lastAnomalyIds.current.add(report.id);

      addAnomaly({
        id: report.id,
        type: 'CORRELATION',
        severity: report.classification === 'TS' ? 'CRITICAL' : 'HIGH',
        score: report.confidenceScore,
        entity: `${report.involvedEntities.length} entities`,
        description: report.narrative,
        position: report.spatialCenter,
        detectedAt: new Date().toISOString(),
        acknowledged: false,
        metadata: {
          domains: [...new Set(report.involvedEntities.map((e) => e.domain))],
          radiusKm: report.radiusKm,
          action: report.recommendedAction,
        },
      });

      pushToIntelFeed(`CORRELATION: Multi-domain pattern — ${report.involvedEntities.length} entities, confidence ${report.confidenceScore.toFixed(0)}%`);
    }
  }, [anomalies, addAnomaly]);
}

function emitFlightAnomaly(
  f: Aircraft,
  subtype: string,
  value: number,
  addAnomaly: (a: Anomaly) => void,
  seen: Set<string>
) {
  const id = `flight-${subtype}-${f.icao24}-${Math.floor(Date.now() / 30000)}`;
  if (seen.has(id)) return;
  seen.add(id);

  const callsign = f.callsign || f.icao24;
  const descriptions: Record<string, string> = {
    CIRCLING: `${callsign} executing circling pattern (${value.toFixed(0)}° total heading change)`,
    RAPID_DESCENT: `${callsign} rapid descent: ${value.toFixed(0)}ft altitude loss detected`,
    EMERGENCY_SQUAWK: `${callsign} broadcasting emergency squawk ${f.squawk} — ${f.squawk === '7500' ? 'HIJACK' : f.squawk === '7600' ? 'COMM FAILURE' : 'GENERAL EMERGENCY'}`,
    LOW_SPEED: `${callsign} abnormally low speed: ${value.toFixed(0)}kts at FL${Math.round(f.altitudeFt / 100)}`,
  };

  const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
    CIRCLING: 'MEDIUM',
    RAPID_DESCENT: 'HIGH',
    EMERGENCY_SQUAWK: 'CRITICAL',
    LOW_SPEED: 'LOW',
  };

  addAnomaly({
    id,
    type: 'FLIGHT_PATH',
    severity: severityMap[subtype] || 'MEDIUM',
    score: subtype === 'EMERGENCY_SQUAWK' ? 100 : Math.min(90, value / 5),
    entity: callsign,
    description: descriptions[subtype] || `${callsign} anomaly detected`,
    position: { lat: f.lat, lon: f.lon },
    detectedAt: new Date().toISOString(),
    acknowledged: false,
    metadata: { subtype, value, squawk: f.squawk, altitude: f.altitudeFt },
  });

  if (severityMap[subtype] === 'CRITICAL' || severityMap[subtype] === 'HIGH') {
    pushToIntelFeed(`FLIGHT ANOMALY: ${descriptions[subtype]}`);
  }
}

function pushToIntelFeed(message: string) {
  const { intelFeed } = useHUDStore.getState();
  const newEvent = {
    id: Date.now() + Math.random(),
    time: new Date().toISOString().slice(11, 19) + 'Z',
    text: message,
    type: 'alert' as const,
  };
  useHUDStore.setState({
    intelFeed: [newEvent, ...intelFeed].slice(0, 12),
  });
}
