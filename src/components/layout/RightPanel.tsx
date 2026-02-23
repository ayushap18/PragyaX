"use client";

import { useModeStore } from "@/stores/modeStore";
import { useHUDStore } from "@/stores/hudStore";
import { MODE_ACCENTS } from "@/constants/modes";
import SliderControl from "@/components/ui/SliderControl";
import { SFX } from "@/utils/audioEngine";
import type { OpticsState } from "@/types";

export default function RightPanel() {
  const currentMode = useModeStore((s) => s.current);
  const optics = useModeStore((s) => s.optics);
  const setOptic = useModeStore((s) => s.setOptic);
  const accent = MODE_ACCENTS[currentMode];
  const utcTime = useHUDStore((s) => s.utcTime);

  return (
    <div
      className="fixed bottom-14 right-0 top-6 z-10 flex w-[180px] flex-col overflow-y-auto overflow-x-hidden scrollbar-hide"
      style={{
        backgroundColor: "var(--bg-panel)",
        borderLeft: "1px solid var(--border-subtle)",
      }}
    >
      {/* Mode label with glow */}
      <div className="relative flex items-center justify-between px-3 py-3 corner-brackets">
        <span
          className="text-[16px] font-bold tracking-wider"
          style={{ color: accent, textShadow: `0 0 10px ${accent}60` }}
        >
          {currentMode}
        </span>
        <span className="text-[7px]" style={{ color: "var(--text-dim)" }}>
          MODE
        </span>
      </div>

      {/* Recording status */}
      <div className="flex flex-col gap-[3px] px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="h-[5px] w-[5px] rounded-full animate-blink-rec"
            style={{ backgroundColor: "var(--accent-red)", boxShadow: "0 0 4px var(--accent-red)" }}
          />
          <span className="text-[7px] tabular-nums" style={{ color: "var(--text-primary)" }}>
            REC {utcTime}
          </span>
        </div>
        <span className="text-[7px] tabular-nums" style={{ color: "var(--text-dim)" }}>
          DBS: 47439 PASS: 0050-19H
        </span>
        <span className="text-[7px]" style={{ color: "var(--text-dim)" }}>
          DESC: 17H
        </span>
      </div>

      <Divider />

      {/* Optics Controls Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-[6px] tracking-[2px]" style={{ color: "var(--text-dim)" }}>
          OPTICS CONTROLS
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
      </div>

      <SliderControl label="BLOOM" value={optics.bloom} accentColor={accent} onChange={(v) => setOptic("bloom", v)} />
      <SliderControl label="SCANNER" value={optics.scanner} accentColor={accent} onChange={(v) => setOptic("scanner", v)} />

      {/* FOG dropdown */}
      <div className="flex flex-col gap-[3px] px-3 py-2">
        <span className="text-[6px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>FOG</span>
        <button
          onClick={() => {
            SFX.click();
            const cycle: OpticsState["fog"][] = ["CLEAR", "STANDARD", "TACTICAL"];
            const idx = cycle.indexOf(optics.fog);
            setOptic("fog", cycle[(idx + 1) % 3]);
          }}
          className="flex h-[22px] items-center justify-between rounded-sm px-2 transition-colors cursor-pointer"
          style={{
            border: `1px solid ${accent}60`,
            backgroundColor: `${accent}08`,
          }}
        >
          <span className="text-[7px]" style={{ color: accent }}>
            {optics.fog === "TACTICAL" ? "Tactical" : optics.fog === "STANDARD" ? "Standard" : "Clear"}
          </span>
          <span className="text-[8px]" style={{ color: accent }}>▾</span>
        </button>
      </div>

      {/* TAPEFITZ toggle */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[7px]" style={{ color: "var(--text-primary)" }}>TAPEFITZ</span>
        <button
          onClick={() => { SFX.toggle(); setOptic("tapefitz", !optics.tapefitz); }}
          className="rounded-full px-2 py-[2px] text-[6px] font-bold transition-all"
          style={{
            backgroundColor: optics.tapefitz ? "rgba(0,255,65,0.15)" : "rgba(255,255,255,0.05)",
            color: optics.tapefitz ? "var(--accent-green)" : "rgba(255,255,255,0.3)",
            border: `1px solid ${optics.tapefitz ? "var(--accent-green)" : "rgba(255,255,255,0.15)"}`,
            boxShadow: optics.tapefitz ? "0 0 6px rgba(0,255,65,0.2)" : "none",
          }}
        >
          {optics.tapefitz ? "ON" : "OFF"}
        </button>
      </div>

      {/* CLEAR ID button */}
      <div className="px-3 py-2">
        <button
          className="flex h-[22px] w-full items-center justify-center rounded-sm text-[7px] transition-all hover:border-white/30"
          style={{
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(200,230,255,0.5)",
          }}
        >
          CLEAR ID
        </button>
      </div>

      <Divider />

      {/* Fine Controls */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-[6px] tracking-[2px]" style={{ color: "var(--text-dim)" }}>
          FINE CONTROLS
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
      </div>

      <SliderControl label="Flickeration" value={optics.flickeration} accentColor={accent} onChange={(v) => setOptic("flickeration", v)} />
      <SliderControl label="Distortion" value={optics.distortion} accentColor={accent} onChange={(v) => setOptic("distortion", v)} />
      <SliderControl label="Scanlines" value={optics.scanlines} accentColor={accent} onChange={(v) => setOptic("scanlines", v)} />
      <SliderControl label="Saturation" value={optics.saturation} accentColor={accent} onChange={(v) => setOptic("saturation", v)} />

      <Divider />

      {/* Flight Layer dropdown */}
      <div className="flex flex-col gap-[3px] px-3 py-2">
        <span className="text-[6px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>FLIGHT LAYER</span>
        <div
          className="flex h-[22px] items-center justify-between rounded-sm px-2"
          style={{ border: `1px solid ${accent}60`, backgroundColor: `${accent}08` }}
        >
          <span className="text-[7px]" style={{ color: accent }}>Global Flight</span>
          <span className="text-[8px]" style={{ color: accent }}>▾</span>
        </div>
      </div>

      <Divider />

      {/* Coordinate readout */}
      <div className="relative flex flex-col gap-[3px] px-3 py-2 bg-grid-dots corner-brackets" style={{ backgroundColor: "rgba(0,8,16,0.8)" }}>
        <span className="text-[5px] tracking-[2px]" style={{ color: "var(--text-dim)" }}>
          COORDINATE READOUT
        </span>
        <span className="text-[7px] tabular-nums" style={{ color: accent }}>
          GSD: 0.079 NIERS: 9.0
        </span>
        <span className="text-[7px] tabular-nums" style={{ color: "rgba(200,230,255,0.7)" }}>
          ALT: 193M SUN: 4.1° EL
        </span>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />;
}
