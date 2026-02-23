"use client";

import { useState, useEffect, useRef } from "react";
import { useDataStore } from "@/stores/dataStore";
import { CHANAKYA_COLORS, BORDER_ZONES, ARTHASHASTRA_QUOTES, getAQICategory, ISRO_SATELLITE_PATTERNS } from "@/constants/chanakya";

const saffron = CHANAKYA_COLORS.saffron;

function SectionHeader({ label, accent = saffron }: { label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-[5px]">
      <span className="text-[7px] font-semibold tracking-[1.5px]" style={{ color: `${accent}90` }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: `${accent}26` }} />
    </div>
  );
}

function Divider() {
  return <div className="h-px mx-3" style={{ backgroundColor: `${saffron}15` }} />;
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-[2px]">
      <span className="text-[7px]" style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="text-[7px] tabular-nums" style={{ color: color ?? saffron }}>{value}</span>
    </div>
  );
}

function ThreatBar({ label, level, color }: { label: string; level: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-[2px]">
      <span className="text-[6px] w-[70px] truncate" style={{ color: "var(--text-dim)" }}>{label}</span>
      <div className="flex-1 h-[3px] rounded-full" style={{ backgroundColor: `${color}20` }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(level, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[6px] tabular-nums w-[20px] text-right" style={{ color }}>{level}%</span>
    </div>
  );
}

export default function ChanakyaLeftPanel() {
  const flights = useDataStore((s) => s.flights);
  const earthquakes = useDataStore((s) => s.earthquakes);
  const aqiStations = useDataStore((s) => s.aqiStations);
  const satelliteTLEs = useDataStore((s) => s.satelliteTLEs);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [sessionCode] = useState(() => Math.floor(Date.now() / 100000) % 10000);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Arthashastra quote ticker
  useEffect(() => {
    tickerRef.current = setInterval(() => {
      setQuoteIdx((p) => (p + 1) % ARTHASHASTRA_QUOTES.length);
    }, 12000);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, []);

  // Calculate threat levels from real data
  const indiaFlights = flights.filter(
    (f) => f.lat >= 6.5 && f.lat <= 37.5 && f.lon >= 68 && f.lon <= 97.5
  );
  const borderFlights = indiaFlights.filter(
    (f) => f.lat >= 30 || f.lon <= 70 || f.lon >= 95
  );

  const indiaQuakes = earthquakes.filter(
    (e) => e.lat >= 6.5 && e.lat <= 37.5 && e.lon >= 68 && e.lon <= 97.5
  );

  const poorAQI = aqiStations.filter((s) => s.aqi > 200);

  // Border zone threat calculation
  const zoneThreats = BORDER_ZONES.map((zone) => {
    const nearbyFlights = indiaFlights.filter((f) => {
      const dlat = f.lat - zone.lat;
      const dlon = f.lon - zone.lon;
      return Math.sqrt(dlat * dlat + dlon * dlon) < 3; // ~300km
    });
    const nearbyQuakes = indiaQuakes.filter((e) => {
      const dlat = e.lat - zone.lat;
      const dlon = e.lon - zone.lon;
      return Math.sqrt(dlat * dlat + dlon * dlon) < 3;
    });

    const threatLevel = Math.min(
      100,
      nearbyFlights.length * 4 + nearbyQuakes.length * 15 +
      (zone.threat === 'HIGH' ? 40 : zone.threat === 'ELEVATED' ? 30 : zone.threat === 'MODERATE' ? 20 : 10)
    );
    return { ...zone, threatLevel, nearbyFlights: nearbyFlights.length, nearbyQuakes: nearbyQuakes.length };
  });

  return (
    <div
      className="fixed bottom-[110px] left-0 top-[38px] z-10 flex w-[240px] flex-col overflow-hidden"
      style={{
        backgroundColor: CHANAKYA_COLORS.panel,
        borderRight: `1px solid ${saffron}20`,
        overscrollBehavior: 'contain',
      }}
    >
      {/* Header */}
      <div className="relative flex flex-col gap-[2px] px-3 py-2">
        <div className="flex items-center gap-[5px]">
          <div
            className="h-[5px] w-[5px] rounded-full animate-pulse-slow"
            style={{ backgroundColor: saffron, boxShadow: `0 0 8px ${saffron}` }}
          />
          <span className="text-[11px] font-bold" style={{ color: saffron }}>
            कौटिल्य नीति
          </span>
        </div>
        <span className="text-[6px] tracking-[1.5px]" style={{ color: `${saffron}60` }}>
          CHANAKYA STRATEGIC INTELLIGENCE CONSOLE
        </span>
      </div>

      {/* Tricolor bar */}
      <div className="flex h-[2px]">
        <div className="flex-1" style={{ backgroundColor: CHANAKYA_COLORS.saffron }} />
        <div className="flex-1" style={{ backgroundColor: CHANAKYA_COLORS.white }} />
        <div className="flex-1" style={{ backgroundColor: CHANAKYA_COLORS.green }} />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Four Pillars */}
        <SectionHeader label="चतुर्विध उपाय — FOUR PILLARS" />
        <div className="grid grid-cols-4 gap-1 px-3 py-1">
          {['साम', 'दान', 'भेद', 'दण्ड'].map((p, i) => (
            <div
              key={p}
              className="flex flex-col items-center rounded-sm py-1"
              style={{ backgroundColor: `${saffron}${i === 3 ? '18' : '0A'}`, border: `1px solid ${saffron}20` }}
            >
              <span className="text-[9px]" style={{ color: saffron }}>{p}</span>
              <span className="text-[5px]" style={{ color: `${saffron}60` }}>
                {['DIPLOMACY', 'ECONOMY', 'INTEL', 'FORCE'][i]}
              </span>
            </div>
          ))}
        </div>

        <Divider />

        {/* Situation Overview */}
        <SectionHeader label="स्थिति — SITUATION OVERVIEW" />
        <MetricRow label="INDIA AIRSPACE" value={`${indiaFlights.length} AC`} />
        <MetricRow label="BORDER PROXIMITY" value={`${borderFlights.length} AC`} color={borderFlights.length > 10 ? '#FF4444' : saffron} />
        <MetricRow label="SEISMIC EVENTS" value={`${indiaQuakes.length}`} color={indiaQuakes.length > 0 ? '#FF6600' : CHANAKYA_COLORS.green} />
        <MetricRow label="AQI STATIONS" value={`${aqiStations.length}`} />
        <MetricRow label="POOR+ AQI" value={`${poorAQI.length}`} color={poorAQI.length > 5 ? '#FF4444' : saffron} />
        <MetricRow label="ISRO TRACKED" value={`${satelliteTLEs.filter((t) => { const u = t.name.toUpperCase(); return ISRO_SATELLITE_PATTERNS.some((p) => u.includes(p)); }).length}`} color={CHANAKYA_COLORS.green} />

        <Divider />

        {/* Border Threat Assessment */}
        <SectionHeader label="सीमा सुरक्षा — BORDER THREAT" />
        {zoneThreats.map((zone) => (
          <ThreatBar
            key={zone.name}
            label={zone.name}
            level={zone.threatLevel}
            color={zone.color}
          />
        ))}
        <div className="px-3 py-1">
          <span className="text-[5px]" style={{ color: `${saffron}40` }}>
            COMPUTED FROM {indiaFlights.length} FLIGHTS + {indiaQuakes.length} SEISMIC EVENTS
          </span>
        </div>

        <Divider />

        {/* AQI Summary */}
        {aqiStations.length > 0 && (
          <>
            <SectionHeader label="वायु गुणवत्ता — AQI SUMMARY" />
            <div className="grid grid-cols-3 gap-1 px-3 py-1">
              {(['GOOD', 'MODERATE', 'POOR', 'VERY_POOR', 'SEVERE'] as const).map((cat) => {
                const count = aqiStations.filter((s) => getAQICategory(s.aqi) === cat).length;
                if (count === 0) return null;
                const catColors: Record<string, string> = {
                  GOOD: '#00E400', MODERATE: '#FF7E00', POOR: '#FF0000',
                  VERY_POOR: '#8F3F97', SEVERE: '#7E0023',
                };
                return (
                  <div key={cat} className="flex items-center gap-1">
                    <div className="h-[4px] w-[4px] rounded-full" style={{ backgroundColor: catColors[cat] ?? '#888' }} />
                    <span className="text-[6px]" style={{ color: catColors[cat] ?? '#888' }}>{count}</span>
                    <span className="text-[5px]" style={{ color: `${saffron}40` }}>{cat.replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>
            <Divider />
          </>
        )}

        {/* Nuclear Triad */}
        <SectionHeader label="परमाणु त्रय — NUCLEAR TRIAD" />
        <div className="flex flex-col gap-1 px-3 py-1">
          {[
            { label: 'AGNI CORPS (LAND)', status: 'OPERATIONAL', color: '#FF4444', pct: 85 },
            { label: 'SSBN FLEET (SEA)', status: 'PATROL', color: '#4488FF', pct: 72 },
            { label: 'AIR WING (AIR)', status: 'STANDBY', color: '#00FFAA', pct: 90 },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-1">
              <div className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-[6px] w-[90px]" style={{ color: `${saffron}80` }}>{t.label}</span>
              <div className="flex-1 h-[2px] rounded-full" style={{ backgroundColor: `${t.color}20` }}>
                <div className="h-full rounded-full" style={{ width: `${t.pct}%`, backgroundColor: t.color }} />
              </div>
              <span className="text-[5px] w-[50px] text-right" style={{ color: t.color }}>{t.status}</span>
            </div>
          ))}
        </div>

        <Divider />

        {/* Live Intel Feed */}
        <SectionHeader label="गुप्तचर — LIVE INTEL FEED" accent={saffron} />
        <div className="flex flex-col gap-[2px] px-3 py-1 max-h-[120px] overflow-y-auto scrollbar-hide">
          {indiaQuakes.slice(0, 3).map((eq) => (
            <div key={eq.id} className="flex items-start gap-1 py-[1px]">
              <span className="text-[5px] px-1 rounded-sm" style={{ backgroundColor: '#FF660030', color: '#FF6600' }}>[S]</span>
              <span className="text-[6px]" style={{ color: `${saffron}70` }}>
                NCS: M{eq.magnitude.toFixed(1)} at {eq.place.slice(0, 30)}
              </span>
            </div>
          ))}
          {borderFlights.length > 0 && (
            <div className="flex items-start gap-1 py-[1px]">
              <span className="text-[5px] px-1 rounded-sm" style={{ backgroundColor: '#FF444430', color: '#FF4444' }}>[TS]</span>
              <span className="text-[6px]" style={{ color: `${saffron}70` }}>
                {borderFlights.length} ac detected near border zones
              </span>
            </div>
          )}
          {poorAQI.length > 0 && (
            <div className="flex items-start gap-1 py-[1px]">
              <span className="text-[5px] px-1 rounded-sm" style={{ backgroundColor: '#8F3F9730', color: '#8F3F97' }}>[C]</span>
              <span className="text-[6px]" style={{ color: `${saffron}70` }}>
                {poorAQI.length} AQI stations in POOR+ range
              </span>
            </div>
          )}
          {indiaFlights.length > 0 && (
            <div className="flex items-start gap-1 py-[1px]">
              <span className="text-[5px] px-1 rounded-sm" style={{ backgroundColor: `${saffron}30`, color: saffron }}>[C]</span>
              <span className="text-[6px]" style={{ color: `${saffron}70` }}>
                India airspace: {indiaFlights.length} contacts tracked
              </span>
            </div>
          )}
          {indiaQuakes.length === 0 && borderFlights.length === 0 && poorAQI.length === 0 && (
            <span className="text-[6px]" style={{ color: `${saffron}40` }}>AWAITING INTEL STREAM...</span>
          )}
        </div>
      </div>

      {/* Footer — Arthashastra quote ticker */}
      <div className="flex flex-col mt-auto">
        <div className="h-px" style={{ backgroundColor: `${saffron}15` }} />
        <div className="px-3 py-2 overflow-hidden">
          <p className="text-[6px] italic leading-relaxed truncate" style={{ color: `${saffron}50` }}>
            &#x201C;{ARTHASHASTRA_QUOTES[quoteIdx]}&#x201D;
          </p>
        </div>
        <div className="flex items-center justify-between px-3 py-1" style={{ backgroundColor: `${saffron}08` }}>
          <span className="text-[5px] tracking-[1px]" style={{ color: `${saffron}40` }}>
            SESSION: CKY-{sessionCode}
          </span>
          <span className="text-[5px] tracking-[1px]" style={{ color: `${saffron}40` }}>
            अत्यन्त गोपनीय
          </span>
        </div>
      </div>
    </div>
  );
}
