"use client";

import { useModeStore } from "@/stores/modeStore";
import { useHUDStore } from "@/stores/hudStore";
import { useMapStore } from "@/stores/mapStore";
import { MODE_ACCENTS } from "@/constants/modes";
import IntelBrief from "@/components/panels/IntelBrief";
import DataLayers from "@/components/panels/DataLayers";
import type { IntelEvent } from "@/stores/hudStore";

export default function LeftPanel() {
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];
  const lat = useMapStore((s) => s.lat);
  const lon = useMapStore((s) => s.lon);
  const feedQuality = useHUDStore((s) => s.feedQuality);
  const latency = useHUDStore((s) => s.latency);
  const lastUpdate = useHUDStore((s) => s.lastUpdate);
  const entityCount = useHUDStore((s) => s.entityCount);
  const signalStrength = useHUDStore((s) => s.signalStrength);
  const intelFeed = useHUDStore((s) => s.intelFeed);

  return (
    <div
      className="fixed bottom-14 left-0 top-6 z-10 flex w-[220px] flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--bg-panel)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div className="relative flex flex-col gap-[2px] px-3 py-2 corner-brackets">
        <div className="flex items-center gap-[5px]">
          <div
            className="h-[5px] w-[5px] rounded-full animate-pulse-slow"
            style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
          />
          <span className="text-[11px] font-bold text-white">PRAGYAX</span>
        </div>
        <span className="text-[6px] tracking-[1.5px]" style={{ color: "var(--text-dim)" }}>
          GEOSPATIAL INTELLIGENCE SYSTEM
        </span>
      </div>

      {/* Classification + Intel Brief + Search */}
      <IntelBrief />

      {/* Data Layers */}
      <DataLayers />

      {/* Live Intel Feed */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-3 py-[5px]">
          <span className="text-[7px] font-semibold tracking-[1.2px]" style={{ color: `${accent}80` }}>
            INTEL FEED
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: `${accent}26` }} />
          <div className="h-[4px] w-[4px] rounded-full animate-blink-rec" style={{ backgroundColor: accent }} />
        </div>
        <div className="scrollbar-hide max-h-[80px] overflow-y-auto">
          {intelFeed.slice(0, 4).map((evt: IntelEvent) => (
            <FeedRow key={evt.id} event={evt} />
          ))}
          {intelFeed.length === 0 && (
            <div className="px-3 py-1 text-[6px]" style={{ color: "var(--text-dim)" }}>
              AWAITING FEED DATA...
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="mt-auto flex flex-col bg-grid-dots">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-[7px] font-semibold tracking-[1.2px]" style={{ color: `${accent}80` }}>
            SYSTEM STATUS
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: `${accent}26` }} />
        </div>

        <StatusRow label="UPLINK" value="CONNECTED" valueColor="var(--accent-green)" dot />
        <StatusRow label="SIGNAL" value={`${signalStrength}%`} valueColor={accent} />
        <StatusRow label="FEED QUALITY" value={`${feedQuality}%`} valueColor={accent} />
        <StatusRow label="LATENCY" value={`${latency}ms`} valueColor={latency < 20 ? "rgba(0,255,200,0.6)" : "var(--accent-amber)"} />
        <StatusRow label="ENCRYPTION" value="AES-256-GCM" valueColor="rgba(0,255,200,0.6)" />

        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-[7px] font-semibold tracking-[1.2px]" style={{ color: `${accent}80` }}>
            INTEL SUMMARY
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: `${accent}26` }} />
        </div>

        <StatusRow label="ACTIVE FEEDS" value={entityCount.toLocaleString()} valueColor={accent} />
        <StatusRow label="ANOMALIES" value="3" valueColor="var(--accent-amber)" />
        <StatusRow label="ALERTS" value="1 ACTIVE" valueColor="rgba(255,100,100,0.8)" blink />
        <StatusRow label="LAST UPDATE" value={`${lastUpdate}s AGO`} valueColor="rgba(0,255,200,0.6)" />

        {/* Coordinate readout */}
        <div
          className="relative flex flex-col gap-[2px] px-3 py-2 corner-brackets"
          style={{
            backgroundColor: "rgba(0,200,255,0.03)",
            borderTop: "1px solid rgba(0,200,255,0.1)",
          }}
        >
          <span className="text-[7px] font-bold tabular-nums" style={{ color: accent }}>
            {lat.toFixed(4)}°N {Math.abs(lon).toFixed(4)}°W
          </span>
          <span className="text-[6px]" style={{ color: "rgba(200,230,255,0.3)" }}>
            MGRS: 18S UJ 23417 06519
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  valueColor,
  dot,
  blink,
}: {
  label: string;
  value: string;
  valueColor: string;
  dot?: boolean;
  blink?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-[3px]">
      <span className="text-[6px]" style={{ color: "rgba(200,230,255,0.4)" }}>
        {label}
      </span>
      <div className="flex items-center gap-1">
        {dot && (
          <div className="h-[3px] w-[3px] rounded-full animate-pulse-slow" style={{ backgroundColor: valueColor }} />
        )}
        <span
          className={`text-[7px] font-bold tabular-nums ${blink ? "animate-blink-rec" : ""}`}
          style={{ color: valueColor }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

const FEED_COLORS: Record<string, string> = {
  info: "var(--accent-cyan)",
  warn: "var(--accent-amber)",
  alert: "var(--accent-red)",
  success: "var(--accent-green)",
};

function FeedRow({ event }: { event: IntelEvent }) {
  return (
    <div
      className="flex items-start gap-[5px] px-3 py-[2px] animate-fade-in-up"
      style={{ borderLeft: `2px solid ${FEED_COLORS[event.type]}` }}
    >
      <span className="text-[5px] tabular-nums shrink-0 pt-[1px]" style={{ color: "var(--text-dim)" }}>
        {event.time.slice(0, 5)}
      </span>
      <span className="text-[6px] leading-[1.4]" style={{ color: FEED_COLORS[event.type] }}>
        {event.text}
      </span>
    </div>
  );
}
