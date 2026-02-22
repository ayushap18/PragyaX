"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { computeSatellitePosition } from '@/services/satelliteService';
import type { SatelliteTLE } from '@/types';

export default function SatelliteLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const satelliteTLEs = useDataStore((s) => s.satelliteTLEs);
  const enabled = useLayerStore((s) => s.layers.satellites.enabled);
  const entityIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tlesRef = useRef<SatelliteTLE[]>([]);

  // Keep a ref to TLEs for the interval callback
  useEffect(() => {
    tlesRef.current = satelliteTLEs;
  }, [satelliteTLEs]);

  useEffect(() => {
    if (!viewer || !cesium) return;

    if (!enabled || satelliteTLEs.length === 0) {
      // Clean up entities and interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      entityIdsRef.current.forEach((id) => {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      });
      entityIdsRef.current.clear();
      return;
    }

    // Create entities for all satellites
    for (const sat of satelliteTLEs) {
      const entityId = `sat-${sat.noradId}`;
      if (!entityIdsRef.current.has(entityId)) {
        entityIdsRef.current.add(entityId);
        viewer.entities.add({
          id: entityId,
          position: cesium.Cartesian3.fromDegrees(0, 0, 400000), // temp position
          point: {
            pixelSize: 5,
            color: cesium.Color.fromCssColorString('#FFA500'),
            outlineColor: cesium.Color.fromCssColorString('#FFA50060'),
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: sat.name,
            font: '9px JetBrains Mono, monospace',
            fillColor: cesium.Color.fromCssColorString('#FFA500'),
            pixelOffset: new cesium.Cartesian2(8, -4),
            showBackground: true,
            backgroundColor: cesium.Color.BLACK.withAlpha(0.6),
            backgroundPadding: new cesium.Cartesian2(3, 2),
            scale: 0.7,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: false, // Show on hover/zoom only
          },
          properties: {
            type: 'satellite',
            name: sat.name,
            noradId: sat.noradId,
            orbitType: sat.orbitType,
            inclination: sat.inclination,
            intlDesignator: sat.intlDesignator,
          },
        });
      }
    }

    // Position update loop
    async function updatePositions() {
      const now = new Date();
      const tles = tlesRef.current;

      for (const sat of tles) {
        const entityId = `sat-${sat.noradId}`;
        const entity = viewer.entities.getById(entityId);
        if (!entity) continue;

        try {
          const pos = await computeSatellitePosition(
            sat.tleLine1,
            sat.tleLine2,
            now
          );
          if (pos) {
            entity.position.setValue(
              cesium.Cartesian3.fromDegrees(
                pos.lon,
                pos.lat,
                pos.altitudeKm * 1000
              )
            );
          }
        } catch {
          // Skip failed propagations
        }
      }
    }

    // Initial update
    updatePositions();

    // Update every second
    intervalRef.current = setInterval(updatePositions, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [viewer, cesium, satelliteTLEs, enabled]);

  return null;
}
