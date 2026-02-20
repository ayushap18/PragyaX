"use client";

import { useState, useEffect } from "react";

const BOOT_LINES = [
  { text: "PRAGYAX GEOSPATIAL INTELLIGENCE SYSTEM v4.2.1", delay: 0, color: "#00FFD1" },
  { text: "─────────────────────────────────────", delay: 100, color: "#00FFD140" },
  { text: "[INIT] Loading kernel modules...", delay: 200, color: "#00FFD1" },
  { text: "[INIT] Establishing secure uplink...", delay: 500, color: "#00FFD1" },
  { text: "[AUTH] Verifying clearance: TS/SCI-TK ......... OK", delay: 900, color: "#00FF41" },
  { text: "[COMM] SATCOM relay handshake .................. OK", delay: 1300, color: "#00FF41" },
  { text: "[CESM] CesiumJS globe engine initializing...", delay: 1600, color: "#FFA500" },
  { text: "[TILE] Loading 3D photorealistic tileset...", delay: 1900, color: "#FFA500" },
  { text: "[FEED] ADS-B transponder feed .................. LIVE", delay: 2200, color: "#00FF41" },
  { text: "[FEED] SIGINT intercept array .................. LIVE", delay: 2400, color: "#00FF41" },
  { text: "[FEED] Orbital tracking network ................ LIVE", delay: 2600, color: "#00FF41" },
  { text: "[ENCR] AES-256-GCM session established", delay: 2800, color: "#00FFD1" },
  { text: "[SYS ] All subsystems nominal", delay: 3100, color: "#00FF41" },
  { text: "", delay: 3300, color: "#00FFD1" },
  { text: "READY — ENTERING OPERATIONAL MODE", delay: 3400, color: "#00FFD1" },
];

const TOTAL_DURATION = 4200;

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => setVisibleLines(i + 1), line.delay)
      );
    });

    timers.push(
      setTimeout(() => setFading(true), TOTAL_DURATION - 600)
    );

    timers.push(
      setTimeout(() => onComplete(), TOTAL_DURATION)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <div className="w-[520px] font-mono">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className="animate-fade-in-up text-[11px] leading-[1.8]"
            style={{ color: line.color, opacity: line.text ? 1 : 0 }}
          >
            {line.text}
            {i === visibleLines - 1 && line.text && (
              <span className="animate-cursor" style={{ color: line.color }}>
                {" "}
              </span>
            )}
          </div>
        ))}

        {/* Progress bar */}
        <div className="mt-4 h-[2px] w-full overflow-hidden" style={{ backgroundColor: "rgba(0,200,255,0.1)" }}>
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${(visibleLines / BOOT_LINES.length) * 100}%`,
              backgroundColor: "#00FFD1",
              boxShadow: "0 0 8px #00FFD1",
            }}
          />
        </div>
      </div>
    </div>
  );
}
