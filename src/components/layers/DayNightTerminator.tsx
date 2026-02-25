"use client";

import { useEffect, useRef } from "react";
import { useCesiumStore } from "@/stores/cesiumStore";
import { useLayerStore } from "@/stores/layerStore";

/**
 * Renders night-side shading on the globe using Cesium's built-in
 * enableLighting feature. Also adds city light points on the night side.
 *
 * Uses Cesium's sun lighting system to automatically shade the globe.
 */
export default function DayNightTerminator() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const enabled = useLayerStore((s) => s.layers.weather?.enabled ?? true);
  const entityIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!viewer || !cesium) return;

    // Enable Cesium's built-in globe lighting
    viewer.scene.globe.enableLighting = true;

    // Make the night side darker
    if (viewer.scene.globe.nightFadeOutDistance !== undefined) {
      viewer.scene.globe.nightFadeOutDistance = 1e7;
    }
    if (viewer.scene.globe.nightFadeInDistance !== undefined) {
      viewer.scene.globe.nightFadeInDistance = 5e6;
    }

    // Major world cities for city lights
    const CITIES = [
      // Asia
      { lat: 28.61, lon: 77.21, pop: 30 }, // Delhi
      { lat: 19.08, lon: 72.88, pop: 25 }, // Mumbai
      { lat: 35.69, lon: 139.69, pop: 37 }, // Tokyo
      { lat: 31.23, lon: 121.47, pop: 27 }, // Shanghai
      { lat: 39.90, lon: 116.41, pop: 21 }, // Beijing
      { lat: 37.57, lon: 126.98, pop: 25 }, // Seoul
      { lat: 22.32, lon: 114.17, pop: 7 },  // Hong Kong
      { lat: 1.35, lon: 103.82, pop: 6 },   // Singapore
      { lat: 13.76, lon: 100.50, pop: 15 }, // Bangkok
      { lat: 23.81, lon: 90.41, pop: 22 },  // Dhaka
      { lat: 24.86, lon: 67.01, pop: 15 },  // Karachi
      { lat: 34.05, lon: -118.24, pop: 13 }, // Los Angeles
      // Europe
      { lat: 51.51, lon: -0.13, pop: 9 },   // London
      { lat: 48.86, lon: 2.35, pop: 12 },   // Paris
      { lat: 52.52, lon: 13.41, pop: 6 },   // Berlin
      { lat: 41.90, lon: 12.50, pop: 4 },   // Rome
      { lat: 40.42, lon: -3.70, pop: 7 },   // Madrid
      { lat: 55.76, lon: 37.62, pop: 12 },  // Moscow
      { lat: 59.33, lon: 18.07, pop: 2 },   // Stockholm
      // Americas
      { lat: 40.71, lon: -74.01, pop: 20 }, // New York
      { lat: 41.88, lon: -87.63, pop: 10 }, // Chicago
      { lat: -23.55, lon: -46.63, pop: 22 }, // São Paulo
      { lat: 19.43, lon: -99.13, pop: 22 }, // Mexico City
      { lat: -34.60, lon: -58.38, pop: 15 }, // Buenos Aires
      { lat: 45.50, lon: -73.57, pop: 4 },  // Montreal
      // Africa & Middle East
      { lat: 30.04, lon: 31.24, pop: 20 },  // Cairo
      { lat: -1.29, lon: 36.82, pop: 5 },   // Nairobi
      { lat: 6.52, lon: 3.38, pop: 15 },    // Lagos
      { lat: -33.93, lon: 18.42, pop: 4 },  // Cape Town
      { lat: 25.28, lon: 55.30, pop: 3 },   // Dubai
      { lat: 41.01, lon: 28.98, pop: 15 },  // Istanbul
      // Oceania
      { lat: -33.87, lon: 151.21, pop: 5 }, // Sydney
      { lat: -37.81, lon: 144.96, pop: 5 }, // Melbourne
    ];

    function updateCityLights() {
      if (!viewer || viewer.isDestroyed()) return;

      // Compute sub-solar point
      const now = cesium.JulianDate.now();
      const sunPos = cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(now);
      const sunCartographic = cesium.Cartographic.fromCartesian(
        cesium.Matrix3.multiplyByVector(
          cesium.Transforms.computeIcrfToFixedMatrix(now) || cesium.Matrix3.IDENTITY,
          sunPos,
          new cesium.Cartesian3()
        )
      );
      const sunLat = cesium.Math.toDegrees(sunCartographic.latitude);
      const sunLon = cesium.Math.toDegrees(sunCartographic.longitude);

      // Clean up old city light entities
      entityIdsRef.current.forEach((id) => {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      });
      entityIdsRef.current.clear();

      // Add city lights only on night side
      CITIES.forEach((city, idx) => {
        // Compute angular distance from sub-solar point
        const dLat = ((city.lat - sunLat) * Math.PI) / 180;
        const dLon = ((city.lon - sunLon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((city.lat * Math.PI) / 180) *
            Math.cos((sunLat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const angularDist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const angularDistDeg = (angularDist * 180) / Math.PI;

        // Only show on night side (>90° from sub-solar point)
        // Twilight zone: 80-100° gets reduced brightness
        if (angularDistDeg < 80) return;

        const brightness = angularDistDeg > 100 ? 1.0 : (angularDistDeg - 80) / 20;
        const size = 3 + (city.pop / 37) * 6; // Scale by population
        const alpha = Math.round(brightness * 200);

        const entityId = `citylight-${idx}`;
        entityIdsRef.current.add(entityId);

        viewer.entities.add({
          id: entityId,
          position: cesium.Cartesian3.fromDegrees(city.lon, city.lat, 0),
          point: {
            pixelSize: size,
            color: cesium.Color.fromCssColorString(`rgba(255, 230, 150, ${alpha / 255})`),
            outlineWidth: 0,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new cesium.NearFarScalar(1e5, 1.0, 1e7, 0.3),
          },
        });
      });
    }

    updateCityLights();

    // Update every 60 seconds
    intervalRef.current = setInterval(updateCityLights, 60000);

    return () => {
      // Disable lighting on cleanup
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.globe.enableLighting = false;
      }
      entityIdsRef.current.forEach((id) => {
        if (viewer && !viewer.isDestroyed()) {
          const entity = viewer.entities.getById(id);
          if (entity) viewer.entities.remove(entity);
        }
      });
      entityIdsRef.current.clear();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [viewer, cesium, enabled]);

  return null;
}
