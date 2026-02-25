"use client";

import { useEffect } from "react";
import { useModeStore } from "@/stores/modeStore";
import { useLayerStore } from "@/stores/layerStore";
import { useAIStore } from "@/stores/aiStore";
import { useCesiumStore } from "@/stores/cesiumStore";
import { SFX } from "@/utils/audioEngine";
import type { VisualMode } from "@/types";

const MODE_KEYS: Record<string, VisualMode> = {
  '1': 'NORMAL',
  '2': 'CRT',
  '3': 'NVG',
  '4': 'FLIR',
  '5': 'GREEN',
  '6': 'DRONE',
};

let isAutoRotating = false;

export function useKeyboardShortcuts(booted: boolean, showShortcuts: boolean, setShowShortcuts: (v: boolean) => void, onToggleGPS?: () => void) {
  useEffect(() => {
    if (!booted) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Skip when user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      const key = e.key;

      // Mode switching: 1-6
      if (MODE_KEYS[key]) {
        e.preventDefault();
        SFX.click();
        useModeStore.getState().setMode(MODE_KEYS[key]);
        return;
      }

      // Toggle Chanakya
      if (key === 'c' || key === 'C') {
        if (e.ctrlKey || e.metaKey) return; // Don't interfere with Ctrl+C
        e.preventDefault();
        SFX.modeSwitch();
        const { activeWindow, activateChanakya, deactivateChanakya } = useModeStore.getState();
        if (activeWindow === 'CHANAKYA') {
          deactivateChanakya();
        } else {
          activateChanakya();
        }
        return;
      }

      // Layer toggles
      if (key === 'f' || key === 'F') {
        e.preventDefault();
        SFX.toggle();
        useLayerStore.getState().toggleLayer('flights');
        return;
      }
      if (key === 's' || key === 'S') {
        e.preventDefault();
        SFX.toggle();
        useLayerStore.getState().toggleLayer('satellites');
        return;
      }
      if (key === 'e' || key === 'E') {
        e.preventDefault();
        SFX.toggle();
        useLayerStore.getState().toggleLayer('earthquakes');
        return;
      }

      // Toggle GPS realtime location
      if (key === 'g' || key === 'G') {
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        onToggleGPS?.();
        return;
      }

      // Auto-rotate globe
      if (key === ' ') {
        e.preventDefault();
        SFX.click();
        const { viewer, cesium } = useCesiumStore.getState();
        if (viewer && cesium && !viewer.isDestroyed()) {
          isAutoRotating = !isAutoRotating;
          if (isAutoRotating) {
            viewer.clock.onTick.addEventListener(spinGlobe);
          } else {
            viewer.clock.onTick.removeEventListener(spinGlobe);
          }
        }
        return;
      }

      // Close modals
      if (key === 'Escape') {
        const aiStore = useAIStore.getState();
        if (aiStore.commandModalOpen) {
          aiStore.setCommandModalOpen(false);
          SFX.click();
        }
        if (showShortcuts) {
          setShowShortcuts(false);
          SFX.click();
        }
        return;
      }

      // Show shortcut overlay
      if (key === '?' || key === '/') {
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        SFX.click();
        setShowShortcuts(!showShortcuts);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Clean up auto-rotate if active
      if (isAutoRotating) {
        const { viewer } = useCesiumStore.getState();
        if (viewer && !viewer.isDestroyed()) {
          viewer.clock.onTick.removeEventListener(spinGlobe);
        }
        isAutoRotating = false;
      }
    };
  }, [booted, showShortcuts, setShowShortcuts, onToggleGPS]);
}

function spinGlobe() {
  const { viewer, cesium } = useCesiumStore.getState();
  if (!viewer || !cesium || viewer.isDestroyed()) return;
  viewer.camera.rotate(cesium.Cartesian3.UNIT_Z, -0.002);
}
