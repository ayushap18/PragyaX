"use client";

import { useModeStore } from "@/stores/modeStore";
import { useMapStore } from "@/stores/mapStore";
import { useAIStore } from "@/stores/aiStore";
import { MODE_ACCENTS } from "@/constants/modes";

export default function IntelBrief() {
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];
  const currentCity = useMapStore((s) => s.currentCity);
  const intelBrief = useAIStore((s) => s.intelBrief);
  const missionId = useAIStore((s) => s.missionId);
  const isGenerating = useAIStore((s) => s.isGeneratingBrief);
  const briefError = useAIStore((s) => s.briefError);

  const displayMissionId = missionId || "KH11-4166 OPS-4117";

  const fallbackBrief = `${currentMode} GLOBAL HEAD ${currentCity.toUpperCase()}\nOVERHEAD SAT TRACK NOMINAL.\n34 AIRCRAFT TRANSPONDERS ACTIVE.\nNO SEISMIC ACTIVITY 500KM RADIUS.\nWEATHER CLEAR.\nCONTINUOUS MONITORING ADVISED.`;

  const displayBrief = intelBrief || fallbackBrief;

  return (
    <div className="flex w-full flex-col">
      {/* Classification header */}
      <div
        className="flex w-full flex-col gap-[2px] px-3 py-2"
        style={{
          backgroundColor: "rgba(255,0,0,0.04)",
          borderLeft: "2px solid var(--accent-red)",
        }}
      >
        <span className="text-[7px] font-bold tracking-[0.5px] animate-pulse-slow" style={{ color: "var(--accent-red)" }}>
          TOP SECRET // SI-TK // NOFORN
        </span>
        <span className="text-[8px] tabular-nums" style={{ color: "var(--accent-red)" }}>
          {displayMissionId}
        </span>
        <span className="text-[12px] font-bold" style={{ color: accent, textShadow: `0 0 8px ${accent}40` }}>
          {currentMode}
        </span>
      </div>

      {/* Intel brief text */}
      <div className="px-3 py-2 bg-hatch relative">
        {isGenerating && (
          <div className="absolute top-1 right-2">
            <span
              className="text-[6px] font-bold tracking-[1px] animate-pulse"
              style={{ color: accent }}
            >
              GENERATING...
            </span>
          </div>
        )}
        {briefError && (
          <div className="mb-1">
            <span className="text-[6px] font-bold" style={{ color: "var(--accent-red)" }}>
              SIGINT ERROR: {briefError}
            </span>
          </div>
        )}
        <p
          className="whitespace-pre-line text-[8px] leading-[1.6]"
          style={{ color: "rgba(200,230,255,0.7)" }}
        >
          {displayBrief}
        </p>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2">
        <div
          className="flex h-[24px] items-center justify-between rounded-sm px-2 transition-colors"
          style={{
            border: "1px solid rgba(0,200,255,0.2)",
            borderLeftWidth: 3,
            borderLeftColor: accent,
            backgroundColor: "rgba(0,200,255,0.02)",
          }}
        >
          <span className="text-[7px] animate-cursor" style={{ color: `${accent}60` }}>
            SEARCH LOCATION
          </span>
          <span className="text-[9px]" style={{ color: `${accent}60` }}>
            &#x2315;
          </span>
        </div>
      </div>
    </div>
  );
}
