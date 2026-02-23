"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useLayerStore } from '@/stores/layerStore';
import { useModeStore } from '@/stores/modeStore';
import { STRATEGIC_NODES, NODE_TYPE_COLORS } from '@/constants/chanakya';

const THREAT_RADIUS: Record<string, number> = {
  military: 200000,
  naval: 150000,
  nuclear: 150000,
  space: 100000,
  research: 80000,
  intelligence: 100000,
};

const THREAT_COLORS: Record<string, string> = {
  military: 'rgba(255, 68, 68, 0.05)',
  naval: 'rgba(68, 136, 255, 0.05)',
  nuclear: 'rgba(200, 60, 200, 0.05)',
  space: 'rgba(0, 255, 170, 0.04)',
  research: 'rgba(255, 221, 0, 0.04)',
  intelligence: 'rgba(255, 153, 51, 0.05)',
};

export default function StrategicNodeLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const enabled = useLayerStore((s) => s.layers.strategic.enabled);
  const activeWindow = useModeStore((s) => s.activeWindow);
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

    const isChanakya = activeWindow === 'CHANAKYA';
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

      // Add threat radius ellipse in Chanakya mode
      if (isChanakya && THREAT_RADIUS[node.type]) {
        const radiusId = `threat-radius-${node.name.replace(/\s+/g, '-').toLowerCase()}`;
        currentIds.add(radiusId);

        const threatColor = THREAT_COLORS[node.type] || 'rgba(255,255,255,0.03)';

        viewer.entities.add({
          id: radiusId,
          position: cesium.Cartesian3.fromDegrees(node.lon, node.lat),
          ellipse: {
            semiMajorAxis: THREAT_RADIUS[node.type],
            semiMinorAxis: THREAT_RADIUS[node.type],
            material: cesium.Color.fromCssColorString(threatColor),
            outline: true,
            outlineColor: cesium.Color.fromCssColorString(color).withAlpha(0.15),
            outlineWidth: 1,
            height: 0,
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
  }, [viewer, cesium, enabled, activeWindow]);

  return null;
}
