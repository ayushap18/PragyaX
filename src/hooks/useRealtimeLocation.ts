"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMapStore } from "@/stores/mapStore";
import { useCesiumStore } from "@/stores/cesiumStore";
import { useHUDStore } from "@/stores/hudStore";
import { SFX } from "@/utils/audioEngine";

interface GPSState {
  active: boolean;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  error: string | null;
  lastUpdate: number | null;
}

const INITIAL_STATE: GPSState = {
  active: false,
  lat: null,
  lon: null,
  accuracy: null,
  altitude: null,
  heading: null,
  speed: null,
  error: null,
  lastUpdate: null,
};

export function useRealtimeLocation() {
  const [gps, setGps] = useState<GPSState>(INITIAL_STATE);
  const watchIdRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entityRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accuracyEntityRef = useRef<any>(null);
  const isActiveRef = useRef(false);

  const updateMarker = useCallback((lat: number, lon: number, accuracy: number | null) => {
    const { viewer, cesium } = useCesiumStore.getState();
    if (!viewer || !cesium || viewer.isDestroyed()) return;

    // Remove old entities
    if (entityRef.current) {
      viewer.entities.remove(entityRef.current);
      entityRef.current = null;
    }
    if (accuracyEntityRef.current) {
      viewer.entities.remove(accuracyEntityRef.current);
      accuracyEntityRef.current = null;
    }

    // Accuracy circle
    if (accuracy && accuracy > 10) {
      accuracyEntityRef.current = viewer.entities.add({
        position: cesium.Cartesian3.fromDegrees(lon, lat),
        ellipse: {
          semiMajorAxis: Math.max(accuracy, 30),
          semiMinorAxis: Math.max(accuracy, 30),
          material: cesium.Color.CYAN.withAlpha(0.08),
          outline: true,
          outlineColor: cesium.Color.CYAN.withAlpha(0.3),
          outlineWidth: 1,
          height: 0,
        },
      });
    }

    // User position marker
    entityRef.current = viewer.entities.add({
      position: cesium.Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: 14,
        color: cesium.Color.CYAN,
        outlineColor: cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'GPS POSITION',
        font: '10px monospace',
        fillColor: cesium.Color.CYAN,
        outlineColor: cesium.Color.BLACK,
        outlineWidth: 2,
        style: cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new cesium.Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }, []);

  const removeMarker = useCallback(() => {
    const { viewer } = useCesiumStore.getState();
    if (!viewer || viewer.isDestroyed()) return;
    if (entityRef.current) {
      viewer.entities.remove(entityRef.current);
      entityRef.current = null;
    }
    if (accuracyEntityRef.current) {
      viewer.entities.remove(accuracyEntityRef.current);
      accuracyEntityRef.current = null;
    }
  }, []);

  const handlePosition = useCallback(
    (pos: GeolocationPosition, shouldFly: boolean) => {
      const { latitude, longitude, altitude, accuracy, heading, speed } = pos.coords;
      setGps((prev) => ({
        ...prev,
        lat: latitude,
        lon: longitude,
        altitude,
        accuracy,
        heading,
        speed,
        lastUpdate: Date.now(),
      }));

      // Update marker on globe
      updateMarker(latitude, longitude, accuracy);

      // Only fly camera to position when explicitly requested (first lock or recenter)
      if (shouldFly) {
        useMapStore.getState().flyTo(latitude, longitude, 2);
      }
    },
    [updateMarker]
  );

  const activate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGps((prev) => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    SFX.toggle();
    isActiveRef.current = true;
    setGps((prev) => ({ ...prev, active: true, error: null }));

    pushToIntelFeed('GPS: Acquiring satellite fix...');

    // Get initial position and fly to it
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isActiveRef.current) return;
        handlePosition(pos, true);
        const { latitude, longitude, accuracy } = pos.coords;
        pushToIntelFeed(
          `GPS LOCK: ${latitude.toFixed(4)}\u00B0${latitude >= 0 ? 'N' : 'S'} ${Math.abs(longitude).toFixed(4)}\u00B0${longitude >= 0 ? 'E' : 'W'} \u00B1${Math.round(accuracy)}m`
        );
      },
      (err) => {
        if (!isActiveRef.current) return;
        setGps((prev) => ({ ...prev, error: err.message }));
        pushToIntelFeed(`GPS ERROR: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch for realtime updates (marker updates without camera fly)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isActiveRef.current) return;
        handlePosition(pos, false);
      },
      (err) => {
        if (!isActiveRef.current) return;
        setGps((prev) => ({ ...prev, error: err.message }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, [handlePosition]);

  const deactivate = useCallback(() => {
    isActiveRef.current = false;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    removeMarker();
    SFX.toggle();
    setGps(INITIAL_STATE);
    pushToIntelFeed('GPS: Tracking deactivated');
  }, [removeMarker]);

  const toggle = useCallback(() => {
    if (isActiveRef.current) {
      deactivate();
    } else {
      activate();
    }
  }, [activate, deactivate]);

  // Recenter camera on current GPS position
  const recenter = useCallback(() => {
    setGps((prev) => {
      if (prev.lat !== null && prev.lon !== null) {
        SFX.flyTo();
        useMapStore.getState().flyTo(prev.lat, prev.lon, 2);
      }
      return prev;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Remove Cesium entities
      const { viewer } = useCesiumStore.getState();
      if (viewer && !viewer.isDestroyed()) {
        if (entityRef.current) viewer.entities.remove(entityRef.current);
        if (accuracyEntityRef.current) viewer.entities.remove(accuracyEntityRef.current);
      }
      entityRef.current = null;
      accuracyEntityRef.current = null;
    };
  }, []);

  return { gps, toggle, recenter };
}

function pushToIntelFeed(message: string) {
  const { intelFeed } = useHUDStore.getState();
  const newEvent = {
    id: Date.now() + Math.random(),
    time: new Date().toISOString().slice(11, 19) + 'Z',
    text: message,
    type: 'info' as const,
  };
  useHUDStore.setState({
    intelFeed: [newEvent, ...intelFeed].slice(0, 12),
  });
}
