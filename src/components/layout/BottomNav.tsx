"use client";

import { useState, useEffect, useRef } from "react";
import { useMapStore } from "@/stores/mapStore";
import { useModeStore } from "@/stores/modeStore";
import { useAIStore } from "@/stores/aiStore";
import { useCesiumStore } from "@/stores/cesiumStore";
import { MODE_ACCENTS } from "@/constants/modes";
import { BOTTOM_MODES } from "@/constants/modes";
import { CITIES } from "@/constants/cities";
import ModeButton from "@/components/ui/ModeButton";
import { SFX } from "@/utils/audioEngine";
import type { VisualMode, Landmark } from "@/types";

export default function BottomNav() {
  const currentCity = useMapStore((s) => s.currentCity);
  const flyTo = useMapStore((s) => s.flyTo);
  const setCity = useMapStore((s) => s.setCity);
  const currentMode = useModeStore((s) => s.current);
  const setMode = useModeStore((s) => s.setMode);
  const setCommandModalOpen = useAIStore((s) => s.setCommandModalOpen);
  const aiBreadcrumbs = useAIStore((s) => s.breadcrumbs);
  const accent = MODE_ACCENTS[currentMode];
  const [animateActive, setAnimateActive] = useState(false);
  const [refsActive, setRefsActive] = useState(false);
  const [activeLandmarkIdx, setActiveLandmarkIdx] = useState(0);
  const animateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeCity = CITIES.find((c) => c.name === currentCity) || CITIES[0];

  // Convert AI breadcrumbs (strings) to Landmark format, or use city landmarks
  const landmarks: Landmark[] = aiBreadcrumbs.length > 0
    ? aiBreadcrumbs.map((name) => ({ name, lat: activeCity.lat, lon: activeCity.lon }))
    : activeCity.landmarks;

  // ANIMATE mode: auto-rotate the globe
  useEffect(() => {
    if (animateActive) {
      animateRef.current = setInterval(() => {
        const { viewer, cesium } = useCesiumStore.getState();
        if (!viewer || !cesium || viewer.isDestroyed()) return;
        viewer.scene.camera.rotate(cesium.Cartesian3.UNIT_Z, 0.002);
      }, 30);
    } else if (animateRef.current) {
      clearInterval(animateRef.current);
      animateRef.current = null;
    }
    return () => {
      if (animateRef.current) clearInterval(animateRef.current);
    };
  }, [animateActive]);

  const handleCityClick = (city: typeof CITIES[number]) => {
    SFX.flyTo();
    setCity(city.name);
    setActiveLandmarkIdx(0);
    flyTo(city.lat, city.lon, 5);
  };

  const handleLandmarkClick = (landmark: Landmark, idx: number) => {
    SFX.flyTo();
    setActiveLandmarkIdx(idx);
    flyTo(landmark.lat, landmark.lon, 1.5);
  };

  const handleModeClick = (m: typeof BOTTOM_MODES[number]) => {
    const isVisualMode = ['NORMAL', 'CRT', 'NVG', 'FLIR', 'DRONE', 'GREEN'].includes(m.mode);
    if (m.mode === 'AI') {
      SFX.commandOpen();
      setCommandModalOpen(true);
    } else if (m.mode === 'ANIMATE') {
      SFX.toggle();
      setAnimateActive((prev) => !prev);
    } else if (m.mode === 'REFS') {
      SFX.toggle();
      setRefsActive((prev) => !prev);
    } else if (isVisualMode) {
      SFX.modeSwitch();
      setMode(m.mode as VisualMode);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 flex h-14 flex-col"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      {/* Row 1: Breadcrumb pills */}
      <div className="flex items-center gap-2 px-3 py-[3px]">
        <span
          className="text-[6px] tracking-[2px]"
          style={{ color: "var(--text-dim)" }}
        >
          LOCATION
        </span>
        {landmarks.map((landmark, i) => (
          <button
            key={landmark.name}
            onClick={() => handleLandmarkClick(landmark, i)}
            className="rounded-sm px-2 py-[2px] text-[7px] transition-colors cursor-pointer hover:brightness-125"
            style={{
              backgroundColor: i === activeLandmarkIdx ? accent : "transparent",
              color: i === activeLandmarkIdx ? "#000" : "var(--text-inactive)",
              border: i === activeLandmarkIdx ? "none" : "1px solid rgba(255,255,255,0.15)",
              fontWeight: i === activeLandmarkIdx ? 700 : 400,
            }}
          >
            {landmark.name}
          </button>
        ))}
      </div>

      {/* Row 2: City tabs */}
      <div className="flex items-center justify-between px-3">
        {CITIES.map((city) => (
          <button
            key={city.name}
            onClick={() => handleCityClick(city)}
            className="flex flex-col items-center gap-[2px]"
          >
            <span
              className="text-[8px]"
              style={{
                color: city.name === currentCity ? "#FFF" : "var(--text-muted)",
              }}
            >
              {city.name}
            </span>
            {city.name === currentCity && (
              <div
                className="h-[2px] w-full rounded-full"
                style={{ backgroundColor: accent }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Row 3: Mode selector */}
      <div className="flex flex-1 items-stretch">
        {BOTTOM_MODES.map((m, i) => {
          const isActive =
            m.mode === 'ANIMATE' ? animateActive :
            m.mode === 'REFS' ? refsActive :
            currentMode === m.mode;
          return (
            <div key={m.mode} className="flex items-stretch">
              {i > 0 && (
                <div className="w-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
              )}
              <ModeButton
                mode={m.mode}
                label={m.label}
                icon={m.icon}
                isActive={isActive}
                onClick={() => handleModeClick(m)}
              />
            </div>
          );
        })}
      </div>

      {/* REFS grid overlay */}
      {refsActive && <GridOverlay accent={accent} />}
    </div>
  );
}

function GridOverlay({ accent }: { accent: string }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[6]"
      style={{
        backgroundImage: `
          linear-gradient(${accent}10 1px, transparent 1px),
          linear-gradient(90deg, ${accent}10 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
      }}
    >
      {/* Coordinate labels at grid intersections */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <span
            key={`${row}-${col}`}
            className="absolute text-[6px] tabular-nums"
            style={{
              top: `${row * 25 + 12}%`,
              left: `${col * 25 + 1}%`,
              color: `${accent}40`,
            }}
          >
            {String.fromCharCode(65 + col)}{row + 1}
          </span>
        ))
      )}
      {/* Crosshair marks at intersections */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 20,
          height: 20,
          borderTop: `1px solid ${accent}30`,
          borderBottom: `1px solid ${accent}30`,
          borderLeft: `1px solid ${accent}30`,
          borderRight: `1px solid ${accent}30`,
        }}
      />
      {/* Distance scale bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1">
        <div className="h-px w-20" style={{ backgroundColor: `${accent}60` }} />
        <span className="text-[6px]" style={{ color: `${accent}60` }}>100KM</span>
        <div className="h-px w-20" style={{ backgroundColor: `${accent}60` }} />
      </div>
    </div>
  );
}
