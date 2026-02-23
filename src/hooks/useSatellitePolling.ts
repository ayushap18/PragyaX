"use client";

import { useEffect, useRef } from 'react';
import { fetchSatelliteTLEs } from '@/services/satelliteService';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';

export function useSatellitePolling() {
  const enabled = useLayerStore((s) => s.layers.satellites.enabled);
  const setSatelliteTLEs = useDataStore((s) => s.setSatelliteTLEs);
  const setCount = useLayerStore((s) => s.setCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    async function poll() {
      try {
        // Fetch both standard stations AND Indian satellites in parallel
        const [stationsData, indianData] = await Promise.all([
          fetchSatelliteTLEs('stations').catch(() => ({ satellites: [], count: 0 })),
          fetchSatelliteTLEs('indian').catch(() => ({ satellites: [], count: 0 })),
        ]);

        // Merge and deduplicate by noradId
        const seen = new Set<number>();
        const merged = [];
        for (const sat of [...stationsData.satellites, ...indianData.satellites]) {
          if (!seen.has(sat.noradId)) {
            seen.add(sat.noradId);
            merged.push(sat);
          }
        }

        setSatelliteTLEs(merged);
        setCount('satellites', merged.length);
      } catch (err) {
        console.warn('Satellite poll failed:', err);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 3_600_000); // 1 hour

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, setSatelliteTLEs, setCount]);
}
