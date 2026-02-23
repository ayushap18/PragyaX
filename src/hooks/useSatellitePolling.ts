"use client";

import { useEffect, useRef } from 'react';
import { fetchSatelliteTLEs } from '@/services/satelliteService';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import type { SatelliteTLE } from '@/types';

const POLL_INTERVAL = 3_600_000; // 1 hour

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

    // Track merged results across progressive updates
    const seen = new Set<number>();
    const allSats: SatelliteTLE[] = [];

    function mergeAndStore(newSats: SatelliteTLE[]) {
      let added = false;
      for (const sat of newSats) {
        if (!seen.has(sat.noradId)) {
          seen.add(sat.noradId);
          allSats.push(sat);
          added = true;
        }
      }
      if (added) {
        setSatelliteTLEs([...allSats]);
        setCount('satellites', allSats.length);
      }
    }

    async function poll() {
      // Skip if data was fetched recently (avoids redundant HMR refetches)
      const lastFetch = useDataStore.getState().lastSatelliteFetch;
      if (Date.now() - lastFetch < POLL_INTERVAL && useDataStore.getState().satelliteTLEs.length > 0) {
        return;
      }

      // Fire both in parallel — process each result as it arrives
      // Indian sats resolve fast (cached ~0.3s) so ISRO/NavIC data shows immediately
      // Stations may take 10+ seconds from Celestrak
      const indianPromise = fetchSatelliteTLEs('indian')
        .then((data) => mergeAndStore(data.satellites))
        .catch(() => {});

      const stationsPromise = fetchSatelliteTLEs('stations')
        .then((data) => mergeAndStore(data.satellites))
        .catch(() => {});

      await Promise.all([indianPromise, stationsPromise]);
    }

    poll();
    intervalRef.current = setInterval(() => {
      // Reset tracking for fresh poll cycle
      seen.clear();
      allSats.length = 0;
      poll();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, setSatelliteTLEs, setCount]);
}
