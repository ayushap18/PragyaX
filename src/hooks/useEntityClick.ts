"use client";

import { useEffect } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useAIStore } from '@/stores/aiStore';
import { useDataStore } from '@/stores/dataStore';

export function useEntityClick() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const setSelectedEntity = useAIStore((s) => s.setSelectedEntity);

  useEffect(() => {
    if (!viewer || !cesium) return;

    const handler = new cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((click: { position: { x: number; y: number } }) => {
      const picked = viewer.scene.pick(click.position);
      if (!picked?.id?.id) return;

      const entityId: string = picked.id.id;

      if (entityId.startsWith('flight-')) {
        const icao24 = entityId.replace('flight-', '');
        const flights = useDataStore.getState().flights;
        const aircraft = flights.find((f) => f.icao24 === icao24);
        if (aircraft) {
          setSelectedEntity({
            type: 'flight',
            data: aircraft as unknown as Record<string, unknown>,
          });
        }
      } else if (entityId.startsWith('quake-')) {
        const quakeId = entityId.replace('quake-', '');
        const earthquakes = useDataStore.getState().earthquakes;
        const quake = earthquakes.find((e) => e.id === quakeId);
        if (quake) {
          setSelectedEntity({
            type: 'earthquake',
            data: quake as unknown as Record<string, unknown>,
          });
        }
      } else if (entityId.startsWith('sat-')) {
        const noradId = parseInt(entityId.replace('sat-', ''), 10);
        const sats = useDataStore.getState().satelliteTLEs;
        const sat = sats.find((s) => s.noradId === noradId);
        if (sat) {
          setSelectedEntity({
            type: 'satellite',
            data: sat as unknown as Record<string, unknown>,
          });
        }
      }
      // CCTV clicks are handled in CCTVLayer
    }, cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [viewer, cesium, setSelectedEntity]);
}
