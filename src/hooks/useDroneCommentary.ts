"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useModeStore } from '@/stores/modeStore';
import { useMapStore } from '@/stores/mapStore';
import { useAIStore } from '@/stores/aiStore';
import { useHUDStore } from '@/stores/hudStore';

export function useDroneCommentary() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const mode = useModeStore((s) => s.current);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!viewer || !cesium || mode !== 'DRONE') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Generate drone commentary every 30s
    intervalRef.current = setInterval(() => {
      if (!viewer || viewer.isDestroyed()) return;

      const camera = viewer.camera;
      const position = camera.positionCartographic;
      if (!position) return;

      const lat = cesium.Math.toDegrees(position.latitude);
      const lon = cesium.Math.toDegrees(position.longitude);
      const altM = Math.round(position.height);
      const heading = Math.round(cesium.Math.toDegrees(camera.heading));
      const currentCity = useMapStore.getState().currentCity;

      // Add HUD event with drone telemetry
      const event = {
        id: Date.now(),
        time: new Date().toISOString().slice(11, 19) + 'Z',
        text: `DRONE — ALT ${altM}M HDG ${heading}° POS ${lat.toFixed(4)}N ${lon.toFixed(4)}E — ${currentCity.toUpperCase()}`,
        type: 'info' as const,
      };

      const feed = useHUDStore.getState().intelFeed;
      useHUDStore.setState({
        intelFeed: [event, ...feed].slice(0, 12),
      });

      // Update intel brief with drone position
      const brief = `DRONE SURVEILLANCE — ${currentCity.toUpperCase()}\nALT ${altM}M, HDG ${heading}°\nPOSITION ${lat.toFixed(4)}°N ${lon.toFixed(4)}°E\nCONTINUOUS AREA PATROL\nALL SENSORS NOMINAL`;
      useAIStore.getState().setIntelBrief(brief, `UAV-${Math.floor(1000 + Math.random() * 9000)}`);
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [viewer, cesium, mode]);
}
