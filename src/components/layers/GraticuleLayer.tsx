"use client";

import { useEffect, useRef } from "react";
import { useCesiumStore } from "@/stores/cesiumStore";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";

/**
 * Adds lat/lon graticule grid lines to the Cesium globe.
 * Renders as polyline entities every 30° of latitude and longitude.
 */
export default function GraticuleLayer() {
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];
  const entityIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const { viewer, cesium } = useCesiumStore.getState();
    if (!viewer || !cesium || viewer.isDestroyed()) return;

    // Remove previous graticule lines
    for (const id of entityIdsRef.current) {
      const entity = viewer.entities.getById(id);
      if (entity) viewer.entities.remove(entity);
    }
    entityIdsRef.current = [];

    const color = cesium.Color.fromCssColorString(accent).withAlpha(0.12);
    const eqColor = cesium.Color.fromCssColorString(accent).withAlpha(0.25);

    // Latitude lines every 30°
    for (let lat = -60; lat <= 60; lat += 30) {
      const positions: number[] = [];
      for (let lon = -180; lon <= 180; lon += 2) {
        positions.push(lon, lat);
      }
      const id = `graticule-lat-${lat}`;
      viewer.entities.add({
        id,
        polyline: {
          positions: cesium.Cartesian3.fromDegreesArray(positions),
          width: lat === 0 ? 1.5 : 0.8,
          material: lat === 0 ? eqColor : color,
          clampToGround: false,
        },
      });
      entityIdsRef.current.push(id);
    }

    // Longitude lines every 30°
    for (let lon = -180; lon < 180; lon += 30) {
      const positions: number[] = [];
      for (let lat = -90; lat <= 90; lat += 2) {
        positions.push(lon, lat);
      }
      const id = `graticule-lon-${lon}`;
      viewer.entities.add({
        id,
        polyline: {
          positions: cesium.Cartesian3.fromDegreesArray(positions),
          width: lon === 0 ? 1.5 : 0.8,
          material: lon === 0 ? eqColor : color,
          clampToGround: false,
        },
      });
      entityIdsRef.current.push(id);
    }

    return () => {
      if (!viewer.isDestroyed()) {
        for (const id of entityIdsRef.current) {
          const entity = viewer.entities.getById(id);
          if (entity) viewer.entities.remove(entity);
        }
      }
      entityIdsRef.current = [];
    };
  }, [accent]);

  return null;
}
