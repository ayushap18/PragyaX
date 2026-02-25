"use client";

import { useEffect, useRef } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { useTrailStore } from '@/stores/trailStore';
import { useAIStore } from '@/stores/aiStore';
import { createAircraftCanvas } from '@/utils/cesiumHelpers';

export default function FlightLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const flights = useDataStore((s) => s.flights);
  const enabled = useLayerStore((s) => s.layers.flights.enabled);
  const entityIdsRef = useRef<Set<string>>(new Set());
  const trailIdsRef = useRef<Set<string>>(new Set());
  const canvasCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!viewer || !cesium) return;

    if (!enabled) {
      // Remove all flight entities and trails
      entityIdsRef.current.forEach((id) => {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      });
      trailIdsRef.current.forEach((id) => {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      });
      entityIdsRef.current.clear();
      trailIdsRef.current.clear();
      useTrailStore.getState().clearAll();
      return;
    }

    // Check if we have a tracked flight
    const selectedEntity = useAIStore.getState().selectedEntity;
    const trackedIcao = selectedEntity?.type === 'flight' && selectedEntity.data._tracking
      ? (selectedEntity.data.icao24 as string) : null;

    const currentIds = new Set<string>();
    const currentTrailIds = new Set<string>();

    for (const ac of flights) {
      if (ac.onGround || !ac.lat || !ac.lon) continue;

      const entityId = `flight-${ac.icao24}`;
      currentIds.add(entityId);

      const position = cesium.Cartesian3.fromDegrees(
        ac.lon,
        ac.lat,
        ac.altitudeM
      );

      // Push to trail store
      useTrailStore.getState().pushPosition(ac.icao24, ac.lat, ac.lon, ac.altitudeM);

      // Color by altitude: brighter at higher altitude
      const altNorm = Math.min(ac.altitudeFt / 45000, 1);
      const g = Math.round(180 + altNorm * 75);
      const b = Math.round(200 + altNorm * 55);
      const isTracked = trackedIcao === ac.icao24;
      const color = isTracked ? 'rgba(255, 200, 0, 1)' : `rgba(0, ${g}, ${b}, 0.85)`;
      const billboardSize = isTracked ? 36 : 28;

      // Cache canvas images by heading bucket (every 10 degrees)
      const headingBucket = Math.round(ac.heading / 10) * 10;
      const cacheKey = `${headingBucket}-${color}`;
      if (!canvasCacheRef.current.has(cacheKey)) {
        canvasCacheRef.current.set(
          cacheKey,
          createAircraftCanvas(headingBucket, color)
        );
      }
      const image = canvasCacheRef.current.get(cacheKey)!;

      const existing = viewer.entities.getById(entityId);
      if (existing) {
        existing.position.setValue(position);
        if (existing.billboard) {
          existing.billboard.image = image;
          existing.billboard.width = billboardSize;
          existing.billboard.height = billboardSize;
        }
        // Show label for tracked aircraft
        if (existing.label) {
          existing.label.show = isTracked;
        }
      } else {
        viewer.entities.add({
          id: entityId,
          position,
          billboard: {
            image,
            width: billboardSize,
            height: billboardSize,
            verticalOrigin: cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: ac.callsign || ac.icao24,
            font: '10px JetBrains Mono, monospace',
            fillColor: cesium.Color.fromCssColorString(isTracked ? '#FFC800' : `rgba(0, ${g}, ${b}, 0.9)`),
            pixelOffset: new cesium.Cartesian2(0, -22),
            showBackground: true,
            backgroundColor: cesium.Color.BLACK.withAlpha(0.7),
            backgroundPadding: new cesium.Cartesian2(4, 2),
            scale: 0.8,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: isTracked,
          },
          properties: {
            type: 'flight',
            callsign: ac.callsign,
            altitude: ac.altitudeFt,
            speed: ac.velocityKts,
            origin: ac.originCountry,
            heading: ac.heading,
            squawk: ac.squawk,
          },
        });
      }

      // Camera follow for tracked aircraft
      if (isTracked) {
        viewer.camera.flyTo({
          destination: cesium.Cartesian3.fromDegrees(ac.lon, ac.lat, ac.altitudeM + 50000),
          orientation: {
            heading: cesium.Math.toRadians(ac.heading),
            pitch: cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 1.5,
        });
      }

      // Render trail polyline
      const trailData = useTrailStore.getState().trails.get(ac.icao24);
      if (trailData && trailData.length >= 2) {
        const trailId = `trail-${ac.icao24}`;
        currentTrailIds.add(trailId);

        const positions = trailData.map((p) =>
          cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt)
        );

        const trailColor = isTracked
          ? cesium.Color.fromCssColorString('rgba(255, 200, 0, 0.6)')
          : cesium.Color.fromCssColorString(`rgba(0, ${g}, ${b}, 0.4)`);

        const existingTrail = viewer.entities.getById(trailId);
        if (existingTrail) {
          if (existingTrail.polyline) {
            existingTrail.polyline.positions = new cesium.ConstantProperty(positions);
            existingTrail.polyline.material = new cesium.PolylineGlowMaterialProperty({
              glowPower: isTracked ? 0.3 : 0.15,
              color: trailColor,
            });
            existingTrail.polyline.width = isTracked ? 3 : 1.5;
          }
        } else {
          viewer.entities.add({
            id: trailId,
            polyline: {
              positions,
              width: isTracked ? 3 : 1.5,
              material: new cesium.PolylineGlowMaterialProperty({
                glowPower: isTracked ? 0.3 : 0.15,
                color: trailColor,
              }),
            },
          });
        }
      }
    }

    // Remove stale entities
    entityIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
        // Clear trail data for removed aircraft
        const icao24 = id.replace('flight-', '');
        useTrailStore.getState().clearTrail(icao24);
      }
    });
    // Remove stale trail entities
    trailIdsRef.current.forEach((id) => {
      if (!currentTrailIds.has(id)) {
        const entity = viewer.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      }
    });

    entityIdsRef.current = currentIds;
    trailIdsRef.current = currentTrailIds;
  }, [viewer, cesium, flights, enabled]);

  return null;
}
