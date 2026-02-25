"use client";

import { useModeStore } from '@/stores/modeStore';
import { useAnomalyStore } from '@/stores/exclusiveStores';
import { MODE_ACCENTS } from '@/constants/modes';

export default function AnomalyPanel({ onClose }: { onClose: () => void }) {
  const mode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[mode];
  const anomalies = useAnomalyStore((s) => s.anomalies);
  const acknowledgeAnomaly = useAnomalyStore((s) => s.acknowledgeAnomaly);

  const severityColors: Record<string, string> = {
    CRITICAL: '#FF2222',
    HIGH: '#FF6600',
    MEDIUM: '#FFB800',
    LOW: '#00CCFF',
  };

  const typeIcons: Record<string, string> = {
    FLIGHT_PATH: '✈',
    SEISMIC_SWARM: '◉',
    AQI_SPIKE: '☁',
    TRAFFIC: '🚗',
    DETECTION: '⊕',
    MARITIME: '⚓',
    CORRELATION: '⬡',
  };

  const unacked = anomalies.filter((a) => !a.acknowledged);

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
          {unacked.length > 0 && (
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: '#FF2222' }} />
          )}
          <span className="text-[9px] tracking-[3px] font-bold" style={{ color: accent }}>
            ANOMALY DETECTION
          </span>
          {unacked.length > 0 && (
            <span
              className="text-[8px] px-2 py-[1px] rounded-full font-bold"
              style={{ backgroundColor: '#FF222230', color: '#FF2222' }}
            >
              {unacked.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-[10px] px-2 py-1 rounded cursor-pointer hover:brightness-150"
          style={{ color: `${accent}80`, border: `1px solid ${accent}30` }}
        >
          CLOSE
        </button>
      </div>

      {/* Severity summary */}
      <div className="flex items-center gap-3 px-3 py-1" style={{ borderBottom: `1px solid ${accent}10` }}>
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
          const count = anomalies.filter((a) => a.severity === sev).length;
          return (
            <span key={sev} className="text-[7px] flex items-center gap-1">
              <span className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: severityColors[sev] }} />
              <span style={{ color: severityColors[sev] }}>{count}</span>
              <span style={{ color: `${accent}40` }}>{sev}</span>
            </span>
          );
        })}
      </div>

      {/* Anomaly list */}
      <div className="flex-1 overflow-y-auto">
        {anomalies.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <span className="text-[8px]" style={{ color: `${accent}30` }}>NO ANOMALIES DETECTED</span>
          </div>
        )}

        {anomalies.map((anomaly) => {
          const sevColor = severityColors[anomaly.severity] || accent;
          return (
            <div
              key={anomaly.id}
              className="px-3 py-2 relative"
              style={{
                borderBottom: `1px solid ${accent}08`,
                opacity: anomaly.acknowledged ? 0.4 : 1,
              }}
            >
              {/* Severity indicator */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ backgroundColor: sevColor }}
              />

              <div className="flex items-start justify-between pl-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-[2px]">
                    <span className="text-[10px]">{typeIcons[anomaly.type] || '⚠'}</span>
                    <span
                      className="text-[7px] tracking-[1px] font-bold"
                      style={{ color: sevColor }}
                    >
                      {anomaly.severity}
                    </span>
                    <span className="text-[7px]" style={{ color: `${accent}60` }}>
                      {anomaly.type.replace('_', ' ')}
                    </span>
                    <span className="text-[7px] font-bold" style={{ color: accent }}>
                      {anomaly.entity}
                    </span>
                  </div>

                  <p className="text-[8px] leading-relaxed" style={{ color: `${accent}80` }}>
                    {anomaly.description}
                  </p>

                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[6px] font-mono tabular-nums" style={{ color: `${accent}40` }}>
                      {anomaly.detectedAt.replace('T', ' ').slice(0, 19)}
                    </span>
                    <span className="text-[6px]" style={{ color: `${accent}30` }}>
                      SCORE: {anomaly.score.toFixed(0)}
                    </span>
                    <span className="text-[6px]" style={{ color: `${accent}30` }}>
                      {anomaly.position.lat.toFixed(3)}°N {anomaly.position.lon.toFixed(3)}°E
                    </span>
                  </div>
                </div>

                {!anomaly.acknowledged && (
                  <button
                    onClick={() => acknowledgeAnomaly(anomaly.id)}
                    className="text-[7px] px-2 py-1 rounded cursor-pointer hover:brightness-150 ml-2 flex-shrink-0"
                    style={{ color: accent, border: `1px solid ${accent}30` }}
                  >
                    ACK
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div
        className="flex items-center justify-between px-3 py-1"
        style={{ borderTop: `1px solid ${accent}15` }}
      >
        <span className="text-[6px]" style={{ color: `${accent}40` }}>
          TOTAL: {anomalies.length} • UNACKED: {unacked.length}
        </span>
        <span className="text-[6px] font-mono" style={{ color: `${accent}30` }}>
          ENGINE: ACTIVE • REFRESH: 1Hz
        </span>
      </div>
    </div>
  );
}
