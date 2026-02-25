"use client";

import { useState, useCallback } from 'react';
import { useModeStore } from '@/stores/modeStore';
import { useMissionStore } from '@/stores/exclusiveStores';
import { MODE_ACCENTS } from '@/constants/modes';
import type { Mission } from '@/stores/exclusiveStores';

const PRESET_MISSIONS: Omit<Mission, 'id' | 'createdAt' | 'lastModified'>[] = [
  {
    name: 'OPERATION SILENT WATCH',
    classification: 'SECRET',
    status: 'PLANNING',
    phases: [
      {
        name: 'INSERTION',
        waypoints: [
          { lat: 28.5665, lon: 77.2440, alt: 0, action: 'DEPLOY', timeWindow: '0200-0215 IST' },
          { lat: 28.5700, lon: 77.2300, alt: 0, action: 'CHECKPOINT', timeWindow: '0220-0225 IST' },
        ],
        route: [
          { lat: 28.5665, lon: 77.2440 },
          { lat: 28.5680, lon: 77.2380 },
          { lat: 28.5700, lon: 77.2300 },
        ],
      },
      {
        name: 'OBSERVATION',
        waypoints: [
          { lat: 28.5700, lon: 77.2300, alt: 0, action: 'OVERWATCH', timeWindow: '0225-0400 IST' },
        ],
        route: [],
      },
      {
        name: 'EXTRACTION',
        waypoints: [
          { lat: 28.5650, lon: 77.2500, alt: 0, action: 'EXTRACT', timeWindow: '0400-0415 IST' },
        ],
        route: [
          { lat: 28.5700, lon: 77.2300 },
          { lat: 28.5680, lon: 77.2400 },
          { lat: 28.5650, lon: 77.2500 },
        ],
      },
    ],
    assets: [
      { callsign: 'SHADOW-1', type: 'ISR TEAM', role: 'PRIMARY COLLECTION' },
      { callsign: 'EAGLE-3', type: 'UAV', role: 'OVERWATCH' },
      { callsign: 'BASE-ALPHA', type: 'C2 NODE', role: 'COMMAND' },
    ],
    zones: [
      {
        type: 'INSERTION',
        polygon: [
          { lat: 28.567, lon: 77.243 }, { lat: 28.567, lon: 77.246 },
          { lat: 28.565, lon: 77.246 }, { lat: 28.565, lon: 77.243 },
        ],
        color: '#00FF88',
      },
      {
        type: 'DANGER',
        polygon: [
          { lat: 28.572, lon: 77.225 }, { lat: 28.572, lon: 77.235 },
          { lat: 28.568, lon: 77.235 }, { lat: 28.568, lon: 77.225 },
        ],
        color: '#FF4444',
      },
      {
        type: 'EXTRACTION',
        polygon: [
          { lat: 28.566, lon: 77.249 }, { lat: 28.566, lon: 77.252 },
          { lat: 28.564, lon: 77.252 }, { lat: 28.564, lon: 77.249 },
        ],
        color: '#FFB800',
      },
    ],
  },
  {
    name: 'OPERATION BLUE HORIZON',
    classification: 'TOP SECRET',
    status: 'PLANNING',
    phases: [
      {
        name: 'MARITIME APPROACH',
        waypoints: [
          { lat: 18.93, lon: 72.80, alt: 0, action: 'STAGING', timeWindow: '2200-2230 IST' },
          { lat: 18.95, lon: 72.83, alt: 0, action: 'INSERTION', timeWindow: '2300-2315 IST' },
        ],
        route: [
          { lat: 18.93, lon: 72.80 }, { lat: 18.94, lon: 72.82 }, { lat: 18.95, lon: 72.83 },
        ],
      },
    ],
    assets: [
      { callsign: 'TRIDENT-6', type: 'SEAL TEAM', role: 'ASSAULT' },
      { callsign: 'POSEIDON-1', type: 'SSN', role: 'INSERTION PLATFORM' },
    ],
    zones: [
      {
        type: 'NO_FLY',
        polygon: [
          { lat: 18.96, lon: 72.82 }, { lat: 18.96, lon: 72.86 },
          { lat: 18.93, lon: 72.86 }, { lat: 18.93, lon: 72.82 },
        ],
        color: '#FF0000',
      },
    ],
  },
];

export default function MissionPlanner({ onClose }: { onClose: () => void }) {
  const mode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[mode];
  const missions = useMissionStore((s) => s.missions);
  const activeMission = useMissionStore((s) => s.activeMission);
  const addMission = useMissionStore((s) => s.addMission);
  const removeMission = useMissionStore((s) => s.removeMission);
  const setActiveMission = useMissionStore((s) => s.setActiveMission);
  const updateMissionStatus = useMissionStore((s) => s.updateMissionStatus);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);

  const handleLoadPreset = useCallback((idx: number) => {
    const preset = PRESET_MISSIONS[idx];
    const mission: Mission = {
      ...preset,
      id: `msn-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    addMission(mission);
  }, [addMission]);

  const statusColors: Record<string, string> = {
    PLANNING: '#00CCFF',
    BRIEFED: '#FFB800',
    ACTIVE: '#00FF88',
    COMPLETE: '#888888',
    ABORTED: '#FF4444',
  };

  const classColors: Record<string, string> = {
    UNCLASSIFIED: '#00FF88',
    CONFIDENTIAL: '#00CCFF',
    SECRET: '#FFB800',
    'TOP SECRET': '#FF2222',
  };

  const zoneTypeIcons: Record<string, string> = {
    INSERTION: '▼',
    EXTRACTION: '▲',
    HOLDING: '◻',
    DANGER: '⚠',
    NO_FLY: '✕',
  };

  const selected = missions.find((m) => m.id === selectedMission);

  return (
    <div
      className="fixed right-0 top-12 bottom-14 w-[400px] z-30 flex flex-col"
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
        <span className="text-[9px] tracking-[3px] font-bold" style={{ color: accent }}>
          MISSION PLANNER
        </span>
        <button
          onClick={onClose}
          className="text-[10px] px-2 py-1 rounded cursor-pointer hover:brightness-150"
          style={{ color: `${accent}80`, border: `1px solid ${accent}30` }}
        >
          CLOSE
        </button>
      </div>

      {!selected ? (
        <>
          {/* Mission list */}
          <div className="flex-1 overflow-y-auto">
            {missions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <span className="text-[8px]" style={{ color: `${accent}30` }}>NO MISSIONS</span>
              </div>
            )}

            {missions.map((mission) => (
              <button
                key={mission.id}
                onClick={() => setSelectedMission(mission.id)}
                className="w-full text-left px-3 py-2 cursor-pointer hover:brightness-125"
                style={{
                  borderBottom: `1px solid ${accent}08`,
                  borderLeft: `3px solid ${statusColors[mission.status]}`,
                  backgroundColor: mission.id === activeMission ? `${accent}08` : 'transparent',
                }}
              >
                <div className="flex items-center gap-2 mb-[2px]">
                  <span className="text-[8px] font-bold" style={{ color: '#FFF' }}>{mission.name}</span>
                  <span className="text-[6px] px-1 rounded" style={{
                    backgroundColor: `${classColors[mission.classification]}20`,
                    color: classColors[mission.classification],
                  }}>
                    {mission.classification}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[7px]" style={{ color: statusColors[mission.status] }}>{mission.status}</span>
                  <span className="text-[6px]" style={{ color: `${accent}50` }}>{mission.phases.length} PHASES</span>
                  <span className="text-[6px]" style={{ color: `${accent}50` }}>{mission.assets.length} ASSETS</span>
                  <span className="text-[6px]" style={{ color: `${accent}50` }}>{mission.zones.length} ZONES</span>
                </div>
              </button>
            ))}
          </div>

          {/* Preset buttons */}
          <div className="px-3 py-2" style={{ borderTop: `1px solid ${accent}15` }}>
            <span className="text-[6px] tracking-[2px] block mb-1" style={{ color: `${accent}40` }}>
              LOAD PRESET
            </span>
            <div className="flex gap-2">
              {PRESET_MISSIONS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleLoadPreset(i)}
                  className="text-[7px] px-2 py-1 rounded cursor-pointer hover:brightness-150"
                  style={{ color: accent, border: `1px solid ${accent}30` }}
                >
                  {p.name.split(' ').slice(1).join(' ')}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Mission detail */}
          <button
            onClick={() => setSelectedMission(null)}
            className="text-[7px] px-3 py-1 cursor-pointer hover:brightness-150 text-left"
            style={{ color: `${accent}60`, borderBottom: `1px solid ${accent}10` }}
          >
            ← BACK TO LIST
          </button>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            {/* Mission header */}
            <div className="mb-3">
              <h3 className="text-[10px] font-bold mb-1" style={{ color: '#FFF' }}>{selected.name}</h3>
              <div className="flex items-center gap-3">
                <span className="text-[7px] px-2 py-[1px] rounded" style={{
                  backgroundColor: `${statusColors[selected.status]}20`,
                  color: statusColors[selected.status],
                }}>
                  {selected.status}
                </span>
                <span className="text-[7px]" style={{
                  color: classColors[selected.classification],
                }}>
                  {selected.classification}
                </span>
              </div>
            </div>

            {/* Phases */}
            <div className="mb-3">
              <span className="text-[7px] tracking-[2px] block mb-1" style={{ color: `${accent}50` }}>PHASES</span>
              {selected.phases.map((phase, i) => (
                <div key={i} className="mb-2 pl-2" style={{ borderLeft: `2px solid ${accent}30` }}>
                  <span className="text-[8px] font-bold block" style={{ color: accent }}>{phase.name}</span>
                  {phase.waypoints.map((wp, w) => (
                    <div key={w} className="flex items-center gap-2 ml-2">
                      <span className="text-[6px]" style={{ color: `${accent}40` }}>WP{w + 1}</span>
                      <span className="text-[6px] font-mono" style={{ color: `${accent}60` }}>
                        {wp.lat.toFixed(4)}°N {wp.lon.toFixed(4)}°E
                      </span>
                      <span className="text-[6px]" style={{ color: '#FFB800' }}>{wp.action}</span>
                      <span className="text-[6px]" style={{ color: `${accent}30` }}>{wp.timeWindow}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Assets */}
            <div className="mb-3">
              <span className="text-[7px] tracking-[2px] block mb-1" style={{ color: `${accent}50` }}>ASSETS</span>
              {selected.assets.map((asset, i) => (
                <div key={i} className="flex items-center gap-3 ml-2 mb-[2px]">
                  <span className="text-[7px] font-bold" style={{ color: '#FFF' }}>{asset.callsign}</span>
                  <span className="text-[6px]" style={{ color: `${accent}60` }}>{asset.type}</span>
                  <span className="text-[6px]" style={{ color: `${accent}40` }}>{asset.role}</span>
                </div>
              ))}
            </div>

            {/* Zones */}
            <div className="mb-3">
              <span className="text-[7px] tracking-[2px] block mb-1" style={{ color: `${accent}50` }}>ZONES</span>
              {selected.zones.map((zone, i) => (
                <div key={i} className="flex items-center gap-2 ml-2 mb-[2px]">
                  <span className="text-[8px]" style={{ color: zone.color }}>
                    {zoneTypeIcons[zone.type] || '◻'}
                  </span>
                  <span className="text-[7px]" style={{ color: zone.color }}>{zone.type}</span>
                  <span className="text-[6px]" style={{ color: `${accent}40` }}>
                    {zone.polygon.length} VERTICES
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: `1px solid ${accent}15` }}>
            <button
              onClick={() => {
                setActiveMission(selected.id);
                updateMissionStatus(selected.id, 'ACTIVE');
              }}
              className="text-[7px] px-3 py-1 rounded cursor-pointer hover:brightness-150"
              style={{ color: '#000', backgroundColor: '#00FF88' }}
            >
              ACTIVATE
            </button>
            <button
              onClick={() => updateMissionStatus(selected.id, 'ABORTED')}
              className="text-[7px] px-3 py-1 rounded cursor-pointer hover:brightness-150"
              style={{ color: '#FF4444', border: '1px solid #FF444440' }}
            >
              ABORT
            </button>
            <button
              onClick={() => { removeMission(selected.id); setSelectedMission(null); }}
              className="text-[7px] px-3 py-1 rounded cursor-pointer hover:brightness-150"
              style={{ color: `${accent}40`, border: `1px solid ${accent}20` }}
            >
              DELETE
            </button>
          </div>
        </>
      )}
    </div>
  );
}
