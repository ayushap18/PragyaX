"use client";

import { useEffect, useRef } from 'react';
import { useVesselStore } from '@/stores/exclusiveStores';
import { fetchVessels } from '@/services/vesselService';

export function useVesselPolling() {
  const setVessels = useVesselStore((s) => s.setVessels);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if vessels layer is enabled (we'll add it to layerStore later)
  // For now, always poll when hook is active
  useEffect(() => {
    function poll() {
      const result = fetchVessels();
      setVessels(result.vessels);
    }

    poll();
    intervalRef.current = setInterval(poll, 30_000); // 30s polling for maritime

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [setVessels]);
}
