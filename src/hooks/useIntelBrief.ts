"use client";

import { useEffect, useRef } from 'react';
import { generateIntelBrief } from '@/services/claudeService';
import { useMapStore } from '@/stores/mapStore';
import { useModeStore } from '@/stores/modeStore';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { useAIStore } from '@/stores/aiStore';

export function useIntelBrief() {
  const lat = useMapStore((s) => s.lat);
  const lon = useMapStore((s) => s.lon);
  const altitudeKm = useMapStore((s) => s.altitudeKm);
  const mode = useModeStore((s) => s.current);
  const setIntelBrief = useAIStore((s) => s.setIntelBrief);
  const setGenerating = useAIStore((s) => s.setGeneratingBrief);
  const setBriefError = useAIStore((s) => s.setBriefError);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef(true);

  useEffect(() => {
    // Skip the initial render debounce — generate immediately on first city
    const delay = initialRef.current ? 5000 : 30000;
    initialRef.current = false;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setGenerating(true);
      try {
        const flights = useDataStore.getState().flights;
        const earthquakes = useDataStore.getState().earthquakes;
        const satelliteTLEs = useDataStore.getState().satelliteTLEs;
        const layers = useLayerStore.getState().layers;
        const activeLayers = Object.entries(layers)
          .filter(([, v]) => v.enabled)
          .map(([k]) => k);

        // Find nearest earthquake
        let nearestQuake: { magnitude: number; place: string; distanceKm: number } | null = null;
        if (earthquakes.length > 0) {
          let minDist = Infinity;
          for (const eq of earthquakes) {
            const dlat = eq.lat - lat;
            const dlon = eq.lon - lon;
            const dist = Math.sqrt(dlat * dlat + dlon * dlon) * 111; // rough km
            if (dist < minDist) {
              minDist = dist;
              nearestQuake = {
                magnitude: eq.magnitude,
                place: eq.place,
                distanceKm: Math.round(dist),
              };
            }
          }
        }

        const result = await generateIntelBrief({
          lat,
          lon,
          altitudeKm,
          currentMode: mode,
          activeLayers,
          aircraftCount: flights.length,
          satelliteCount: satelliteTLEs.length,
          nearestQuake,
          weatherSummary: 'Clear',
          utcTimestamp: new Date().toISOString(),
        });

        setIntelBrief(result.brief, result.missionId);
      } catch (err) {
        console.warn('Intel brief generation failed:', err);
        setBriefError(err instanceof Error ? err.message : 'Failed');
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [lat, lon, mode, altitudeKm, setIntelBrief, setGenerating, setBriefError]);
}
