"use client";

import { useEffect, useRef } from "react";
import { useMapStore } from "@/stores/mapStore";
import { useModeStore } from "@/stores/modeStore";
import { useCesiumStore } from "@/stores/cesiumStore";
import { MODE_FILTERS } from "@/constants/modes";

let Cesium: typeof import("cesium") | null = null;

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InstanceType<typeof import("cesium").Viewer> | null>(null);
  const currentMode = useModeStore((s) => s.current);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let cancelled = false;

    async function initCesium() {
      if (typeof window === "undefined") return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).CESIUM_BASE_URL = "/cesium";

      const cesiumModule = await import("cesium");
      Cesium = cesiumModule;

      if (cancelled || !containerRef.current) return;

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        targetFrameRate: 60,
        shadows: false,
      });

      viewerRef.current = viewer;

      // Expose viewer to cesiumStore for layer components
      useCesiumStore.getState().setViewer(viewer, Cesium);

      // Set black background, remove sky elements
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
      if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
      if (viewer.scene.sun) viewer.scene.sun.show = false;
      if (viewer.scene.moon) viewer.scene.moon.show = false;
      viewer.scene.fog.enabled = false;

      // Remove Cesium credit display
      (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = "none";

      // Try to load Google 3D Tiles, fallback to default imagery
      try {
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (googleApiKey) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (Cesium as any).GoogleMaps = (Cesium as any).GoogleMaps || {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (Cesium as any).GoogleMaps.defaultApiKey = googleApiKey;
        }
        const tileset = await Cesium.createGooglePhotorealistic3DTileset();
        viewer.scene.primitives.add(tileset);
        // Hide the default globe when we have 3D tiles
        viewer.scene.globe.show = false;
      } catch {
        // Fallback: keep default globe with dark theme
        console.warn("Google 3D Tiles not available, using default imagery");
        viewer.scene.globe.enableLighting = false;
      }

      // Camera constraints — keep the globe centered and smooth
      const controller = viewer.scene.screenSpaceCameraController;
      controller.minimumZoomDistance = 200;           // min 200m above surface
      controller.maximumZoomDistance = 40_000_000;    // max 40,000km out
      controller.enableTilt = true;
      controller.enableLook = false;                  // prevent free-look that dislodges globe
      controller.inertiaSpin = 0.9;                   // smooth spin deceleration
      controller.inertiaTranslate = 0.9;              // smooth translate deceleration
      controller.inertiaZoom = 0.85;                  // smooth zoom deceleration
      controller.zoomEventTypes = [
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH,
      ];
      // Slow down the scroll-wheel zoom speed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (controller as any)._zoomFactor = 3;

      // Clamp tilt so camera never goes below horizon (keeps globe visible)
      viewer.scene.postRender.addEventListener(() => {
        if (!Cesium) return;
        const camera = viewer.camera;
        const pitch = camera.pitch;
        // Don't allow pitch above -0.05 radians (~3° from horizontal)
        if (pitch > -0.05) {
          camera.setView({
            orientation: {
              heading: camera.heading,
              pitch: -0.05,
              roll: camera.roll,
            },
          });
        }
      });

      // Fly to Washington DC
      const { lat, lon, altitudeKm, pitch: initPitch } = useMapStore.getState();
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitudeKm * 1000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(initPitch),
          roll: 0,
        },
        duration: 0,
      });
    }

    initCesium();

    return () => {
      cancelled = true;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Subscribe to map store changes for flyTo
  useEffect(() => {
    const unsubscribe = useMapStore.subscribe((state, prevState) => {
      if (
        !viewerRef.current ||
        !Cesium ||
        (state.lat === prevState.lat && state.lon === prevState.lon)
      ) {
        return;
      }

      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          state.lon,
          state.lat,
          state.altitudeKm * 1000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(state.heading),
          pitch: Cesium.Math.toRadians(state.pitch),
          roll: 0,
        },
        duration: 3,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ filter: MODE_FILTERS[currentMode] }}
      />
    </div>
  );
}
