"use client";

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useModeStore } from '@/stores/modeStore';
import { useTemporalStore } from '@/stores/exclusiveStores';
import { MODE_ACCENTS } from '@/constants/modes';

export default function TimelineScrubber() {
  const mode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[mode];
  const playbackTime = useTemporalStore((s) => s.playbackTime);
  const playbackSpeed = useTemporalStore((s) => s.playbackSpeed);
  const isPlaying = useTemporalStore((s) => s.isPlaying);
  const temporalMode = useTemporalStore((s) => s.mode);
  const setPlaybackTime = useTemporalStore((s) => s.setPlaybackTime);
  const setPlaybackSpeed = useTemporalStore((s) => s.setPlaybackSpeed);
  const togglePlaying = useTemporalStore((s) => s.togglePlaying);
  const setMode = useTemporalStore((s) => s.setMode);

  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const lastTick = useRef(0);

  // Advance playback time when playing
  useEffect(() => {
    if (!isPlaying || temporalMode !== 'replay') return;

    const tick = () => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      setPlaybackTime(playbackTime + dt * playbackSpeed);
      animRef.current = requestAnimationFrame(tick);
    };
    lastTick.current = Date.now();
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, temporalMode, playbackSpeed, playbackTime, setPlaybackTime]);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    // Map 0-1 to 24h range ending at now
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const time = now - dayMs + pct * dayMs;
    setPlaybackTime(time);
    if (temporalMode !== 'replay') setMode('replay');
  }, [setPlaybackTime, setMode, temporalMode]);

  const cycleSpeed = useCallback(() => {
    const speeds: (1 | 2 | 4 | 16)[] = [1, 2, 4, 16];
    const idx = speeds.indexOf(playbackSpeed);
    setPlaybackSpeed(speeds[(idx + 1) % speeds.length]);
  }, [playbackSpeed, setPlaybackSpeed]);

  const goLive = useCallback(() => {
    setMode('live');
    setPlaybackTime(Date.now());
  }, [setMode, setPlaybackTime]);

  const { progress, timeStr } = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const p = Math.max(0, Math.min(1, (playbackTime - (now - dayMs)) / dayMs));
    const t = new Date(playbackTime).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    return { progress: p, timeStr: t };
  }, [playbackTime]);

  if (temporalMode === 'live') {
    return (
      <div
        className="flex items-center gap-2 px-3 py-[3px] cursor-pointer hover:brightness-125"
        onClick={() => { setMode('replay'); setPlaybackTime(Date.now()); }}
        title="Click to enter temporal replay mode"
      >
        <div className="h-[5px] w-[5px] rounded-full animate-pulse" style={{ backgroundColor: '#FF4444' }} />
        <span className="text-[7px] tracking-[1px]" style={{ color: `${accent}80` }}>LIVE</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-[3px]"
      style={{ borderTop: `1px solid ${accent}10` }}
    >
      {/* Play/Pause */}
      <button
        onClick={togglePlaying}
        className="text-[10px] cursor-pointer hover:brightness-150"
        style={{ color: accent }}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Speed */}
      <button
        onClick={cycleSpeed}
        className="text-[7px] px-1 rounded cursor-pointer hover:brightness-150"
        style={{ color: accent, border: `1px solid ${accent}30` }}
        title="Cycle playback speed"
      >
        {playbackSpeed}x
      </button>

      {/* Timeline track */}
      <div
        ref={trackRef}
        className="flex-1 h-[6px] rounded-full relative cursor-pointer"
        style={{ backgroundColor: `${accent}15` }}
        onClick={handleTrackClick}
      >
        {/* Hour markers */}
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${(i / 24) * 100}%`, backgroundColor: `${accent}10` }}
          />
        ))}
        {/* Progress */}
        <div
          className="absolute top-0 bottom-0 left-0 rounded-full"
          style={{ width: `${progress * 100}%`, backgroundColor: `${accent}30` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[10px] w-[10px] rounded-full"
          style={{
            left: `calc(${progress * 100}% - 5px)`,
            backgroundColor: accent,
            boxShadow: `0 0 6px ${accent}`,
          }}
        />
      </div>

      {/* Timestamp */}
      <span className="text-[6px] font-mono tabular-nums whitespace-nowrap" style={{ color: `${accent}70` }}>
        {timeStr}
      </span>

      {/* Live button */}
      <button
        onClick={goLive}
        className="text-[7px] px-2 py-[2px] rounded cursor-pointer hover:brightness-150"
        style={{ color: '#FF4444', border: '1px solid #FF444440' }}
      >
        LIVE
      </button>
    </div>
  );
}
