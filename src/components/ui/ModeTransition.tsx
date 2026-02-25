"use client";

import { useEffect, useState, useRef } from "react";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";
import type { VisualMode } from "@/types";

type TransitionEffect = "static" | "nvg-flash" | "thermal-wipe" | "matrix-rain" | "saffron-burst" | "drone-shake" | "green-rain";

const MODE_TRANSITIONS: Record<string, TransitionEffect> = {
  CRT: "static",
  NVG: "nvg-flash",
  FLIR: "thermal-wipe",
  DRONE: "drone-shake",
  GREEN: "green-rain",
  CHANAKYA: "saffron-burst",
  NORMAL: "static",
};

export default function ModeTransition() {
  const currentMode = useModeStore((s) => s.current);
  const [transitioning, setTransitioning] = useState(false);
  const [effect, setEffect] = useState<TransitionEffect>("static");
  const [targetAccent, setTargetAccent] = useState("#00FFD1");
  const prevModeRef = useRef<VisualMode>(currentMode);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevModeRef.current === currentMode) return;
    const prev = prevModeRef.current;
    prevModeRef.current = currentMode;

    // Don't transition on first render or from same mode
    if (prev === currentMode) return;

    const newEffect = MODE_TRANSITIONS[currentMode] || "static";
    setEffect(newEffect);
    setTargetAccent(MODE_ACCENTS[currentMode] || "#00FFD1");
    setTransitioning(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTransitioning(false);
    }, 600);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentMode]);

  if (!transitioning) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Static burst — CRT / NORMAL */}
      {effect === "static" && (
        <div className="absolute inset-0 mode-transition-static" />
      )}

      {/* NVG green flash + intensifier noise */}
      {effect === "nvg-flash" && (
        <div className="absolute inset-0 mode-transition-nvg" />
      )}

      {/* FLIR thermal gradient wipe */}
      {effect === "thermal-wipe" && (
        <div className="absolute inset-0 mode-transition-thermal" />
      )}

      {/* DRONE camera shake */}
      {effect === "drone-shake" && (
        <div className="absolute inset-0 mode-transition-drone" />
      )}

      {/* GREEN matrix rain */}
      {effect === "green-rain" && (
        <div className="absolute inset-0 mode-transition-matrix" />
      )}

      {/* CHANAKYA saffron burst */}
      {effect === "saffron-burst" && (
        <div className="absolute inset-0 mode-transition-saffron" />
      )}

      {/* Central mode label flash */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="mode-transition-label" style={{ color: targetAccent }}>
          <span className="text-[10px] font-bold tracking-[6px] opacity-0 mode-label-text">
            {currentMode}
          </span>
          <div
            className="h-[1px] w-0 mode-label-line mx-auto mt-1"
            style={{ backgroundColor: targetAccent }}
          />
        </div>
      </div>
    </div>
  );
}
