"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useModeStore } from '@/stores/modeStore';
import { MODE_ACCENTS } from '@/constants/modes';
import { CAMERAS } from '@/constants/cameras';
import { useMapStore } from '@/stores/mapStore';

type GridLayout = '2x2' | '2x3' | '3x3';

interface CameraTile {
  id: string;
  label: string;
  city: string;
  lat: number;
  lon: number;
  direction: string;
  status: 'live' | 'stale' | 'offline';
  vehicleCount: number;
  trafficFlow: string;
  threatLevel: number;
  lastAnalysis: number;
}

export default function SurveillanceGrid({ onClose }: { onClose: () => void }) {
  const mode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[mode];
  const currentCity = useMapStore((s) => s.currentCity);
  const [layout, setLayout] = useState<GridLayout>('2x2');
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateInterval] = useState(5);
  const [rotateOffset, setRotateOffset] = useState(0);
  const [selectedCameras, setSelectedCameras] = useState<CameraTile[]>([]);

  // Initialize cameras when city changes
  useEffect(() => {
    const cityCams = CAMERAS.filter((c) => c.city === currentCity).slice(0, 9);
    setSelectedCameras(cityCams.map((cam) => ({
      id: cam.id,
      label: cam.label,
      city: cam.city,
      lat: cam.lat,
      lon: cam.lon,
      direction: cam.direction,
      status: 'live' as const,
      vehicleCount: Math.floor(5 + Math.random() * 50),
      trafficFlow: ['FREE', 'MODERATE', 'HEAVY'][Math.floor(Math.random() * 3)],
      threatLevel: 0,
      lastAnalysis: Date.now(),
    })));
    setRotateOffset(0);
  }, [currentCity]);

  const gridCount = layout === '2x2' ? 4 : layout === '2x3' ? 6 : 9;
  const gridCols = layout === '3x3' ? 3 : 2;

  // Auto-rotate cameras
  useEffect(() => {
    if (!autoRotate || selectedCameras.length <= gridCount) return;
    const timer = setInterval(() => {
      setRotateOffset((prev) => (prev + gridCount) % selectedCameras.length);
    }, rotateInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRotate, rotateInterval, selectedCameras.length, gridCount]);

  // Simulate live updates
  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedCameras((prev) =>
        prev.map((cam) => ({
          ...cam,
          vehicleCount: Math.max(0, cam.vehicleCount + Math.floor((Math.random() - 0.5) * 8)),
          trafficFlow: Math.random() > 0.9
            ? ['FREE', 'MODERATE', 'HEAVY'][Math.floor(Math.random() * 3)]
            : cam.trafficFlow,
          lastAnalysis: Date.now(),
        }))
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const visibleCameras = selectedCameras.slice(rotateOffset, rotateOffset + gridCount);
  // Wrap around if needed
  const displayCams = visibleCameras.length < gridCount
    ? [...visibleCameras, ...selectedCameras.slice(0, gridCount - visibleCameras.length)]
    : visibleCameras;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: `1px solid ${accent}30` }}
      >
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: '#FF4444' }} />
          <span className="text-[10px] tracking-[4px] font-bold" style={{ color: accent }}>
            SURVEILLANCE GRID — {currentCity.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid layout selector */}
          {(['2x2', '2x3', '3x3'] as GridLayout[]).map((g) => (
            <button
              key={g}
              onClick={() => setLayout(g)}
              className="text-[8px] px-2 py-1 rounded cursor-pointer hover:brightness-150"
              style={{
                color: layout === g ? '#000' : `${accent}80`,
                backgroundColor: layout === g ? accent : 'transparent',
                border: `1px solid ${accent}30`,
              }}
            >
              {g}
            </button>
          ))}

          {/* Auto-rotate toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="text-[8px] px-2 py-1 rounded cursor-pointer hover:brightness-150"
            style={{
              color: autoRotate ? '#000' : `${accent}80`,
              backgroundColor: autoRotate ? accent : 'transparent',
              border: `1px solid ${accent}30`,
            }}
          >
            AUTO {rotateInterval}s
          </button>

          <button
            onClick={onClose}
            className="text-[10px] px-3 py-1 rounded cursor-pointer hover:brightness-150"
            style={{ color: '#FF4444', border: '1px solid #FF444440' }}
          >
            EXIT
          </button>
        </div>
      </div>

      {/* Camera Grid */}
      <div
        className="flex-1 p-2 gap-2"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridAutoRows: '1fr',
        }}
      >
        {displayCams.map((cam) => (
          <CameraTileView key={cam.id} cam={cam} accent={accent} />
        ))}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-1"
        style={{ borderTop: `1px solid ${accent}20` }}
      >
        <span className="text-[7px]" style={{ color: `${accent}60` }}>
          {selectedCameras.length} CAMERAS AVAILABLE • {displayCams.filter((c) => c.status === 'live').length} LIVE
        </span>
        <span className="text-[7px] font-mono tabular-nums" style={{ color: `${accent}40` }}>
          {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
        </span>
      </div>
    </div>
  );
}

function CameraTileView({ cam, accent }: { cam: CameraTile; accent: string }) {
  const flowColors: Record<string, string> = {
    FREE: '#00FF88',
    MODERATE: '#FFB800',
    HEAVY: '#FF4444',
  };
  const flowColor = flowColors[cam.trafficFlow] || accent;

  return (
    <div
      className="relative rounded overflow-hidden flex flex-col"
      style={{ border: `1px solid ${accent}20`, backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      {/* Camera feed area (simulated) */}
      <div className="flex-1 relative min-h-0 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,10,20,0.9)' }}
      >
        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)`,
          }}
        />

        {/* Camera label */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <div className="h-[5px] w-[5px] rounded-full" style={{
            backgroundColor: cam.status === 'live' ? '#FF4444' : '#666',
            boxShadow: cam.status === 'live' ? '0 0 4px #FF4444' : 'none',
            animation: cam.status === 'live' ? 'pulse 2s infinite' : 'none',
          }} />
          <span className="text-[8px] tracking-[1px] font-bold" style={{ color: '#FFF' }}>
            {cam.id.toUpperCase()}
          </span>
        </div>

        {/* Timestamp overlay */}
        <div className="absolute top-2 right-2">
          <span className="text-[7px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {new Date(cam.lastAnalysis).toISOString().slice(11, 19)}
          </span>
        </div>

        {/* Center crosshair */}
        <svg width="40" height="40" viewBox="0 0 40 40" className="opacity-20">
          <line x1="20" y1="5" x2="20" y2="15" stroke={accent} strokeWidth="0.5" />
          <line x1="20" y1="25" x2="20" y2="35" stroke={accent} strokeWidth="0.5" />
          <line x1="5" y1="20" x2="15" y2="20" stroke={accent} strokeWidth="0.5" />
          <line x1="25" y1="20" x2="35" y2="20" stroke={accent} strokeWidth="0.5" />
          <circle cx="20" cy="20" r="8" stroke={accent} strokeWidth="0.5" fill="none" />
        </svg>

        {/* Camera label bottom */}
        <div className="absolute bottom-2 left-2">
          <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {cam.label}
          </span>
          <span className="text-[7px] ml-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {cam.city} • {cam.direction}
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div
        className="flex items-center justify-between px-2 py-[3px]"
        style={{ borderTop: `1px solid ${accent}15`, backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[7px]" style={{ color: `${accent}80` }}>
            VEH: <span style={{ color: accent }}>{cam.vehicleCount}</span>
          </span>
          <span className="text-[7px]" style={{ color: flowColor }}>
            {cam.trafficFlow}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-[4px] w-[4px] rounded-full" style={{
            backgroundColor: accent,
            animation: 'pulse 3s infinite',
          }} />
          <span className="text-[6px]" style={{ color: `${accent}60` }}>AI ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
