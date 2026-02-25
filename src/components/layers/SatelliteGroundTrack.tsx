"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCesiumStore } from "@/stores/cesiumStore";
import { useAIStore } from "@/stores/aiStore";
import { computeSatellitePosition } from "@/services/satelliteService";

/**
 * Renders orbital ground tracks for the currently selected satellite.
 * Shows: past track (fading), current position (bright), future track (dashed).
 * Also renders a ground footprint circle showing coverage area.
 */
export default function SatelliteGroundTrack() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const selectedEntity = useAIStore((s) => s.selectedEntity);
  const entityIdsRef = useRef<Set<string>>(new Set());
  const computeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupEntities = useCallback(() => {
    if (!viewer) return;
    entityIdsRef.current.forEach((id) => {
      const entity = viewer.entities.getById(id);
      if (entity) viewer.entities.remove(entity);
    });
    entityIdsRef.current.clear();
  }, [viewer]);

  useEffect(() => {
    if (!viewer || !cesium) return;

    // Only show ground tracks for selected satellites
    if (!selectedEntity || selectedEntity.type !== "satellite") {
      cleanupEntities();
      return;
    }

    const { data } = selectedEntity;
    const tleLine1 = data.tleLine1 as string;
    const tleLine2 = data.tleLine2 as string;
    const satName = data.name as string;
    const altKm = data.altitudeKm as number | undefined;

    if (!tleLine1 || !tleLine2) {
      cleanupEntities();
      return;
    }

    async function computeGroundTrack() {
      cleanupEntities();

      const now = new Date();
      const orbitPeriodMin = data.meanMotion
        ? 1440 / (data.meanMotion as number)
        : 90; // default ~90 min for LEO

      // Compute positions for 1.5 orbits into the past and future
      const pastMinutes = Math.floor(orbitPeriodMin * 0.75);
      const futureMinutes = Math.floor(orbitPeriodMin * 1.5);
      const stepMinutes = 1; // 1-minute resolution

      const pastPositions: { lat: number; lon: number; alt: number }[] = [];
      const futurePositions: { lat: number; lon: number; alt: number }[] = [];

      // Compute past track
      for (let m = -pastMinutes; m <= 0; m += stepMinutes) {
        const t = new Date(now.getTime() + m * 60000);
        try {
          const pos = await computeSatellitePosition(tleLine1, tleLine2, t);
          if (pos) {
            pastPositions.push({ lat: pos.lat, lon: pos.lon, alt: pos.altitudeKm * 1000 });
          }
        } catch {
          // Skip failed propagations
        }
      }

      // Compute future track
      for (let m = 0; m <= futureMinutes; m += stepMinutes) {
        const t = new Date(now.getTime() + m * 60000);
        try {
          const pos = await computeSatellitePosition(tleLine1, tleLine2, t);
          if (pos) {
            futurePositions.push({ lat: pos.lat, lon: pos.lon, alt: pos.altitudeKm * 1000 });
          }
        } catch {
          // Skip failed propagations
        }
      }

      if (!viewer || viewer.isDestroyed()) return;

      // Split tracks at antimeridian crossings to avoid lines going the wrong way
      const splitTrack = (positions: { lat: number; lon: number; alt: number }[]) => {
        const segments: { lat: number; lon: number; alt: number }[][] = [];
        let current: { lat: number; lon: number; alt: number }[] = [];

        for (let i = 0; i < positions.length; i++) {
          if (i > 0 && Math.abs(positions[i].lon - positions[i - 1].lon) > 180) {
            if (current.length > 1) segments.push(current);
            current = [];
          }
          current.push(positions[i]);
        }
        if (current.length > 1) segments.push(current);
        return segments;
      };

      // Render past track segments (fading orange)
      const pastSegments = splitTrack(pastPositions);
      pastSegments.forEach((seg, idx) => {
        const pastId = `groundtrack-past-${idx}`;
        entityIdsRef.current.add(pastId);
        const positions = seg.map((p) =>
          cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt)
        );
        viewer.entities.add({
          id: pastId,
          polyline: {
            positions,
            width: 1.5,
            material: new cesium.PolylineGlowMaterialProperty({
              glowPower: 0.1,
              color: cesium.Color.fromCssColorString("rgba(255, 165, 0, 0.35)"),
            }),
          },
        });
      });

      // Render future track segments (dashed cyan)
      const futureSegments = splitTrack(futurePositions);
      futureSegments.forEach((seg, idx) => {
        const futureId = `groundtrack-future-${idx}`;
        entityIdsRef.current.add(futureId);
        const positions = seg.map((p) =>
          cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt)
        );
        viewer.entities.add({
          id: futureId,
          polyline: {
            positions,
            width: 2,
            material: new cesium.PolylineDashMaterialProperty({
              color: cesium.Color.fromCssColorString("rgba(0, 255, 209, 0.5)"),
              dashLength: 16,
              dashPattern: 255,
            }),
          },
        });
      });

      // Render ground footprint circle at current position
      const currentPos = futurePositions[0];
      if (currentPos) {
        const footprintId = "groundtrack-footprint";
        entityIdsRef.current.add(footprintId);

        // Compute footprint radius based on altitude
        // Simplified: footprint radius ≈ Earth radius * arccos(R / (R + h))
        const earthRadiusKm = 6371;
        const altitudeKm = altKm || currentPos.alt / 1000;
        const footprintRadiusKm =
          earthRadiusKm *
          Math.acos(earthRadiusKm / (earthRadiusKm + altitudeKm));
        const footprintRadiusM = footprintRadiusKm * 1000;

        viewer.entities.add({
          id: footprintId,
          position: cesium.Cartesian3.fromDegrees(
            currentPos.lon,
            currentPos.lat,
            0
          ),
          ellipse: {
            semiMajorAxis: footprintRadiusM,
            semiMinorAxis: footprintRadiusM,
            material: cesium.Color.fromCssColorString("rgba(255, 165, 0, 0.06)"),
            outline: true,
            outlineColor: cesium.Color.fromCssColorString(
              "rgba(255, 165, 0, 0.25)"
            ),
            outlineWidth: 1,
            height: 0,
          },
        });

        // Label for the footprint
        const labelId = "groundtrack-label";
        entityIdsRef.current.add(labelId);
        viewer.entities.add({
          id: labelId,
          position: cesium.Cartesian3.fromDegrees(
            currentPos.lon,
            currentPos.lat,
            currentPos.alt
          ),
          label: {
            text: `${satName}\nALT: ${Math.round(altitudeKm)}km | FOV: ${Math.round(footprintRadiusKm * 2)}km`,
            font: "9px JetBrains Mono, monospace",
            fillColor: cesium.Color.fromCssColorString("#FFA500"),
            pixelOffset: new cesium.Cartesian2(0, -30),
            showBackground: true,
            backgroundColor: cesium.Color.BLACK.withAlpha(0.7),
            backgroundPadding: new cesium.Cartesian2(6, 4),
            scale: 0.8,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: true,
          },
        });
      }
    }

    computeGroundTrack();

    // Recompute every 60 seconds
    computeTimeoutRef.current = setInterval(() => {
      computeGroundTrack();
    }, 60000);

    return () => {
      cleanupEntities();
      if (computeTimeoutRef.current) {
        clearInterval(computeTimeoutRef.current);
        computeTimeoutRef.current = null;
      }
    };
  }, [viewer, cesium, selectedEntity, cleanupEntities]);

  return null;
}
