"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useLayerStore } from '@/stores/layerStore';
import { INDIA_OUTLINE, LOC_LINE, LAC_LINE } from '@/constants/chanakya';

export default function IndiaBorderLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const enabled = useLayerStore((s) => s.layers.borders.enabled);
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

    // Helper: flatten [lon, lat][] tuples into [lon, lat, lon, lat, ...]
    const flatten = (coords: [number, number][]): number[] =>
      coords.reduce<number[]>((acc, [lon, lat]) => { acc.push(lon, lat); return acc; }, []);

    // --- India national outline ---
    const outlineId = 'india-border-outline';
    currentIds.add(outlineId);
    if (!viewer.entities.getById(outlineId)) {
      viewer.entities.add({
        id: outlineId,
        polyline: {
          positions: cesium.Cartesian3.fromDegreesArray(flatten(INDIA_OUTLINE)),
          width: 2,
          material: cesium.Color.fromCssColorString('#FF9933').withAlpha(0.4),
          clampToGround: true,
        },
      });
    }

    // --- Line of Control (LoC) ---
    const locId = 'india-border-loc';
    currentIds.add(locId);
    if (!viewer.entities.getById(locId)) {
      viewer.entities.add({
        id: locId,
        polyline: {
          positions: cesium.Cartesian3.fromDegreesArray(flatten(LOC_LINE)),
          width: 2,
          material: new cesium.PolylineDashMaterialProperty({
            color: cesium.Color.fromCssColorString('#FFA500').withAlpha(0.6),
            dashLength: 16,
          }),
          clampToGround: true,
        },
      });
    }

    // --- Line of Actual Control (LAC) ---
    const lacId = 'india-border-lac';
    currentIds.add(lacId);
    if (!viewer.entities.getById(lacId)) {
      viewer.entities.add({
        id: lacId,
        polyline: {
          positions: cesium.Cartesian3.fromDegreesArray(flatten(LAC_LINE)),
          width: 2,
          material: new cesium.PolylineDashMaterialProperty({
            color: cesium.Color.fromCssColorString('#FF9933').withAlpha(0.6),
            dashLength: 16,
          }),
          clampToGround: true,
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
  }, [viewer, cesium, enabled]);

  return null;
}
