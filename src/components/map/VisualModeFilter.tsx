"use client";

import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";

export default function VisualModeFilter() {
  const currentMode = useModeStore((s) => s.current);
  const scanlines = useModeStore((s) => s.optics.scanlines);
  const accent = MODE_ACCENTS[currentMode];

  const showScanlines = currentMode === "CRT" || currentMode === "NVG";
  const showCRTFlicker = currentMode === "CRT";

  return (
    <>
      {/* Scanline overlay */}
      {showScanlines && (
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent ${4 - 1}px,
              rgba(0, 0, 0, ${(scanlines / 100) * 0.18}) ${4 - 1}px,
              rgba(0, 0, 0, ${(scanlines / 100) * 0.18}) 4px
            )`,
          }}
        />
      )}

      {/* CRT flicker effect */}
      {showCRTFlicker && (
        <div
          className="pointer-events-none absolute inset-0 z-[4] animate-crt-flicker"
          style={{
            background: `linear-gradient(
              180deg,
              transparent 0%,
              rgba(255, 165, 0, 0.01) 50%,
              transparent 100%
            )`,
          }}
        />
      )}

      {/* Subtle edge glow matching mode */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 55%,
            ${accent}06 85%,
            ${accent}12 100%
          )`,
        }}
      />
    </>
  );
}
