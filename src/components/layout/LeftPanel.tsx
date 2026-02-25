"use client";

import { useModeStore } from "@/stores/modeStore";
import { useHUDStore } from "@/stores/hudStore";
import { useMapStore } from "@/stores/mapStore";
import { useDataStore } from "@/stores/dataStore";
import { useAnomalyStore, useGeofenceStore, useVesselStore } from "@/stores/exclusiveStores";
import { MODE_ACCENTS } from "@/constants/modes";
import IntelBrief from "@/components/panels/IntelBrief";
import DataLayers from "@/components/panels/DataLayers";
import type { IntelEvent } from "@/stores/hudStore";
import { Radio, AlertTriangle, Shield, Map, LayoutGrid, Activity, Anchor, ShieldCheck, Crosshair, MessageSquare } from "lucide-react";

interface LeftPanelProps {
  onOpenSpectrum?: () => void;
  onOpenAnomalies?: () => void;
  onOpenGeofences?: () => void;
  onOpenMissions?: () => void;
  onOpenSurveillanceGrid?: () => void;
  onOpenComms?: () => void;
  onToggleGPS?: () => void;
  gpsActive?: boolean;
  gpsAccuracy?: number | null;
}

export default function LeftPanel({
  onOpenSpectrum,
  onOpenAnomalies,
  onOpenGeofences,
  onOpenMissions,
  onOpenSurveillanceGrid,
  onOpenComms,
  onToggleGPS,
  gpsActive,
  gpsAccuracy,
}: LeftPanelProps) {
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
  const flights = useDataStore((s) => s.flights);
  const earthquakes = useDataStore((s) => s.earthquakes);
  const satelliteTLEs = useDataStore((s) => s.satelliteTLEs);
  const anomalyCount = useAnomalyStore((s) => s.anomalies.filter((a) => !a.acknowledged).length);
  const geofenceCount = useGeofenceStore((s) => s.geofences.filter((g) => g.armed).length);
  const vesselCount = useVesselStore((s) => s.vessels.length);

  return (
    <div
      className="fixed bottom-14 left-0 top-[38px] z-10 flex w-[220px] flex-col overflow-y-auto overflow-x-hidden scrollbar-thin panel-tier-1 panel-gradient-border"
      style={{
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

      {/* Exclusive Feature Quick Access */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-3 py-[5px]">
          <span className="text-[7px] font-semibold tracking-[1.2px]" style={{ color: `${accent}80` }}>
            OPERATIONS
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: `${accent}26` }} />
        </div>
        <div className="flex flex-wrap gap-[3px] px-3 pb-1">
          <OpButton label="SPECTRUM" icon={<Radio size={8} />} onClick={onOpenSpectrum} accent={accent} />
          <OpButton label={`ANOMALY${anomalyCount > 0 ? ` (${anomalyCount})` : ''}`} icon={<AlertTriangle size={8} />} onClick={onOpenAnomalies} accent={accent} alert={anomalyCount > 0} />
          <OpButton label={`GEOFENCE${geofenceCount > 0 ? ` (${geofenceCount})` : ''}`} icon={<Shield size={8} />} onClick={onOpenGeofences} accent={accent} />
          <OpButton label="MISSION" icon={<Map size={8} />} onClick={onOpenMissions} accent={accent} />
          <OpButton label="GRID" icon={<LayoutGrid size={8} />} onClick={onOpenSurveillanceGrid} accent={accent} />
          <OpButton label="COMMS" icon={<MessageSquare size={8} />} onClick={onOpenComms} accent={accent} />
          <OpButton label={gpsActive ? `GPS${gpsAccuracy ? ` ±${Math.round(gpsAccuracy)}m` : ''}` : 'GPS'} icon={<Crosshair size={8} />} onClick={onToggleGPS} accent={accent} active={gpsActive} />
        </div>
      </div>

      {/* System Status */}
      <div className="flex flex-col bg-grid-dots shrink-0">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-[7px] font-semibold tracking-[1.2px]" style={{ color: `${accent}80` }}>
            SYSTEM STATUS
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: `${accent}26` }} />
        </div>

        {/* Subsystem Health Indicators — Christmas Tree */}
        <div className="flex items-center gap-[6px] px-3 py-[4px]">
          <SubsystemDot label="CESIUM" healthy={true} accent={accent} />
          <SubsystemDot label="SATCOM" healthy={signalStrength > 90} accent={accent} />
          <SubsystemDot label="ADS-B" healthy={flights.length > 0} accent={accent} />
          <SubsystemDot label="SIGINT" healthy={feedQuality > 95} accent={accent} />
          <SubsystemDot label="NRO" healthy={satelliteTLEs.length > 0} accent={accent} />
          <SubsystemDot label="SEISMIC" healthy={earthquakes.length > 0} accent={accent} />
          <SubsystemDot label="GPS" healthy={gpsActive || false} accent={accent} />
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

        <StatusRow label="ACTIVE FEEDS" value={entityCount.toLocaleString()} valueColor={accent} icon={<Activity size={7} />} />
        <StatusRow label="ANOMALIES" value={String(anomalyCount)} valueColor={anomalyCount > 0 ? "var(--accent-amber)" : accent} blink={anomalyCount > 0} icon={<AlertTriangle size={7} />} />
        <StatusRow label="VESSELS" value={String(vesselCount)} valueColor={accent} icon={<Anchor size={7} />} />
        <StatusRow label="GEOFENCES" value={`${geofenceCount} ARMED`} valueColor={geofenceCount > 0 ? "var(--accent-green)" : accent} icon={<ShieldCheck size={7} />} />
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
            {Math.abs(lat).toFixed(4)}°{lat >= 0 ? 'N' : 'S'} {Math.abs(lon).toFixed(4)}°{lon >= 0 ? 'E' : 'W'}
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
  icon,
}: {
  label: string;
  value: string;
  valueColor: string;
  dot?: boolean;
  blink?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-[3px]">
      <div className="flex items-center gap-[4px]">
        {icon && <span style={{ color: "rgba(200,230,255,0.4)" }}>{icon}</span>}
        <span className="text-[6px]" style={{ color: "rgba(200,230,255,0.4)" }}>
          {label}
        </span>
      </div>
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

function SubsystemDot({ label, healthy, accent }: { label: string; healthy: boolean; accent: string }) {
  const color = healthy ? "var(--accent-green)" : "var(--accent-amber)";
  return (
    <div className="flex flex-col items-center gap-[2px]">
      <div
        className={`h-[6px] w-[6px] rounded-sm ${healthy ? '' : 'animate-blink-rec'}`}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 3px ${color}`,
        }}
      />
      <span className="text-[4px] tracking-[0.5px]" style={{ color: `${accent}50` }}>
        {label}
      </span>
    </div>
  );
}

function OpButton({ label, icon, onClick, accent, alert, active }: { label: string; icon?: React.ReactNode; onClick?: () => void; accent: string; alert?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="text-[6px] tracking-[0.5px] px-[6px] py-[3px] rounded-sm cursor-pointer hover:brightness-150 transition-colors flex items-center gap-[3px]"
      style={{
        color: active ? '#000' : alert ? '#FF4444' : `${accent}80`,
        border: `1px solid ${active ? accent : alert ? '#FF444440' : `${accent}20`}`,
        backgroundColor: active ? accent : alert ? 'rgba(255,68,68,0.08)' : 'transparent',
        fontWeight: active ? 700 : 400,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
