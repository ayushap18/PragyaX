"use client";

import { useEffect, useRef } from "react";
import { useCesiumStore } from "@/stores/cesiumStore";
import { useLayerStore } from "@/stores/layerStore";

/**
 * Google Maps traffic tile layer on the Cesium globe.
 * Uses the Google Maps tile API with the NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export default function TrafficLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const enabled = useLayerStore((s) => s.layers.traffic.enabled);
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

    if (layerRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("TrafficLayer: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set");
      return;
    }

    try {
      const provider = new cesium.UrlTemplateImageryProvider({
        url: `https://maps.googleapis.com/maps/api/staticmap?center={y},{x}&zoom={z}&size=256x256&maptype=roadmap&style=feature:all|element:geometry|color:0x000000&style=feature:all|element:labels|visibility:off&style=feature:road|element:geometry|color:0x111111&layer=traffic&key=${apiKey}&format=png`,
        minimumLevel: 3,
        maximumLevel: 16,
        tileWidth: 256,
        tileHeight: 256,
      });

      const layer = viewer.imageryLayers.addImageryProvider(provider);
      layer.alpha = 0.7;
      layerRef.current = layer;
    } catch {
      // Fallback: use a simple traffic-styled tile approach
      console.warn("Failed to add Google traffic layer, trying fallback");
      try {
        const provider = new cesium.UrlTemplateImageryProvider({
          url: `https://mt1.google.com/vt/lyrs=traffic&x={x}&y={y}&z={z}`,
          minimumLevel: 3,
          maximumLevel: 18,
          tileWidth: 256,
          tileHeight: 256,
        });

        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.alpha = 0.6;
        layerRef.current = layer;
      } catch {
        console.warn("Failed to add traffic layer");
      }
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
