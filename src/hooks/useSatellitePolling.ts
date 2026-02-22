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
        const data = await fetchSatelliteTLEs('stations');
        setSatelliteTLEs(data.satellites);
        setCount('satellites', data.count);
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
