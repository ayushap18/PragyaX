"use client";

import { useState } from "react";
import { useDataStore } from "@/stores/dataStore";
import { useLayerStore } from "@/stores/layerStore";
import { useHUDStore } from "@/stores/hudStore";
import { CHANAKYA_COLORS, ISRO_SATELLITE_PATTERNS, CYCLONE_WATCH, NODE_TYPE_COLORS } from "@/constants/chanakya";
import { SFX } from "@/utils/audioEngine";
import type { LayerName } from "@/types";

const saffron = CHANAKYA_COLORS.saffron;

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-[5px]">
      <span className="text-[7px] font-semibold tracking-[1.5px]" style={{ color: `${saffron}90` }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: `${saffron}26` }} />
    </div>
  );
}

function Divider() {
  return <div className="h-px mx-3" style={{ backgroundColor: `${saffron}15` }} />;
}

const OPS_BUTTONS = [
  { id: 'RECON', label: 'टोही', icon: '🔭' },
  { id: 'SIGINT', label: 'संकेत', icon: '📡' },
  { id: 'HUMINT', label: 'मानव', icon: '👤' },
  { id: 'GEOINT', label: 'भू-स्थान', icon: '🌍' },
  { id: 'OSINT', label: 'मुक्त', icon: '📰' },
  { id: 'CYBER', label: 'साइबर', icon: '💻' },
  { id: 'ELINT', label: 'विद्युत', icon: '⚡' },
  { id: 'MASINT', label: 'मापन', icon: '📊' },
];

export default function ChanakyaRightPanel() {
  const utcTime = useHUDStore((s) => s.utcTime);
  const satelliteTLEs = useDataStore((s) => s.satelliteTLEs);
  const flights = useDataStore((s) => s.flights);
  const earthquakes = useDataStore((s) => s.earthquakes);
  const layers = useLayerStore((s) => s.layers);
  const toggleLayer = useLayerStore((s) => s.toggleLayer);
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const [sessionId] = useState(() => Math.floor(Date.now() / 100000) % 10000);

  // ISRO satellite count
  const isroSats = satelliteTLEs.filter((t) => {
    const upper = t.name.toUpperCase();
    return ISRO_SATELLITE_PATTERNS.some((p) => upper.includes(p));
  });
  const navicRaw = isroSats.filter(
    (t) => t.name.toUpperCase().includes('IRNSS') || t.name.toUpperCase().includes('NVS-')
  ).length;
  const navicCount = Math.min(navicRaw, 7); // NavIC constellation = 7 operational slots

  // India flights for RECON op
  const indiaFlights = flights.filter(
    (f) => f.lat >= 6.5 && f.lat <= 37.5 && f.lon >= 68 && f.lon <= 97.5
  );

  // India earthquakes for OSINT op
  const indiaQuakes = earthquakes.filter(
    (e) => e.lat >= 6.5 && e.lat <= 37.5 && e.lon >= 68 && e.lon <= 97.5
  );

  return (
    <div
      className="fixed bottom-[110px] right-0 top-6 z-10 flex w-[220px] flex-col overflow-y-auto overflow-x-hidden scrollbar-hide"
      style={{
        backgroundColor: CHANAKYA_COLORS.panel,
        borderLeft: `1px solid ${saffron}20`,
        overscrollBehavior: 'contain',
      }}
    >
      {/* Mode Header */}
      <div className="relative flex items-center justify-between px-3 py-3">
        <span
          className="text-[16px] font-bold tracking-wider"
          style={{ color: saffron, textShadow: `0 0 12px ${saffron}60` }}
        >
          चाणक्य
        </span>
        <span className="text-[7px]" style={{ color: `${saffron}60` }}>CHANAKYA</span>
      </div>

      {/* Recording */}
      <div className="flex flex-col gap-[3px] px-3 py-1">
        <div className="flex items-center gap-2">
          <div
            className="h-[5px] w-[5px] rounded-full animate-blink-rec"
            style={{ backgroundColor: CHANAKYA_COLORS.alertRed, boxShadow: `0 0 4px ${CHANAKYA_COLORS.alertRed}` }}
          />
          <span className="text-[7px] tabular-nums" style={{ color: "#FFF" }}>
            REC {utcTime}
          </span>
        </div>
        <span className="text-[6px] tabular-nums" style={{ color: `${saffron}50` }}>
          OPS-{sessionId} {"//"} BHARAT SECTOR
        </span>
      </div>

      <Divider />

      {/* Operations Grid */}
      <SectionHeader label="कार्य केंद्र — OPERATIONS" />
      <div className="grid grid-cols-4 gap-1 px-3 py-1">
        {OPS_BUTTONS.map((op) => (
          <button
            key={op.id}
            onClick={() => {
              SFX.click();
              setSelectedOp(selectedOp === op.id ? null : op.id);
            }}
            className="flex flex-col items-center rounded-sm py-1 cursor-pointer transition-all hover:brightness-125"
            style={{
              backgroundColor: selectedOp === op.id ? `${saffron}25` : `${saffron}08`,
              border: `1px solid ${selectedOp === op.id ? saffron : `${saffron}20`}`,
            }}
          >
            <span className="text-[10px]">{op.icon}</span>
            <span className="text-[5px]" style={{ color: selectedOp === op.id ? saffron : `${saffron}60` }}>
              {op.id}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Operation Detail */}
      {selectedOp && (
        <div className="mx-3 my-1 rounded-sm p-2" style={{ backgroundColor: `${saffron}08`, border: `1px solid ${saffron}15` }}>
          <span className="text-[7px] font-bold tracking-wider" style={{ color: saffron }}>
            {selectedOp} INTEL
          </span>
          <div className="mt-1 flex flex-col gap-[2px]">
            {selectedOp === 'RECON' && (
              <>
                <span className="text-[6px]" style={{ color: `${saffron}70` }}>
                  {indiaFlights.length} contacts in India airspace
                </span>
                {indiaFlights.slice(0, 4).map((f) => (
                  <span key={f.icao24} className="text-[5px]" style={{ color: `${saffron}50` }}>
                    {f.callsign || f.icao24} — {f.altitudeFt.toFixed(0)}ft {f.velocityKts.toFixed(0)}kts
                  </span>
                ))}
              </>
            )}
            {selectedOp === 'OSINT' && (
              <>
                <span className="text-[6px]" style={{ color: `${saffron}70` }}>
                  {indiaQuakes.length} seismic events in India region
                </span>
                {indiaQuakes.slice(0, 3).map((e) => (
                  <span key={e.id} className="text-[5px]" style={{ color: `${saffron}50` }}>
                    M{e.magnitude.toFixed(1)} — {e.place.slice(0, 30)}
                  </span>
                ))}
              </>
            )}
            {selectedOp === 'GEOINT' && (
              <span className="text-[6px]" style={{ color: `${saffron}70` }}>
                {isroSats.length} ISRO satellites tracked
              </span>
            )}
            {!['RECON', 'OSINT', 'GEOINT'].includes(selectedOp) && (
              <span className="text-[6px]" style={{ color: `${saffron}50` }}>
                {selectedOp} module active — awaiting data stream...
              </span>
            )}
          </div>
        </div>
      )}

      <Divider />

      {/* NavIC Constellation Status */}
      <SectionHeader label="NavIC — NAVIGATION" />
      <div className="flex items-center gap-2 px-3 py-1">
        <div className="flex gap-[3px]">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="h-[6px] w-[6px] rounded-full"
              style={{
                backgroundColor: i < navicCount ? CHANAKYA_COLORS.chakra : `${saffron}20`,
                boxShadow: i < navicCount ? `0 0 4px ${CHANAKYA_COLORS.chakra}` : 'none',
              }}
            />
          ))}
        </div>
        <span className="text-[7px] tabular-nums" style={{ color: navicCount >= 4 ? CHANAKYA_COLORS.green : saffron }}>
          {navicCount >= 4 ? 'LOCK' : 'ACQUIRING'} ({navicCount}/7)
        </span>
      </div>

      <Divider />

      {/* ISRO Satellite Tracker */}
      <SectionHeader label="अंतरिक्ष — ISRO TRACKER" />
      <div className="flex flex-col gap-[2px] px-3 py-1 max-h-[80px] overflow-y-auto scrollbar-hide">
        {isroSats.length === 0 ? (
          <span className="text-[6px]" style={{ color: `${saffron}40` }}>LOADING TLE DATA...</span>
        ) : (
          isroSats.slice(0, 8).map((sat) => (
            <div key={sat.noradId} className="flex items-center gap-1">
              <div className="h-[3px] w-[3px] rounded-full" style={{
                backgroundColor: sat.name.toUpperCase().includes('IRNSS') || sat.name.toUpperCase().includes('NAVIC') ? CHANAKYA_COLORS.chakra : saffron,
              }} />
              <span className="text-[6px] truncate" style={{ color: `${saffron}70` }}>{sat.name}</span>
            </div>
          ))
        )}
        {isroSats.length > 8 && (
          <span className="text-[5px]" style={{ color: `${saffron}40` }}>
            +{isroSats.length - 8} more satellites
          </span>
        )}
      </div>

      <Divider />

      {/* Cyclone Watch */}
      <SectionHeader label="चक्रवात — CYCLONE WATCH" />
      <div className="flex flex-col gap-[2px] px-3 py-1">
        <div className="flex items-center justify-between">
          <span className="text-[6px]" style={{ color: `${saffron}60` }}>BAY OF BENGAL</span>
          <span className="text-[6px]" style={{ color: CHANAKYA_COLORS.green }}>{CYCLONE_WATCH.bayOfBengal}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[6px]" style={{ color: `${saffron}60` }}>ARABIAN SEA</span>
          <span className="text-[6px]" style={{ color: CHANAKYA_COLORS.green }}>{CYCLONE_WATCH.arabianSea}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[6px]" style={{ color: `${saffron}60` }}>IMD STATUS</span>
          <span className="text-[6px]" style={{ color: CHANAKYA_COLORS.green }}>{CYCLONE_WATCH.imdStatus}</span>
        </div>
      </div>

      <Divider />

      {/* India Layers Toggle */}
      <SectionHeader label="स्तर — INDIA LAYERS" />
      <div className="flex flex-col gap-[2px] px-3 py-1">
        {(['aqi', 'isro', 'borders', 'strategic', 'earthquakes'] as LayerName[]).map((layerId) => {
          const layer = layers[layerId];
          const labels: Record<string, string> = {
            aqi: 'AQI STATIONS',
            isro: 'ISRO SATELLITES',
            borders: 'INDIA BORDERS',
            strategic: 'STRATEGIC NODES',
            earthquakes: 'SEISMIC EVENTS',
          };
          return (
            <button
              key={layerId}
              onClick={() => { SFX.toggle(); toggleLayer(layerId); }}
              className="flex items-center gap-2 py-[2px] cursor-pointer"
            >
              <div
                className="h-[4px] w-[4px] rounded-sm"
                style={{
                  backgroundColor: layer.enabled ? saffron : 'transparent',
                  border: `1px solid ${layer.enabled ? saffron : `${saffron}40`}`,
                }}
              />
              <span className="text-[6px]" style={{ color: layer.enabled ? saffron : `${saffron}40` }}>
                {labels[layerId]}
              </span>
              {layer.count > 0 && (
                <span className="text-[5px] tabular-nums ml-auto" style={{ color: `${saffron}40` }}>
                  {layer.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Divider />

      {/* Legend */}
      <SectionHeader label="संकेत — LEGEND" />
      <div className="flex flex-col gap-[2px] px-3 py-1">
        {Object.entries(NODE_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="h-[4px] w-[4px] rotate-45" style={{ backgroundColor: color }} />
            <span className="text-[6px] uppercase" style={{ color: `${saffron}60` }}>{type}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto flex flex-col">
        <div className="h-px" style={{ backgroundColor: `${saffron}15` }} />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[5px] tracking-[1px]" style={{ color: `${saffron}30` }}>
            DOCTRINE: ARTHASHASTRA v4.0
          </span>
        </div>
        <div className="px-3 py-1" style={{ backgroundColor: `${saffron}08` }}>
          <span className="text-[6px] tracking-[1px]" style={{ color: `${saffron}40` }}>
            सत्यमेव जयते
          </span>
        </div>
      </div>
    </div>
  );
}
