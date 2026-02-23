"use client";

import { useEffect, useRef } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { useAIStore } from '@/stores/aiStore';
import { fetchBreadcrumbs } from '@/services/claudeService';

export function useBreadcrumbs() {
  const currentCity = useMapStore((s) => s.currentCity);
  const setBreadcrumbs = useAIStore((s) => s.setBreadcrumbs);
  const lastCityRef = useRef('');

  useEffect(() => {
    if (currentCity === lastCityRef.current) return;
    lastCityRef.current = currentCity;

    let cancelled = false;

    fetchBreadcrumbs(currentCity)
      .then((result) => {
        if (!cancelled && result.breadcrumbs?.length > 0) {
          setBreadcrumbs(result.breadcrumbs);
        }
      })
      .catch(() => {
        // Silently fail — fallback to static landmarks
      });

    return () => {
      cancelled = true;
    };
  }, [currentCity, setBreadcrumbs]);
}
