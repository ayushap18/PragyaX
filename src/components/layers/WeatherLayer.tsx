"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useLayerStore } from '@/stores/layerStore';
import { getWeatherTileUrl } from '@/services/weatherService';

export default function WeatherLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const enabled = useLayerStore((s) => s.layers.weather.enabled);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!viewer || !cesium) return;

    if (!enabled) {
      if (layerRef.current) {
        try {
          viewer.imageryLayers.remove(layerRef.current);
        } catch {
          // Already removed
        }
        layerRef.current = null;
      }
      return;
    }

    // Don't add if already added
    if (layerRef.current) return;

    try {
      const provider = new cesium.UrlTemplateImageryProvider({
        url: getWeatherTileUrl('precipitation_new'),
        minimumLevel: 0,
        maximumLevel: 12,
        tileWidth: 256,
        tileHeight: 256,
      });

      const layer = viewer.imageryLayers.addImageryProvider(provider);
      layer.alpha = 0.5;
      layerRef.current = layer;
    } catch {
      console.warn('Failed to add weather layer');
    }

    return () => {
      if (layerRef.current && viewer && !viewer.isDestroyed()) {
        try {
          viewer.imageryLayers.remove(layerRef.current);
        } catch {
          // Already destroyed
        }
        layerRef.current = null;
      }
    };
  }, [viewer, cesium, enabled]);

  return null;
}
