"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { getMagnitudeColor, getQuakeRadius } from '@/utils/cesiumHelpers';

export default function EarthquakeLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const earthquakes = useDataStore((s) => s.earthquakes);
  const enabled = useLayerStore((s) => s.layers.earthquakes.enabled);
  const entityIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!viewer || !cesium) return;

    if (!enabled) {
      entityIdsRef.current.forEach((id) => {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      });
      entityIdsRef.current.clear();
      return;
    }

    const currentIds = new Set<string>();

    for (const eq of earthquakes) {
      const entityId = `quake-${eq.id}`;
      currentIds.add(entityId);

      const color = getMagnitudeColor(eq.magnitude);
      const radius = getQuakeRadius(eq.magnitude);
      const cesiumColor = cesium.Color.fromCssColorString(color);

      const existing = viewer.entities.getById(entityId);
      if (existing) continue; // Earthquakes don't move, skip update

      viewer.entities.add({
        id: entityId,
        position: cesium.Cartesian3.fromDegrees(eq.lon, eq.lat),
        ellipse: {
          semiMajorAxis: radius,
          semiMinorAxis: radius,
          material: cesiumColor.withAlpha(0.3),
          outline: true,
          outlineColor: cesiumColor.withAlpha(0.8),
          outlineWidth: 1,
          height: 0,
        },
        label: {
          text: `M${eq.magnitude.toFixed(1)}`,
          font: '10px JetBrains Mono, monospace',
          fillColor: cesiumColor,
          pixelOffset: new cesium.Cartesian2(0, -20),
          showBackground: true,
          backgroundColor: cesium.Color.BLACK.withAlpha(0.7),
          backgroundPadding: new cesium.Cartesian2(4, 2),
          scale: 0.8,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          type: 'earthquake',
          magnitude: eq.magnitude,
          place: eq.place,
          depth: eq.depthKm,
          time: eq.timeUtc,
          alertLevel: eq.alertLevel,
          tsunamiRisk: eq.tsunamiRisk,
          url: eq.url,
        },
      });
    }

    // Remove stale entities
    entityIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      }
    });
    entityIdsRef.current = currentIds;

    viewer.scene.requestRender();
  }, [viewer, cesium, earthquakes, enabled]);

  return null;
}
