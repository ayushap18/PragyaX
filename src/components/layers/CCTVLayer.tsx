"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useLayerStore } from '@/stores/layerStore';
import { useMapStore } from '@/stores/mapStore';
import { useAIStore } from '@/stores/aiStore';
import { getCamerasForCity } from '@/constants/cameras';

export default function CCTVLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const enabled = useLayerStore((s) => s.layers.cctv.enabled);
  const setCount = useLayerStore((s) => s.setCount);
  const currentCity = useMapStore((s) => s.currentCity);
  const setSelectedCamera = useAIStore((s) => s.setSelectedCamera);
  const entitiesRef = useRef<Map<string, unknown>>(new Map());

  useEffect(() => {
    if (!viewer || !cesium) return;

    // Remove old entities
    for (const entity of entitiesRef.current.values()) {
      try {
        viewer.entities.remove(entity);
      } catch { /* ignore */ }
    }
    entitiesRef.current.clear();

    if (!enabled) {
      setCount('cctv', 0);
      return;
    }

    const cameras = getCamerasForCity(currentCity);
    setCount('cctv', cameras.length);

    for (const cam of cameras) {
      const entity = viewer.entities.add({
        id: `cctv-${cam.id}`,
        position: cesium.Cartesian3.fromDegrees(cam.lon, cam.lat, 50),
        billboard: {
          image: createCCTVIcon(),
          width: 16,
          height: 16,
          verticalOrigin: cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: cam.label,
          font: '8px monospace',
          fillColor: cesium.Color.fromCssColorString('#FF3333'),
          outlineColor: cesium.Color.BLACK,
          outlineWidth: 2,
          style: cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: cesium.VerticalOrigin.TOP,
          pixelOffset: new cesium.Cartesian2(0, 4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: false,
        },
        properties: {
          type: 'cctv',
          cameraData: cam,
        },
      });

      entitiesRef.current.set(cam.id, entity);
    }

    // Click handler
    const handler = new cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: { x: number; y: number } }) => {
      const picked = viewer.scene.pick(click.position);
      if (picked?.id?.id?.startsWith('cctv-')) {
        const camId = picked.id.id.replace('cctv-', '');
        const cam = cameras.find((c) => c.id === camId);
        if (cam) {
          setSelectedCamera(cam);
        }
      }
    }, cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      for (const entity of entitiesRef.current.values()) {
        try {
          viewer.entities.remove(entity);
        } catch { /* ignore */ }
      }
      entitiesRef.current.clear();
    };
  }, [viewer, cesium, enabled, currentCity, setCount, setSelectedCamera]);

  return null;
}

function createCCTVIcon(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Camera body
  ctx.fillStyle = '#FF3333';
  ctx.fillRect(3, 5, 8, 6);

  // Lens
  ctx.beginPath();
  ctx.moveTo(11, 6);
  ctx.lineTo(14, 4);
  ctx.lineTo(14, 12);
  ctx.lineTo(11, 10);
  ctx.closePath();
  ctx.fill();

  // Recording dot
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(5, 4, 1.5, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL();
}
