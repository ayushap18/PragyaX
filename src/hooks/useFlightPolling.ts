"use client";

import { useEffect, useRef } from 'react';
import { fetchFlights } from '@/services/flightService';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { useCesiumStore } from '@/stores/cesiumStore';

export function useFlightPolling() {
  const enabled = useLayerStore((s) => s.layers.flights.enabled);
  const setFlights = useDataStore((s) => s.setFlights);
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
        const viewer = useCesiumStore.getState().viewer;
        const cesium = useCesiumStore.getState().cesium;

        let bbox: { lamin: number; lamax: number; lomin: number; lomax: number } | undefined;

        if (viewer && cesium && !viewer.isDestroyed()) {
          try {
            const rect = viewer.camera.computeViewRectangle();
            if (rect) {
              bbox = {
                lamin: cesium.Math.toDegrees(rect.south),
                lamax: cesium.Math.toDegrees(rect.north),
                lomin: cesium.Math.toDegrees(rect.west),
                lomax: cesium.Math.toDegrees(rect.east),
              };
            }
          } catch {
            // Use global if camera rectangle fails
          }
        }

        const data = await fetchFlights(bbox);
        setFlights(data.aircraft);
        setCount('flights', data.count);
      } catch (err) {
        console.warn('Flight poll failed:', err);
      }
    }

    // Initial fetch
    poll();

    // Poll every 10 seconds
    intervalRef.current = setInterval(poll, 10_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, setFlights, setCount]);
}
