"use client";

import { useEffect } from "react";
import { useHUDStore } from "@/stores/hudStore";
import { useModeStore } from "@/stores/modeStore";
import { useDataStore } from "@/stores/dataStore";
import { useAIStore } from "@/stores/aiStore";
import { MODE_ACCENTS } from "@/constants/modes";
import { SFX } from "@/utils/audioEngine";
import type { ActiveWindow } from "@/stores/modeStore";

export default function TopHUD() {
  const fps = useHUDStore((s) => s.fps);
  const cpu = useHUDStore((s) => s.cpu);
  const mem = useHUDStore((s) => s.mem);
  const utcTime = useHUDStore((s) => s.utcTime);
  const signalStrength = useHUDStore((s) => s.signalStrength);
  const simulateTick = useHUDStore((s) => s.simulateTick);
  const currentMode = useModeStore((s) => s.current);
  const activeWindow = useModeStore((s) => s.activeWindow);
  const accent = MODE_ACCENTS[currentMode];

  const flights = useDataStore((s) => s.flights);
  const earthquakes = useDataStore((s) => s.earthquakes);
  const satelliteTLEs = useDataStore((s) => s.satelliteTLEs);
  const tickerMessages = useAIStore((s) => s.tickerMessages);
  const currentTickerIndex = useAIStore((s) => s.currentTickerIndex);

  const realEntityCount = flights.length + earthquakes.length + satelliteTLEs.length;
  const entityCount = realEntityCount > 0 ? realEntityCount : 8414;

  useEffect(() => {
    const interval = setInterval(simulateTick, 1000);
    return () => clearInterval(interval);
  }, [simulateTick]);

  const activateChanakya = useModeStore((s) => s.activateChanakya);
  const deactivateChanakya = useModeStore((s) => s.deactivateChanakya);

  const handleWindowSwitch = (w: ActiveWindow) => {
    if (w === activeWindow) return;
    SFX.modeSwitch();
    if (w === 'CHANAKYA') {
      activateChanakya();
    } else {
      deactivateChanakya();
    }
  };

  const chanakyaAccent = '#FF9933';

  const feedQuality = useHUDStore((s) => s.feedQuality);
  const latency = useHUDStore((s) => s.latency);

  return (
    <>
      {/* Classification Banner */}
      <div
        className="fixed left-0 right-0 top-0 z-30 flex h-[14px] items-center justify-center"
        style={{
          backgroundColor: activeWindow === 'CHANAKYA' ? 'rgba(255,153,51,0.08)' : 'rgba(255,0,0,0.08)',
          borderBottom: `1px solid ${activeWindow === 'CHANAKYA' ? 'rgba(255,153,51,0.2)' : 'rgba(255,0,0,0.2)'}`,
        }}
      >
        <span
          className="animate-classification-blink text-[7px] font-bold tracking-[3px]"
          style={{ color: activeWindow === 'CHANAKYA' ? 'rgba(255,153,51,0.8)' : 'rgba(255,60,60,0.8)' }}
        >
          {activeWindow === 'CHANAKYA'
            ? 'अत्यन्त गोपनीय // RESTRICTED // BHARAT ONLY'
            : 'TOP SECRET // SI-TK // NOFORN'}
        </span>
      </div>

      {/* Main HUD Bar */}
      <div
        className="fixed left-0 right-0 top-[14px] z-20 flex h-6 items-center justify-between px-3"
        style={{
          backgroundColor: "var(--bg-panel)",
          borderBottom: `1px solid ${activeWindow === 'CHANAKYA' ? chanakyaAccent + '30' : 'var(--border-subtle)'}`,
        }}
      >
      {/* Left: Logo + Window Tabs + live status */}
      <div className="flex items-center gap-2">
        <div
          className="animate-pulse-slow h-[5px] w-[5px] rounded-full"
          style={{
            backgroundColor: activeWindow === 'CHANAKYA' ? chanakyaAccent : "var(--accent-green)",
            boxShadow: `0 0 4px ${activeWindow === 'CHANAKYA' ? chanakyaAccent : "var(--accent-green)"}`,
          }}
        />
        <span className="text-[10px] font-bold tracking-wider" style={{ color: activeWindow === 'CHANAKYA' ? chanakyaAccent : accent }}>
          PRAGYAX
        </span>

        {/* Window Switcher Tabs */}
        <div className="mx-1 h-3 w-px" style={{ backgroundColor: "var(--border-subtle)" }} />
        <div className="flex items-center gap-0">
          <button
            onClick={() => handleWindowSwitch('WORLDVIEW')}
            className="px-2 py-[2px] text-[7px] font-bold tracking-[1px] transition-all cursor-pointer"
            style={{
              color: activeWindow === 'WORLDVIEW' ? '#000' : 'var(--text-dim)',
              backgroundColor: activeWindow === 'WORLDVIEW' ? accent : 'transparent',
              borderRadius: '2px 0 0 2px',
              border: `1px solid ${activeWindow === 'WORLDVIEW' ? accent : 'var(--border-subtle)'}`,
              textShadow: activeWindow === 'WORLDVIEW' ? 'none' : 'none',
            }}
          >
            WORLDVIEW
          </button>
          <button
            onClick={() => handleWindowSwitch('CHANAKYA')}
            className="px-2 py-[2px] text-[7px] font-bold tracking-[1px] transition-all cursor-pointer"
            style={{
              color: activeWindow === 'CHANAKYA' ? '#000' : 'var(--text-dim)',
              backgroundColor: activeWindow === 'CHANAKYA' ? chanakyaAccent : 'transparent',
              borderRadius: '0 2px 2px 0',
              border: `1px solid ${activeWindow === 'CHANAKYA' ? chanakyaAccent : 'var(--border-subtle)'}`,
              textShadow: activeWindow === 'CHANAKYA' ? 'none' : 'none',
            }}
          >
            चाणक्य
          </button>
        </div>
        <div className="mx-1 h-3 w-px" style={{ backgroundColor: "var(--border-subtle)" }} />

        <span className="text-[6px] tracking-[1.5px]" style={{ color: "var(--text-dim)" }}>
          {activeWindow === 'CHANAKYA' ? 'STRATEGIC INTELLIGENCE NETWORK' : 'GEOSPATIAL INTELLIGENCE SYSTEM'}
        </span>
        <div className="mx-2 h-3 w-px" style={{ backgroundColor: "var(--border-subtle)" }} />
        <UplinkIndicator color={activeWindow === 'CHANAKYA' ? chanakyaAccent : "var(--accent-green)"} label={activeWindow === 'CHANAKYA' ? 'अर्थशास्त्र' : 'UPLINK'} />
        {tickerMessages.length > 0 && activeWindow === 'WORLDVIEW' && (
          <>
            <div className="mx-2 h-3 w-px" style={{ backgroundColor: "var(--border-subtle)" }} />
            <span
              className="text-[6px] tracking-[0.5px] max-w-[300px] truncate"
              style={{ color: `${accent}60` }}
            >
              {tickerMessages[currentTickerIndex]}
            </span>
          </>
        )}
      </div>

      {/* Right: Live metrics */}
      <div className="flex items-center gap-3">
        <MetricChip label="SIG" value={`${signalStrength}%`} color={signalStrength > 95 ? "var(--accent-green)" : accent} />
        <MetricChip label="FPS" value={`${fps}`} color={fps >= 58 ? accent : "var(--accent-amber)"} />
        <MetricChip label="CPU" value={`${cpu}%`} color={cpu < 50 ? accent : "var(--accent-amber)"} />
        <MetricChip label="MEM" value={`${mem}%`} color={mem < 80 ? accent : "var(--accent-amber)"} />
        <MetricChip label="ENT" value={entityCount.toLocaleString()} color={accent} />
        <MetricChip label="LAT" value={`${latency}ms`} color={latency < 20 ? "var(--accent-green)" : "var(--accent-amber)"} />
        <MetricChip label="FEED" value={`${feedQuality}%`} color={feedQuality > 97 ? "var(--accent-green)" : "var(--accent-amber)"} />
        <MetricChip label="NET" value="SECURE" color="var(--accent-green)" />
        <div className="mx-1 h-3 w-px" style={{ backgroundColor: "var(--border-subtle)" }} />
        <span className="animate-counter-tick text-[9px] font-bold tabular-nums" style={{ color: activeWindow === 'CHANAKYA' ? chanakyaAccent : accent }}>
          {utcTime}
        </span>
      </div>
      </div>
    </>
  );
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-[4px]">
      <span className="text-[6px] tracking-wider" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      <span className="text-[8px] font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function UplinkIndicator({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-[5px]">
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        {/* Arc 1 — smallest, fastest pulse */}
        <path
          d="M4.5 8 A2.5 2.5 0 0 1 7.5 8"
          stroke={color}
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          className="animate-uplink-1"
        />
        {/* Arc 2 — medium */}
        <path
          d="M3 6.5 A4 4 0 0 1 9 6.5"
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          className="animate-uplink-2"
        />
        {/* Arc 3 — largest, delayed */}
        <path
          d="M1.5 5 A5.5 5.5 0 0 1 10.5 5"
          stroke={color}
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
          className="animate-uplink-3"
        />
        {/* Base dot */}
        <circle cx="6" cy="9" r="1" fill={color} />
      </svg>
      <span className="text-[6px] tracking-wider" style={{ color }}>
        {label} ACTIVE
      </span>
    </div>
  );
}
