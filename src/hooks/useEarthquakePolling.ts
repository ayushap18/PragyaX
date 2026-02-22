"use client";

import { useEffect, useRef } from 'react';
import { fetchEarthquakes } from '@/services/earthquakeService';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';

export function useEarthquakePolling() {
  const enabled = useLayerStore((s) => s.layers.earthquakes.enabled);
  const setEarthquakes = useDataStore((s) => s.setEarthquakes);
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
        const data = await fetchEarthquakes(2.0, 24);
        setEarthquakes(data.earthquakes);
        setCount('earthquakes', data.count);
      } catch (err) {
        console.warn('Earthquake poll failed:', err);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 300_000); // 5 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, setEarthquakes, setCount]);
}
