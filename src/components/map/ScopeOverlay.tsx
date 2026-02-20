"use client";

import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";

export default function ScopeOverlay() {
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {/* Circular vignette */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "min(70vw, 70vh)",
          height: "min(70vw, 70vh)",
          boxShadow: `0 0 0 100vmax rgba(0, 0, 0, 0.85), inset 0 0 80px rgba(0, 0, 0, 0.6)`,
          outline: `1px solid ${accent}30`,
        }}
      />

      {/* Range rings SVG */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: "min(70vw, 70vh)", height: "min(70vw, 70vh)" }}
        viewBox="0 0 400 400"
        fill="none"
      >
        {/* Outer range rings */}
        <circle cx="200" cy="200" r="195" stroke={accent} strokeWidth="0.3" opacity="0.15" />
        <circle cx="200" cy="200" r="150" stroke={accent} strokeWidth="0.3" opacity="0.1" strokeDasharray="3 6" />
        <circle cx="200" cy="200" r="100" stroke={accent} strokeWidth="0.3" opacity="0.08" strokeDasharray="2 8" />
        <circle cx="200" cy="200" r="50" stroke={accent} strokeWidth="0.3" opacity="0.06" strokeDasharray="1 4" />

        {/* Degree marks around the perimeter */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 * Math.PI) / 180;
          const major = i % 9 === 0;
          const r1 = major ? 182 : 188;
          const r2 = 195;
          return (
            <line
              key={i}
              x1={200 + r1 * Math.sin(angle)}
              y1={200 - r1 * Math.cos(angle)}
              x2={200 + r2 * Math.sin(angle)}
              y2={200 - r2 * Math.cos(angle)}
              stroke={accent}
              strokeWidth={major ? "0.6" : "0.3"}
              opacity={major ? "0.3" : "0.12"}
            />
          );
        })}
      </svg>

      {/* Slowly rotating outer reticle */}
      <svg
        className="absolute left-1/2 top-1/2 animate-rotate-slow"
        style={{ width: "min(74vw, 74vh)", height: "min(74vw, 74vh)" }}
        viewBox="0 0 400 400"
        fill="none"
      >
        {/* Rotating dashes */}
        <circle cx="200" cy="200" r="196" stroke={accent} strokeWidth="0.4" opacity="0.1" strokeDasharray="2 18" />
        {/* Small triangle markers at 4 points */}
        <polygon points="200,8 197,14 203,14" fill={accent} opacity="0.2" />
        <polygon points="200,392 197,386 203,386" fill={accent} opacity="0.2" />
        <polygon points="8,200 14,197 14,203" fill={accent} opacity="0.2" />
        <polygon points="392,200 386,197 386,203" fill={accent} opacity="0.2" />
      </svg>

      {/* Crosshair SVG */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        style={{ opacity: 0.5 }}
      >
        {/* Main crosshair lines */}
        <line x1="30" y1="0" x2="30" y2="22" stroke={accent} strokeWidth="0.5" />
        <line x1="30" y1="38" x2="30" y2="60" stroke={accent} strokeWidth="0.5" />
        <line x1="0" y1="30" x2="22" y2="30" stroke={accent} strokeWidth="0.5" />
        <line x1="38" y1="30" x2="60" y2="30" stroke={accent} strokeWidth="0.5" />

        {/* Center dot */}
        <circle cx="30" cy="30" r="1" fill={accent} opacity="0.8" />

        {/* Inner reticle circle */}
        <circle cx="30" cy="30" r="4" stroke={accent} strokeWidth="0.4" fill="none" opacity="0.6" />

        {/* Corner brackets */}
        <path d="M22,22 L22,26" stroke={accent} strokeWidth="0.4" opacity="0.4" />
        <path d="M22,22 L26,22" stroke={accent} strokeWidth="0.4" opacity="0.4" />
        <path d="M38,22 L38,26" stroke={accent} strokeWidth="0.4" opacity="0.4" />
        <path d="M38,22 L34,22" stroke={accent} strokeWidth="0.4" opacity="0.4" />
        <path d="M22,38 L22,34" stroke={accent} strokeWidth="0.4" opacity="0.4" />
        <path d="M22,38 L26,38" stroke={accent} strokeWidth="0.4" opacity="0.4" />
        <path d="M38,38 L38,34" stroke={accent} strokeWidth="0.4" opacity="0.4" />
        <path d="M38,38 L34,38" stroke={accent} strokeWidth="0.4" opacity="0.4" />

        {/* Tick marks on crosshairs */}
        {[8, 12, 16].map((pos) => (
          <g key={pos}>
            <line x1={pos} y1="29" x2={pos} y2="31" stroke={accent} strokeWidth="0.3" opacity="0.3" />
            <line x1={60 - pos} y1="29" x2={60 - pos} y2="31" stroke={accent} strokeWidth="0.3" opacity="0.3" />
            <line x1="29" y1={pos} x2="31" y2={pos} stroke={accent} strokeWidth="0.3" opacity="0.3" />
            <line x1="29" y1={60 - pos} x2="31" y2={60 - pos} stroke={accent} strokeWidth="0.3" opacity="0.3" />
          </g>
        ))}
      </svg>

      {/* Cardinal markers */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest"
        style={{ top: `calc(50% - min(35vw, 35vh) - 16px)`, color: accent, opacity: 0.5 }}
      >
        N
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest"
        style={{ top: `calc(50% + min(35vw, 35vh) + 6px)`, color: accent, opacity: 0.5 }}
      >
        S
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-widest"
        style={{ left: `calc(50% - min(35vw, 35vh) - 14px)`, color: accent, opacity: 0.5 }}
      >
        W
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-widest"
        style={{ left: `calc(50% + min(35vw, 35vh) + 6px)`, color: accent, opacity: 0.5 }}
      >
        E
      </div>

      {/* Degree labels */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[5px] tabular-nums"
        style={{ top: `calc(50% - min(32vw, 32vh))`, color: accent, opacity: 0.25 }}
      >
        000°
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[5px] tabular-nums"
        style={{ top: `calc(50% + min(32vw, 32vh))`, color: accent, opacity: 0.25 }}
      >
        180°
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 text-[5px] tabular-nums"
        style={{ left: `calc(50% + min(32vw, 32vh) + 2px)`, color: accent, opacity: 0.25 }}
      >
        090°
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 text-[5px] tabular-nums"
        style={{ left: `calc(50% - min(32vw, 32vh) - 16px)`, color: accent, opacity: 0.25 }}
      >
        270°
      </div>

      {/* Tick marks at 45° intervals */}
      {[45, 135, 225, 315].map((angle) => (
        <div
          key={angle}
          className="absolute left-1/2 top-1/2 h-[2px] w-[8px]"
          style={{
            backgroundColor: accent,
            opacity: 0.25,
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(min(34vw, 34vh))`,
          }}
        />
      ))}

      {/* Scanning line (slow sweep) */}
      <div
        className="animate-scan-line absolute left-1/2 -translate-x-1/2"
        style={{
          width: "min(40vw, 40vh)",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${accent}15, ${accent}30, ${accent}15, transparent)`,
        }}
      />
    </div>
  );
}
