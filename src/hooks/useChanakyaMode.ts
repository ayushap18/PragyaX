"use client";

import { useEffect, useRef } from 'react';
import { useModeStore, CHANAKYA_LAYERS } from '@/stores/modeStore';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useLayerStore } from '@/stores/layerStore';
import { useMapStore } from '@/stores/mapStore';
import type { LayerName } from '@/types';

// India centroid for camera fly-to
const INDIA_CENTER = { lon: 78.9629, lat: 20.5937, altKm: 2800 };

/**
 * Hook that manages Chanakya mode activation/deactivation:
 * - Flies camera to India on activation
 * - Enables India-specific data layers
 * - Restores previous state on deactivation
 */
export function useChanakyaMode() {
  const activeWindow = useModeStore((s) => s.activeWindow);
  const chanakyaActivated = useModeStore((s) => s.chanakyaActivated);
  const prevLayersRef = useRef<Record<string, boolean>>({});
  const wasActiveRef = useRef(false);

  // Handle mode activation/deactivation
  useEffect(() => {
    const isChanakya = activeWindow === 'CHANAKYA';

    if (isChanakya && !wasActiveRef.current) {
      // === ACTIVATING ===

      // 1. Fly camera to India
      const { viewer, cesium } = useCesiumStore.getState();
      if (viewer && cesium && !viewer.isDestroyed()) {
        viewer.camera.flyTo({
          destination: cesium.Cartesian3.fromDegrees(
            INDIA_CENTER.lon,
            INDIA_CENTER.lat,
            INDIA_CENTER.altKm * 1000
          ),
          orientation: {
            heading: cesium.Math.toRadians(0),
            pitch: cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 4,
        });
      }

      // 2. Update map store position
      const { setCity, setPosition } = useMapStore.getState();
      setPosition(INDIA_CENTER.lat, INDIA_CENTER.lon);
      setCity('New Delhi');

      // 3. Save current layer states and enable India layers
      const layerState = useLayerStore.getState();
      const saved: Record<string, boolean> = {};
      for (const layerId of CHANAKYA_LAYERS) {
        saved[layerId] = layerState.layers[layerId as LayerName]?.enabled ?? false;
        if (!layerState.layers[layerId as LayerName]?.enabled) {
          layerState.toggleLayer(layerId as LayerName);
        }
      }
      prevLayersRef.current = saved;
      wasActiveRef.current = true;

    } else if (!isChanakya && wasActiveRef.current) {
      // === DEACTIVATING ===

      // Restore India layers to their original state
      const layerState = useLayerStore.getState();
      for (const layerId of CHANAKYA_LAYERS) {
        const wasEnabled = prevLayersRef.current[layerId] ?? false;
        const isEnabled = layerState.layers[layerId as LayerName]?.enabled ?? false;
        // Toggle if current state differs from saved state
        if (isEnabled !== wasEnabled) {
          layerState.toggleLayer(layerId as LayerName);
        }
      }
      prevLayersRef.current = {};
      wasActiveRef.current = false;
    }
  }, [activeWindow]);

  return { isChanakya: activeWindow === 'CHANAKYA', chanakyaActivated };
}
