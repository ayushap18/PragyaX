"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { ISRO_SATELLITE_PATTERNS } from '@/constants/chanakya';

function isISROSatellite(name: string): boolean {
  const upper = name.toUpperCase();
  return ISRO_SATELLITE_PATTERNS.some((p) => upper.includes(p));
}

function isNavIC(name: string): boolean {
  const upper = name.toUpperCase();
  return upper.includes('IRNSS') || upper.includes('NAVIC');
}

export default function ISROSatelliteLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const satelliteTLEs = useDataStore((s) => s.satelliteTLEs);
  const enabled = useLayerStore((s) => s.layers.isro.enabled);
  const entityIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tlesRef = useRef(satelliteTLEs);
  tlesRef.current = satelliteTLEs;

  useEffect(() => {
    if (!viewer || !cesium) return;

    if (!enabled) {
      entityIdsRef.current.forEach((id) => {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      });
      entityIdsRef.current.clear();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    async function updatePositions() {
      let satellite: any;
      try {
        satellite = await import('satellite.js');
      } catch {
        return;
      }

      const tle = tlesRef.current;
      const isroTLEs = tle.filter((t) => isISROSatellite(t.name));
      const currentIds = new Set<string>();
      const now = new Date();

      for (const t of isroTLEs) {
        const entityId = `isro-sat-${t.noradId}`;
        currentIds.add(entityId);

        try {
          const satrec = satellite.twoline2satrec(t.tleLine1, t.tleLine2);
          const posAndVel = satellite.propagate(satrec, now);
          const posEci = posAndVel.position;
          if (!posEci || typeof posEci === 'boolean') continue;

          const gmst = satellite.gstime(now);
          const posGd = satellite.eciToGeodetic(posEci as any, gmst);
          const lon = satellite.degreesLong(posGd.longitude);
          const lat = satellite.degreesLat(posGd.latitude);
          const alt = posGd.height * 1000; // km to m

          const navic = isNavIC(t.name);
          const color = navic ? '#0000CD' : '#FF9933';
          const size = navic ? 7 : 6;
          const cesiumColor = cesium.Color.fromCssColorString(color);

          const existing = viewer.entities.getById(entityId);
          if (existing) {
            existing.position = cesium.Cartesian3.fromDegrees(lon, lat, alt);
          } else {
            viewer.entities.add({
              id: entityId,
              position: cesium.Cartesian3.fromDegrees(lon, lat, alt),
              point: {
                pixelSize: size,
                color: cesiumColor.withAlpha(0.9),
                outlineColor: cesium.Color.WHITE.withAlpha(0.4),
                outlineWidth: 1,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
              label: {
                text: t.name,
                font: '8px JetBrains Mono, monospace',
                fillColor: cesiumColor,
                pixelOffset: new cesium.Cartesian2(10, 0),
                showBackground: true,
                backgroundColor: cesium.Color.BLACK.withAlpha(0.7),
                backgroundPadding: new cesium.Cartesian2(3, 2),
                scale: 0.9,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
              properties: {
                type: 'isro-satellite',
                name: t.name,
                noradId: t.noradId,
                isNavIC: navic,
              },
            });
          }
        } catch {
          // skip satellites with bad TLEs
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

      // Update layer count
      useLayerStore.getState().setCount('isro', currentIds.size);
    }

    updatePositions();
    intervalRef.current = setInterval(updatePositions, 30000); // update positions every 30s

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [viewer, cesium, enabled, satelliteTLEs]);

  return null;
}
