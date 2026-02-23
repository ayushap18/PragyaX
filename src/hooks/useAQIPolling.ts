"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { useModeStore } from '@/stores/modeStore';
import type { AQIStation } from '@/types';

const AQI_POLL_INTERVAL = 60 * 60 * 1000; // 1 hour

export function useAQIPolling() {
  const activeWindow = useModeStore((s) => s.activeWindow);
  const setAQIStations = useDataStore((s) => s.setAQIStations);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAQI = useCallback(async () => {
    try {
      const res = await fetch('/api/india/aqi');
      if (!res.ok) return;
      const data = await res.json();
      if (data.stations && Array.isArray(data.stations)) {
        setAQIStations(data.stations as AQIStation[]);
      }
    } catch {
      // Silently fail — will retry on next interval
    }
  }, [setAQIStations]);

  useEffect(() => {
    if (activeWindow !== 'CHANAKYA') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch immediately if stale (check via store snapshot, not reactive dep)
    const lastFetch = useDataStore.getState().lastAQIFetch;
    if (Date.now() - lastFetch > AQI_POLL_INTERVAL) {
      fetchAQI();
    }

    intervalRef.current = setInterval(fetchAQI, AQI_POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeWindow, fetchAQI]);
}
