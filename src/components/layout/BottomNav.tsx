"use client";

import { useMapStore } from "@/stores/mapStore";
import { useModeStore } from "@/stores/modeStore";
import { useAIStore } from "@/stores/aiStore";
import { MODE_ACCENTS } from "@/constants/modes";
import { BOTTOM_MODES } from "@/constants/modes";
import { CITIES } from "@/constants/cities";
import ModeButton from "@/components/ui/ModeButton";
import type { VisualMode } from "@/types";

export default function BottomNav() {
  const currentCity = useMapStore((s) => s.currentCity);
  const flyTo = useMapStore((s) => s.flyTo);
  const setCity = useMapStore((s) => s.setCity);
  const currentMode = useModeStore((s) => s.current);
  const setMode = useModeStore((s) => s.setMode);
  const setCommandModalOpen = useAIStore((s) => s.setCommandModalOpen);
  const aiBreadcrumbs = useAIStore((s) => s.breadcrumbs);
  const accent = MODE_ACCENTS[currentMode];

  const activeCity = CITIES.find((c) => c.name === currentCity) || CITIES[0];
  const breadcrumbs = aiBreadcrumbs.length > 0 ? aiBreadcrumbs : activeCity.landmarks;

  const handleCityClick = (city: typeof CITIES[number]) => {
    setCity(city.name);
    flyTo(city.lat, city.lon, 5);
  };

  const handleLandmarkClick = (landmark: string) => {
    // Just visual feedback — the landmark coordinates would need a geocoder in production
    // For now we just fly to the city center
    flyTo(activeCity.lat, activeCity.lon, 2);
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
        {breadcrumbs.map((landmark, i) => (
          <button
            key={landmark}
            onClick={() => handleLandmarkClick(landmark)}
            className="rounded-sm px-2 py-[2px] text-[7px] transition-colors"
            style={{
              backgroundColor: i === 0 ? accent : "transparent",
              color: i === 0 ? "#000" : "var(--text-inactive)",
              border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.15)",
              fontWeight: i === 0 ? 700 : 400,
            }}
          >
            {landmark}
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
          const isVisualMode = ['NORMAL', 'CRT', 'NVG', 'FLIR', 'DRONE'].includes(m.mode);
          return (
            <div key={m.mode} className="flex items-stretch">
              {i > 0 && (
                <div className="w-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
              )}
              <ModeButton
                mode={m.mode}
                label={m.label}
                icon={m.icon}
                isActive={currentMode === m.mode}
                onClick={() => {
                  if (m.mode === 'AI') {
                    setCommandModalOpen(true);
                  } else if (isVisualMode) {
                    setMode(m.mode as VisualMode);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
