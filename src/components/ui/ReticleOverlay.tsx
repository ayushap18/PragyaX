"use client";

import { useModeStore } from "@/stores/modeStore";
import { useMapStore } from "@/stores/mapStore";
import { MODE_ACCENTS } from "@/constants/modes";

export default function ReticleOverlay() {
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];
  const lat = useMapStore((s) => s.lat);
  const lon = useMapStore((s) => s.lon);

  // Only show reticle in tactical modes
  const showReticle = ["NVG", "FLIR", "DRONE", "CRT", "GREEN", "CHANAKYA"].includes(currentMode);
  if (!showReticle) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[6]">
      {/* Center reticle container */}
      <div className="absolute left-1/2 top-1/2">
        {/* Outer rotating ring */}
        <svg
          className="reticle-rotate"
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -60, marginTop: -60 }}
        >
          <circle
            cx="60"
            cy="60"
            r="56"
            fill="none"
            stroke={accent}
            strokeWidth="0.5"
            strokeDasharray="4 8"
            opacity="0.25"
          />
          {/* Tick marks at cardinal points */}
          {[0, 90, 180, 270].map((deg) => (
            <line
              key={deg}
              x1="60"
              y1="2"
              x2="60"
              y2="8"
              stroke={accent}
              strokeWidth="1"
              opacity="0.4"
              transform={`rotate(${deg} 60 60)`}
            />
          ))}
          {/* Fine tick marks every 30° */}
          {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="60"
              y1="3"
              x2="60"
              y2="6"
              stroke={accent}
              strokeWidth="0.5"
              opacity="0.3"
              transform={`rotate(${deg} 60 60)`}
            />
          ))}
        </svg>

        {/* Inner reticle — mode-specific */}
        <svg
          className="reticle-breathe"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -40, marginTop: -40 }}
        >
          {currentMode === "NVG" && <NVGReticle accent={accent} />}
          {currentMode === "FLIR" && <FLIRReticle accent={accent} />}
          {currentMode === "DRONE" && <DroneReticle accent={accent} />}
          {currentMode === "CRT" && <CRTReticle accent={accent} />}
          {currentMode === "GREEN" && <GreenReticle accent={accent} />}
          {currentMode === "CHANAKYA" && <ChanakyaReticle accent={accent} />}
        </svg>

        {/* Coordinate readout below reticle */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 52, whiteSpace: "nowrap" }}
        >
          <span
            className="text-[6px] font-mono tabular-nums tracking-[1px]"
            style={{ color: `${accent}60` }}
          >
            {Math.abs(lat).toFixed(4)}°{lat >= 0 ? "N" : "S"}{" "}
            {Math.abs(lon).toFixed(4)}°{lon >= 0 ? "E" : "W"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* NVG: Intensified circle + cross */
function NVGReticle({ accent }: { accent: string }) {
  return (
    <>
      <circle cx="40" cy="40" r="20" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
      <circle cx="40" cy="40" r="12" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.3" />
      <line x1="40" y1="14" x2="40" y2="28" stroke={accent} strokeWidth="0.8" opacity="0.6" />
      <line x1="40" y1="52" x2="40" y2="66" stroke={accent} strokeWidth="0.8" opacity="0.6" />
      <line x1="14" y1="40" x2="28" y2="40" stroke={accent} strokeWidth="0.8" opacity="0.6" />
      <line x1="52" y1="40" x2="66" y2="40" stroke={accent} strokeWidth="0.8" opacity="0.6" />
      <circle cx="40" cy="40" r="2" fill={accent} opacity="0.4" />
    </>
  );
}

/* FLIR: Box with brackets */
function FLIRReticle({ accent }: { accent: string }) {
  return (
    <>
      {/* Outer box */}
      <rect x="16" y="16" width="48" height="48" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
      {/* Corner brackets */}
      <path d="M16,24 L16,16 L24,16" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7" />
      <path d="M56,16 L64,16 L64,24" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7" />
      <path d="M64,56 L64,64 L56,64" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7" />
      <path d="M24,64 L16,64 L16,56" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7" />
      {/* Center cross */}
      <line x1="37" y1="40" x2="43" y2="40" stroke={accent} strokeWidth="0.8" opacity="0.6" />
      <line x1="40" y1="37" x2="40" y2="43" stroke={accent} strokeWidth="0.8" opacity="0.6" />
    </>
  );
}

/* DRONE: Full mil-dot reticle */
function DroneReticle({ accent }: { accent: string }) {
  return (
    <>
      {/* Horizontal line with mil-dots */}
      <line x1="8" y1="40" x2="72" y2="40" stroke={accent} strokeWidth="0.5" opacity="0.3" />
      <line x1="40" y1="8" x2="40" y2="72" stroke={accent} strokeWidth="0.5" opacity="0.3" />
      {/* Mil dots along horizontal */}
      {[-20, -14, -8, 8, 14, 20].map((offset) => (
        <circle key={`h${offset}`} cx={40 + offset} cy="40" r="1" fill={accent} opacity="0.5" />
      ))}
      {/* Mil dots along vertical */}
      {[-20, -14, -8, 8, 14, 20].map((offset) => (
        <circle key={`v${offset}`} cx="40" cy={40 + offset} r="1" fill={accent} opacity="0.5" />
      ))}
      {/* Center diamond */}
      <polygon points="40,36 44,40 40,44 36,40" fill="none" stroke={accent} strokeWidth="1" opacity="0.6" />
      {/* Range arcs */}
      <path d="M28,40 A12,12 0 0,1 52,40" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.25" />
      <path d="M28,40 A12,12 0 0,0 52,40" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.25" />
    </>
  );
}

/* CRT: Thin crosshair */
function CRTReticle({ accent }: { accent: string }) {
  return (
    <>
      <line x1="40" y1="10" x2="40" y2="34" stroke={accent} strokeWidth="0.5" opacity="0.4" />
      <line x1="40" y1="46" x2="40" y2="70" stroke={accent} strokeWidth="0.5" opacity="0.4" />
      <line x1="10" y1="40" x2="34" y2="40" stroke={accent} strokeWidth="0.5" opacity="0.4" />
      <line x1="46" y1="40" x2="70" y2="40" stroke={accent} strokeWidth="0.5" opacity="0.4" />
      <circle cx="40" cy="40" r="1" fill={accent} opacity="0.5" />
    </>
  );
}

/* GREEN: Matrix style brackets */
function GreenReticle({ accent }: { accent: string }) {
  return (
    <>
      {/* Corner brackets forming a diamond-ish shape */}
      <path d="M40,12 L54,26" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      <path d="M40,12 L26,26" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      <path d="M40,68 L54,54" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      <path d="M40,68 L26,54" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      {/* Horizontal ticks */}
      <line x1="14" y1="40" x2="26" y2="40" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      <line x1="54" y1="40" x2="66" y2="40" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      {/* Center circle */}
      <circle cx="40" cy="40" r="4" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.4" />
      <circle cx="40" cy="40" r="1.5" fill={accent} opacity="0.3" />
    </>
  );
}

/* CHANAKYA: Lotus-inspired pattern */
function ChanakyaReticle({ accent }: { accent: string }) {
  return (
    <>
      {/* Chakra-inspired circle */}
      <circle cx="40" cy="40" r="18" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.4" />
      <circle cx="40" cy="40" r="24" fill="none" stroke={accent} strokeWidth="0.4" opacity="0.2" strokeDasharray="2 4" />
      {/* Lotus petals — 8 spokes like Ashoka Chakra */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="40"
          y1="40"
          x2="40"
          y2="22"
          stroke={accent}
          strokeWidth="0.6"
          opacity="0.35"
          transform={`rotate(${deg} 40 40)`}
        />
      ))}
      {/* Center dot */}
      <circle cx="40" cy="40" r="2" fill={accent} opacity="0.5" />
      {/* Small dots on the circle */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 40 + 18 * Math.sin(rad);
        const y = 40 - 18 * Math.cos(rad);
        return <circle key={`d${deg}`} cx={x} cy={y} r="1.2" fill={accent} opacity="0.4" />;
      })}
    </>
  );
}
