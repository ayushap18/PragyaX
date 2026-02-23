"use client";

import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";

export default function VisualModeFilter() {
  const currentMode = useModeStore((s) => s.current);
  const optics = useModeStore((s) => s.optics);
  const accent = MODE_ACCENTS[currentMode];

  const showScanlines = currentMode === "CRT" || currentMode === "NVG" || currentMode === "GREEN";
  const showCRTFlicker = currentMode === "CRT";

  // Compute optics-driven effects
  const bloomIntensity = optics.bloom / 100;
  const flickerationSpeed = 0.05 + (optics.flickeration / 100) * 0.2;
  const distortionAmount = (optics.distortion / 100) * 3;
  const saturationMultiplier = 0.5 + (optics.saturation / 100) * 1.5;
  const fogOpacity = optics.fog === "TACTICAL" ? 0.12 : optics.fog === "STANDARD" ? 0.06 : 0;
  const scannerSpeed = 4 + (1 - optics.scanner / 100) * 12;

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
              rgba(0, 0, 0, ${(optics.scanlines / 100) * 0.18}) ${4 - 1}px,
              rgba(0, 0, 0, ${(optics.scanlines / 100) * 0.18}) 4px
            )`,
          }}
        />
      )}

      {/* CRT flicker effect - intensity driven by flickeration */}
      {showCRTFlicker && optics.flickeration > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[4]"
          style={{
            animation: `crt-flicker ${flickerationSpeed}s infinite`,
            background: `linear-gradient(
              180deg,
              transparent 0%,
              rgba(255, 165, 0, ${0.005 + bloomIntensity * 0.02}) 50%,
              transparent 100%
            )`,
          }}
        />
      )}

      {/* Bloom / glow overlay */}
      {bloomIntensity > 0.1 && (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: `radial-gradient(
              ellipse at center,
              ${accent}${Math.round(bloomIntensity * 8).toString(16).padStart(2, "0")} 0%,
              transparent 70%
            )`,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Distortion overlay - chromatic aberration */}
      {distortionAmount > 0.3 && (
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            background: `linear-gradient(
              90deg,
              rgba(255,0,0,${distortionAmount * 0.008}) 0%,
              transparent 30%,
              transparent 70%,
              rgba(0,0,255,${distortionAmount * 0.008}) 100%
            )`,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Saturation boost overlay */}
      {saturationMultiplier > 1.2 && (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            backdropFilter: `saturate(${saturationMultiplier})`,
          }}
        />
      )}

      {/* Fog overlay */}
      {fogOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: `radial-gradient(
              ellipse at center,
              transparent 20%,
              rgba(0, 20, 40, ${fogOpacity}) 60%,
              rgba(0, 15, 30, ${fogOpacity * 2}) 100%
            )`,
          }}
        />
      )}

      {/* Scanner sweep line */}
      {optics.scanner > 5 && (
        <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
          <div
            className="absolute left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${accent}30 30%, ${accent}60 50%, ${accent}30 70%, transparent 100%)`,
              boxShadow: `0 0 8px ${accent}40, 0 0 20px ${accent}20`,
              animation: `scan-line ${scannerSpeed}s linear infinite`,
            }}
          />
        </div>
      )}

      {/* Tapefitz VHS noise */}
      {optics.tapefitz && (
        <div
          className="pointer-events-none absolute inset-0 z-[4]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundSize: "150px 150px",
            animation: "noise-shift 0.5s steps(4) infinite",
            opacity: 0.6,
          }}
        />
      )}

      {/* Subtle edge glow matching mode — breathing vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] animate-vignette-breathe"
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
