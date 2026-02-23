"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { getAQIColor } from '@/constants/chanakya';

export default function AQILayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const aqiStations = useDataStore((s) => s.aqiStations);
  const enabled = useLayerStore((s) => s.layers.aqi.enabled);
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
    const showLabels = aqiStations.length < 100;

    for (const station of aqiStations) {
      const entityId = `aqi-${station.id}`;
      currentIds.add(entityId);

      const color = getAQIColor(station.aqi);
      const cesiumColor = cesium.Color.fromCssColorString(color);

      const existing = viewer.entities.getById(entityId);
      if (existing) continue;

      const entityConfig: Record<string, unknown> = {
        id: entityId,
        position: cesium.Cartesian3.fromDegrees(station.lon, station.lat),
        point: {
          pixelSize: 6,
          color: cesiumColor.withAlpha(0.85),
          outlineColor: cesiumColor.withAlpha(0.4),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          type: 'aqi',
          stationName: station.stationName,
          city: station.city,
          state: station.state,
          aqi: station.aqi,
          pm25: station.pm25,
          pm10: station.pm10,
        },
      };

      if (showLabels) {
        entityConfig.label = {
          text: `${station.city} ${station.aqi}`,
          font: '8px JetBrains Mono, monospace',
          fillColor: cesiumColor,
          pixelOffset: new cesium.Cartesian2(10, 0),
          showBackground: true,
          backgroundColor: cesium.Color.BLACK.withAlpha(0.7),
          backgroundPadding: new cesium.Cartesian2(3, 2),
          scale: 0.85,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        };
      }

      viewer.entities.add(entityConfig);
    }

    // Remove stale entities
    entityIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      }
    });
    entityIdsRef.current = currentIds;

    // Update layer count
    useLayerStore.getState().setCount('aqi', aqiStations.length);
  }, [viewer, cesium, aqiStations, enabled]);

  return null;
}
