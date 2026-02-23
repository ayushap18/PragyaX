"use client";

import { useEffect } from 'react';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useModeStore } from '@/stores/modeStore';

export function useDroneControls() {
  const viewer = useCesiumStore((s) => s.viewer);
  const cesium = useCesiumStore((s) => s.cesium);
  const mode = useModeStore((s) => s.current);

  useEffect(() => {
    if (!viewer || !cesium || mode !== 'DRONE') return;

    // Enter drone mode: fly to low altitude with angled camera
    const camera = viewer.camera;
    const position = camera.positionCartographic;
    if (position) {
      camera.flyTo({
        destination: cesium.Cartesian3.fromRadians(
          position.longitude,
          position.latitude,
          300 // 300m altitude
        ),
        orientation: {
          heading: camera.heading,
          pitch: cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration: 2,
      });
    }

    const moveSpeed = 5; // meters per tick
    const rotateSpeed = 0.01; // radians per tick
    const activeKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      activeKeys.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const tickInterval = setInterval(() => {
      if (!viewer || viewer.isDestroyed()) return;

      if (activeKeys.has('w')) {
        camera.moveForward(moveSpeed);
      }
      if (activeKeys.has('s')) {
        camera.moveBackward(moveSpeed);
      }
      if (activeKeys.has('a')) {
        camera.moveLeft(moveSpeed);
      }
      if (activeKeys.has('d')) {
        camera.moveRight(moveSpeed);
      }
      if (activeKeys.has('q')) {
        camera.rotateLeft(rotateSpeed);
      }
      if (activeKeys.has('e')) {
        camera.rotateRight(rotateSpeed);
      }
      if (activeKeys.has('r')) {
        camera.moveUp(moveSpeed);
      }
      if (activeKeys.has('f')) {
        camera.moveDown(moveSpeed);
      }
    }, 16); // ~60fps

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(tickInterval);
    };
  }, [viewer, cesium, mode]);
}
