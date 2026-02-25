"use client";

import { useEffect, useRef } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { useGeofenceStore } from '@/stores/exclusiveStores';
import { useHUDStore } from '@/stores/hudStore';
import { pointInPolygon, pointInBoundingBox } from '@/lib/geo';
import { SFX } from '@/utils/audioEngine';

interface EntityState {
  inside: boolean;
  enteredAt: number;
}

/**
 * Evaluates all tracked entities against all armed geofences at 1Hz.
 * Fires ENTER/EXIT/DWELL alerts via the geofence store + HUD intel feed.
 */
export function useGeofenceEngine() {
  const geofences = useGeofenceStore((s) => s.geofences);
  const addBreach = useGeofenceStore((s) => s.addBreach);
  const flights = useDataStore((s) => s.flights);
  const entityStates = useRef<Map<string, EntityState>>(new Map());

  useEffect(() => {
    const armedFences = geofences.filter((f) => f.armed);
    if (armedFences.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();

      for (const fence of armedFences) {
        for (const aircraft of flights) {
          const key = `${fence.id}:${aircraft.icao24}`;
          const point = { lat: aircraft.lat, lon: aircraft.lon };
          const prev = entityStates.current.get(key);

          // Fast bounding box check first
          if (!pointInBoundingBox(point, fence.vertices)) {
            if (prev?.inside && fence.rules.onExit) {
              // Entity exited
              const breach = {
                fenceId: fence.id,
                entityId: aircraft.callsign || aircraft.icao24,
                entityType: 'aircraft' as const,
                event: 'EXIT' as const,
                timestamp: new Date().toISOString(),
                position: { lat: aircraft.lat, lon: aircraft.lon, alt: aircraft.altitudeFt },
              };
              addBreach(breach);
              pushToIntelFeed(`GEOFENCE EXIT: ${breach.entityId} left ${fence.name}`, 'CRITICAL');
              SFX.alert();
            }
            entityStates.current.set(key, { inside: false, enteredAt: 0 });
            continue;
          }

          const isInside = pointInPolygon(point, fence.vertices);

          if (isInside && !prev?.inside) {
            // Entity entered
            entityStates.current.set(key, { inside: true, enteredAt: now });
            if (fence.rules.onEnter) {
              const breach = {
                fenceId: fence.id,
                entityId: aircraft.callsign || aircraft.icao24,
                entityType: 'aircraft' as const,
                event: 'ENTER' as const,
                timestamp: new Date().toISOString(),
                position: { lat: aircraft.lat, lon: aircraft.lon, alt: aircraft.altitudeFt },
              };
              addBreach(breach);
              pushToIntelFeed(`GEOFENCE BREACH: ${breach.entityId} entered ${fence.name}`, 'CRITICAL');
              SFX.alert();
            }
          } else if (!isInside && prev?.inside) {
            // Entity exited
            entityStates.current.set(key, { inside: false, enteredAt: 0 });
            if (fence.rules.onExit) {
              const breach = {
                fenceId: fence.id,
                entityId: aircraft.callsign || aircraft.icao24,
                entityType: 'aircraft' as const,
                event: 'EXIT' as const,
                timestamp: new Date().toISOString(),
                position: { lat: aircraft.lat, lon: aircraft.lon, alt: aircraft.altitudeFt },
              };
              addBreach(breach);
              pushToIntelFeed(`GEOFENCE EXIT: ${breach.entityId} left ${fence.name}`, 'CRITICAL');
            }
          } else if (isInside && prev?.inside && fence.rules.dwellThresholdSec) {
            // Check dwell
            const dwellMs = now - prev.enteredAt;
            if (dwellMs > fence.rules.dwellThresholdSec * 1000) {
              const breach = {
                fenceId: fence.id,
                entityId: aircraft.callsign || aircraft.icao24,
                entityType: 'aircraft' as const,
                event: 'DWELL' as const,
                timestamp: new Date().toISOString(),
                position: { lat: aircraft.lat, lon: aircraft.lon, alt: aircraft.altitudeFt },
              };
              addBreach(breach);
              pushToIntelFeed(`GEOFENCE DWELL: ${breach.entityId} lingering in ${fence.name} (${Math.round(dwellMs / 1000)}s)`, 'HIGH');
              // Reset to avoid re-firing every tick
              entityStates.current.set(key, { inside: true, enteredAt: now });
            }
          } else if (!prev) {
            entityStates.current.set(key, { inside: isInside, enteredAt: isInside ? now : 0 });
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [geofences, flights, addBreach]);
}

function pushToIntelFeed(message: string, severity: string) {
  const { intelFeed } = useHUDStore.getState();
  const newEvent = {
    id: Date.now(),
    time: new Date().toISOString().slice(11, 19) + 'Z',
    text: message,
    type: (severity === 'CRITICAL' ? 'alert' : 'warn') as 'alert' | 'warn',
  };
  useHUDStore.setState({
    intelFeed: [newEvent, ...intelFeed].slice(0, 12),
  });
}
