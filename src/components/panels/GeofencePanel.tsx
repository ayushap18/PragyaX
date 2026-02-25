"use client";

import { useState, useCallback } from 'react';
import { useModeStore } from '@/stores/modeStore';
import { useGeofenceStore } from '@/stores/exclusiveStores';
import { MODE_ACCENTS } from '@/constants/modes';
import type { Geofence } from '@/stores/exclusiveStores';

export default function GeofencePanel({ onClose }: { onClose: () => void }) {
  const mode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[mode];
  const geofences = useGeofenceStore((s) => s.geofences);
  const breaches = useGeofenceStore((s) => s.breaches);
  const addGeofence = useGeofenceStore((s) => s.addGeofence);
  const removeGeofence = useGeofenceStore((s) => s.removeGeofence);
  const toggleArm = useGeofenceStore((s) => s.toggleArm);
  const [tab, setTab] = useState<'fences' | 'breaches'>('fences');

  const handleQuickCreate = useCallback(() => {
    // Create a preset geofence around a strategic location
    const presets = [
      { name: 'PENTAGON EXCLUSION', vertices: [{ lat: 38.875, lon: -77.060 }, { lat: 38.875, lon: -77.050 }, { lat: 38.868, lon: -77.050 }, { lat: 38.868, lon: -77.060 }] },
      { name: 'CAPITOL RESTRICTED', vertices: [{ lat: 38.893, lon: -77.014 }, { lat: 38.893, lon: -77.004 }, { lat: 38.886, lon: -77.004 }, { lat: 38.886, lon: -77.014 }] },
      { name: 'WHITE HOUSE ZONE', vertices: [{ lat: 38.900, lon: -77.040 }, { lat: 38.900, lon: -77.032 }, { lat: 38.895, lon: -77.032 }, { lat: 38.895, lon: -77.040 }] },
      { name: 'MUMBAI PORT WATCH', vertices: [{ lat: 18.96, lon: 72.82 }, { lat: 18.96, lon: 72.86 }, { lat: 18.94, lon: 72.86 }, { lat: 18.94, lon: 72.82 }] },
      { name: 'DELHI RED ZONE', vertices: [{ lat: 28.65, lon: 77.20 }, { lat: 28.65, lon: 77.25 }, { lat: 28.60, lon: 77.25 }, { lat: 28.60, lon: 77.20 }] },
    ];

    const preset = presets[geofences.length % presets.length];
    const fence: Geofence = {
      id: `gf-${Date.now()}`,
      name: preset.name,
      vertices: preset.vertices,
      rules: {
        onEnter: true,
        onExit: true,
        dwellThresholdSec: 120, // 2 minutes
        speedThresholdKts: null,
      },
      classification: 'SECRET',
      color: ['#FF4444', '#FFB800', '#00CCFF', '#FF00FF', '#00FF88'][geofences.length % 5],
      armed: true,
      createdAt: new Date().toISOString(),
    };

    addGeofence(fence);
  }, [geofences.length, addGeofence]);

  const classColors: Record<string, string> = {
    UNCLASSIFIED: '#00FF88',
    CONFIDENTIAL: '#00CCFF',
    SECRET: '#FFB800',
    'TOP SECRET': '#FF2222',
  };

  return (
    <div
      className="fixed right-0 top-12 bottom-14 w-[380px] z-30 flex flex-col"
      style={{
        backgroundColor: 'rgba(0,0,0,0.92)',
        borderLeft: `1px solid ${accent}30`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${accent}20` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] tracking-[3px] font-bold" style={{ color: accent }}>
            GEOFENCE ENGINE
          </span>
          <span
            className="text-[7px] px-2 py-[1px] rounded-full"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            {geofences.filter((g) => g.armed).length} ARMED
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] px-2 py-1 rounded cursor-pointer hover:brightness-150"
          style={{ color: `${accent}80`, border: `1px solid ${accent}30` }}
        >
          CLOSE
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-3 pt-1" style={{ borderBottom: `1px solid ${accent}10` }}>
        {(['fences', 'breaches'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-[8px] tracking-[2px] px-3 py-1 cursor-pointer"
            style={{
              color: tab === t ? accent : `${accent}40`,
              borderBottom: tab === t ? `2px solid ${accent}` : '2px solid transparent',
            }}
          >
            {t.toUpperCase()}
            {t === 'breaches' && breaches.length > 0 && (
              <span className="ml-1 text-[7px]" style={{ color: '#FF4444' }}>({breaches.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'fences' && (
          <>
            {geofences.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <span className="text-[8px]" style={{ color: `${accent}30` }}>NO GEOFENCES CONFIGURED</span>
                <button
                  onClick={handleQuickCreate}
                  className="text-[8px] px-3 py-1 rounded cursor-pointer hover:brightness-150"
                  style={{ color: accent, border: `1px solid ${accent}40` }}
                >
                  + QUICK CREATE
                </button>
              </div>
            )}

            {geofences.map((fence) => (
              <div
                key={fence.id}
                className="px-3 py-2 relative"
                style={{
                  borderBottom: `1px solid ${accent}08`,
                  borderLeft: `3px solid ${fence.color}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold" style={{ color: '#FFF' }}>
                      {fence.name}
                    </span>
                    <span
                      className="text-[6px] px-1 rounded"
                      style={{
                        backgroundColor: `${classColors[fence.classification]}20`,
                        color: classColors[fence.classification],
                      }}
                    >
                      {fence.classification}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleArm(fence.id)}
                      className="text-[7px] px-2 py-[2px] rounded cursor-pointer hover:brightness-150"
                      style={{
                        color: fence.armed ? '#000' : accent,
                        backgroundColor: fence.armed ? '#FF4444' : 'transparent',
                        border: fence.armed ? 'none' : `1px solid ${accent}30`,
                      }}
                    >
                      {fence.armed ? 'ARMED' : 'DISARMED'}
                    </button>
                    <button
                      onClick={() => removeGeofence(fence.id)}
                      className="text-[7px] px-1 cursor-pointer hover:brightness-150"
                      style={{ color: '#FF444480' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[6px]" style={{ color: `${accent}50` }}>
                    {fence.vertices.length} VERTICES
                  </span>
                  <span className="text-[6px]" style={{ color: `${accent}50` }}>
                    ENTER: {fence.rules.onEnter ? '✓' : '✕'}
                  </span>
                  <span className="text-[6px]" style={{ color: `${accent}50` }}>
                    EXIT: {fence.rules.onExit ? '✓' : '✕'}
                  </span>
                  {fence.rules.dwellThresholdSec && (
                    <span className="text-[6px]" style={{ color: `${accent}50` }}>
                      DWELL: {fence.rules.dwellThresholdSec}s
                    </span>
                  )}
                </div>
              </div>
            ))}

            {geofences.length > 0 && (
              <button
                onClick={handleQuickCreate}
                className="w-full text-[8px] py-2 cursor-pointer hover:brightness-150"
                style={{ color: `${accent}60` }}
              >
                + ADD GEOFENCE
              </button>
            )}
          </>
        )}

        {tab === 'breaches' && (
          <>
            {breaches.length === 0 && (
              <div className="flex items-center justify-center h-40">
                <span className="text-[8px]" style={{ color: `${accent}30` }}>NO BREACHES RECORDED</span>
              </div>
            )}

            {breaches.map((breach, i) => {
              const fence = geofences.find((f) => f.id === breach.fenceId);
              const eventColors: Record<string, string> = {
                ENTER: '#FF4444',
                EXIT: '#FFB800',
                DWELL: '#FF00FF',
                SPEED_EXCEED: '#FF6600',
              };
              return (
                <div
                  key={i}
                  className="px-3 py-2"
                  style={{
                    borderBottom: `1px solid ${accent}08`,
                    borderLeft: `3px solid ${eventColors[breach.event]}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-[2px]">
                    <span
                      className="text-[7px] tracking-[1px] font-bold"
                      style={{ color: eventColors[breach.event] }}
                    >
                      {breach.event}
                    </span>
                    <span className="text-[8px] font-bold" style={{ color: '#FFF' }}>
                      {breach.entityId}
                    </span>
                    <span className="text-[7px]" style={{ color: `${accent}50` }}>
                      ({breach.entityType})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[7px]" style={{ color: `${accent}60` }}>
                      Fence: {fence?.name || breach.fenceId}
                    </span>
                    <span className="text-[6px] font-mono" style={{ color: `${accent}40` }}>
                      {breach.timestamp.replace('T', ' ').slice(0, 19)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-1"
        style={{ borderTop: `1px solid ${accent}15` }}
      >
        <span className="text-[6px]" style={{ color: `${accent}40` }}>
          FENCES: {geofences.length} • BREACHES: {breaches.length}
        </span>
        <span className="text-[6px] font-mono" style={{ color: `${accent}30` }}>
          EVAL: 1Hz • RAY-CAST
        </span>
      </div>
    </div>
  );
}
