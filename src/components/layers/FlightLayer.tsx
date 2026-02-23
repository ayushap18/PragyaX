"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { createAircraftCanvas } from '@/utils/cesiumHelpers';

export default function FlightLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const flights = useDataStore((s) => s.flights);
  const enabled = useLayerStore((s) => s.layers.flights.enabled);
  const entityIdsRef = useRef<Set<string>>(new Set());
  const canvasCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!viewer || !cesium) return;

    if (!enabled) {
      // Remove all flight entities
      entityIdsRef.current.forEach((id) => {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      });
      entityIdsRef.current.clear();
      return;
    }

    const currentIds = new Set<string>();

    for (const ac of flights) {
      if (ac.onGround || !ac.lat || !ac.lon) continue;

      const entityId = `flight-${ac.icao24}`;
      currentIds.add(entityId);

      const position = cesium.Cartesian3.fromDegrees(
        ac.lon,
        ac.lat,
        ac.altitudeM
      );

      // Color by altitude: brighter at higher altitude
      const altNorm = Math.min(ac.altitudeFt / 45000, 1);
      const g = Math.round(180 + altNorm * 75);
      const b = Math.round(200 + altNorm * 55);
      const color = `rgba(0, ${g}, ${b}, 0.85)`;

      // Cache canvas images by heading bucket (every 10 degrees)
      const headingBucket = Math.round(ac.heading / 10) * 10;
      const cacheKey = `${headingBucket}-${color}`;
      if (!canvasCacheRef.current.has(cacheKey)) {
        canvasCacheRef.current.set(
          cacheKey,
          createAircraftCanvas(headingBucket, color)
        );
      }
      const image = canvasCacheRef.current.get(cacheKey)!;

      const existing = viewer.entities.getById(entityId);
      if (existing) {
        existing.position.setValue(position);
        if (existing.billboard) {
          existing.billboard.image = image;
        }
      } else {
        viewer.entities.add({
          id: entityId,
          position,
          billboard: {
            image,
            width: 20,
            height: 20,
            verticalOrigin: cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          properties: {
            type: 'flight',
            callsign: ac.callsign,
            altitude: ac.altitudeFt,
            speed: ac.velocityKts,
            origin: ac.originCountry,
            heading: ac.heading,
            squawk: ac.squawk,
          },
        });
      }
    }

    // Remove stale entities
    entityIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      }
    });
    entityIdsRef.current = currentIds;

    // Trigger a frame render
    viewer.scene.requestRender();
  }, [viewer, cesium, flights, enabled]);

  return null;
}
