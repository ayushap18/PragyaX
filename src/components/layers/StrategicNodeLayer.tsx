"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useLayerStore } from '@/stores/layerStore';
import { STRATEGIC_NODES, NODE_TYPE_COLORS } from '@/constants/chanakya';

export default function StrategicNodeLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const enabled = useLayerStore((s) => s.layers.strategic.enabled);
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

    for (const node of STRATEGIC_NODES) {
      const entityId = `strategic-${node.name.replace(/\s+/g, '-').toLowerCase()}`;
      currentIds.add(entityId);

      const existing = viewer.entities.getById(entityId);
      if (existing) continue;

      const color = NODE_TYPE_COLORS[node.type] ?? '#FFFFFF';

      viewer.entities.add({
        id: entityId,
        position: cesium.Cartesian3.fromDegrees(node.lon, node.lat),
        point: {
          pixelSize: 8,
          color: cesium.Color.fromCssColorString(color).withAlpha(0.9),
          outlineColor: cesium.Color.WHITE.withAlpha(0.5),
          outlineWidth: 1,
        },
        label: {
          text: node.name,
          font: '9px JetBrains Mono, monospace',
          fillColor: cesium.Color.fromCssColorString(color),
          pixelOffset: new cesium.Cartesian2(12, 0),
          showBackground: true,
          backgroundColor: cesium.Color.BLACK.withAlpha(0.7),
          backgroundPadding: new cesium.Cartesian2(4, 2),
          scale: 0.8,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          type: 'strategic',
          nodeType: node.type,
          name: node.name,
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
