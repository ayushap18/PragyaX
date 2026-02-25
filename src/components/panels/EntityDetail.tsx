"use client";

import { useState, useEffect } from "react";
import { useAIStore } from "@/stores/aiStore";
import { useDataStore } from "@/stores/dataStore";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";
import { generateSatelliteProfile } from "@/services/claudeService";
import { SFX } from "@/utils/audioEngine";

export default function EntityDetail() {
  const selectedEntity = useAIStore((s) => s.selectedEntity);
  const setSelectedEntity = useAIStore((s) => s.setSelectedEntity);
  const clearSelectedEntity = useAIStore((s) => s.clearSelectedEntity);
  const flights = useDataStore((s) => s.flights);
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  const [satProfile, setSatProfile] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Live-update flight data when tracking
  useEffect(() => {
    if (!selectedEntity || selectedEntity.type !== 'flight') return;
    const icao = selectedEntity.data.icao24 as string;
    const live = flights.find((f) => f.icao24 === icao);
    if (live) {
      const isTracking = !!selectedEntity.data._tracking;
      setSelectedEntity({
        type: 'flight',
        data: { ...(live as unknown as Record<string, unknown>), _tracking: isTracking },
      });
    }
  // Only re-run when flights array changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flights]);

  if (!selectedEntity) return null;

  const { type, data } = selectedEntity;
  const isTracking = type === 'flight' && !!data._tracking;

  const handleTrackToggle = () => {
    SFX.click();
    setSelectedEntity({
      type: 'flight',
      data: { ...data, _tracking: !isTracking },
    });
  };

  const handleSatProfile = async () => {
    if (loadingProfile || type !== "satellite") return;
    setLoadingProfile(true);
    try {
      const result = await generateSatelliteProfile({
        name: data.name as string,
        noradId: data.noradId as number,
        orbitType: data.orbitType as string,
        inclination: data.inclination as number,
        intlDesignator: data.intlDesignator as string,
      });
      setSatProfile(result.profile);
    } catch {
      setSatProfile("PROFILE GENERATION FAILED");
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div
      className="fixed left-[200px] top-[60px] z-30 w-[280px] flex flex-col"
      style={{
        border: `1px solid ${isTracking ? '#FFC800' : accent}30`,
        backgroundColor: "rgba(0,5,15,0.95)",
        boxShadow: isTracking ? '0 0 20px rgba(255,200,0,0.15)' : `0 0 20px ${accent}10`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          borderBottom: `1px solid ${accent}15`,
          backgroundColor: isTracking ? 'rgba(255,200,0,0.05)' : `${accent}05`,
        }}
      >
        <div className="flex items-center gap-2">
          {isTracking && (
            <div className="h-[5px] w-[5px] rounded-full animate-pulse" style={{ backgroundColor: '#FFC800' }} />
          )}
          <span
            className="text-[7px] font-bold tracking-[1px]"
            style={{ color: isTracking ? '#FFC800' : accent }}
          >
            {isTracking ? 'TRACKING' : type.toUpperCase() + ' DETAIL'}
          </span>
        </div>
        <button
          onClick={() => {
            clearSelectedEntity();
            setSatProfile(null);
          }}
          className="text-[8px] font-bold transition-colors hover:opacity-80"
          style={{ color: "var(--text-dim)" }}
        >
          ✕
        </button>
      </div>

      <div className="px-3 py-2 flex flex-col gap-2">
        {type === "flight" && (
          <>
            <DetailRow label="CALLSIGN" value={data.callsign as string || "N/A"} accent={accent} />
            <DetailRow label="ICAO24" value={data.icao24 as string} accent={accent} />
            <DetailRow label="ORIGIN" value={data.originCountry as string} accent={accent} />
            <DetailRow label="ALTITUDE" value={`${data.altitudeFt as number} FT`} accent={accent} />
            <DetailRow label="SPEED" value={`${data.velocityKts as number} KTS`} accent={accent} />
            <DetailRow label="HEADING" value={`${(data.heading as number)?.toFixed(0)}°`} accent={accent} />
            <DetailRow label="VERT RATE" value={`${data.verticalRateMs as number} M/S`} accent={accent} />
            <DetailRow label="SQUAWK" value={data.squawk as string || "----"} accent={accent} />
            <DetailRow label="GROUND" value={(data.onGround as boolean) ? "YES" : "NO"} accent={accent} />
            <DetailRow label="POSITION" value={`${(data.lat as number)?.toFixed(4)}°N ${(data.lon as number)?.toFixed(4)}°E`} accent={accent} />

            {/* Track / Untrack button */}
            <button
              onClick={handleTrackToggle}
              className="mt-1 rounded-sm px-2 py-1 text-[7px] font-bold tracking-[1px] transition-colors cursor-pointer"
              style={{
                border: `1px solid ${isTracking ? '#FF4444' : '#FFC800'}40`,
                color: isTracking ? '#FF4444' : '#FFC800',
                backgroundColor: isTracking ? 'rgba(255,68,68,0.1)' : 'rgba(255,200,0,0.1)',
              }}
            >
              {isTracking ? '■ STOP TRACKING' : '▶ TRACK FLIGHT'}
            </button>
          </>
        )}

        {type === "earthquake" && (
          <>
            <DetailRow label="MAGNITUDE" value={`M${data.magnitude as number}`} accent={accent} highlight />
            <DetailRow label="LOCATION" value={data.place as string} accent={accent} />
            <DetailRow label="DEPTH" value={`${data.depthKm as number} KM`} accent={accent} />
            <DetailRow label="TIME" value={(data.timeUtc as string)?.slice(0, 19)} accent={accent} />
            <DetailRow label="TSUNAMI" value={(data.tsunamiRisk as boolean) ? "RISK" : "NONE"} accent={accent} highlight={(data.tsunamiRisk as boolean)} />
            <DetailRow label="ALERT" value={(data.alertLevel as string) || "NONE"} accent={accent} />
            <DetailRow label="FELT BY" value={data.felt ? `${data.felt} REPORTS` : "N/A"} accent={accent} />
            <DetailRow label="POSITION" value={`${(data.lat as number)?.toFixed(4)}°N ${(data.lon as number)?.toFixed(4)}°E`} accent={accent} />
          </>
        )}

        {type === "satellite" && (
          <>
            <DetailRow label="NAME" value={data.name as string} accent={accent} />
            <DetailRow label="NORAD ID" value={String(data.noradId)} accent={accent} />
            <DetailRow label="INTL DES" value={data.intlDesignator as string} accent={accent} />
            <DetailRow label="ORBIT" value={data.orbitType as string} accent={accent} />
            <DetailRow label="INCL" value={`${(data.inclination as number)?.toFixed(1)}°`} accent={accent} />
            <DetailRow label="ECCEN" value={String((data.eccentricity as number)?.toFixed(6))} accent={accent} />
            <DetailRow label="MEAN MOT" value={`${(data.meanMotion as number)?.toFixed(4)} rev/day`} accent={accent} />

            {!satProfile && !loadingProfile && (
              <button
                onClick={handleSatProfile}
                className="mt-1 rounded-sm px-2 py-1 text-[7px] font-bold tracking-[1px] transition-colors"
                style={{
                  border: `1px solid ${accent}40`,
                  color: accent,
                  backgroundColor: `${accent}10`,
                }}
              >
                GENERATE INTEL PROFILE
              </button>
            )}

            {loadingProfile && (
              <span
                className="text-[7px] font-bold tracking-[1px] animate-pulse mt-1"
                style={{ color: accent }}
              >
                ATLAS-SIGINT ANALYZING...
              </span>
            )}

            {satProfile && (
              <div
                className="mt-1 px-2 py-1"
                style={{
                  borderLeft: `2px solid ${accent}40`,
                  backgroundColor: `${accent}05`,
                }}
              >
                <span className="text-[6px] font-bold tracking-[1px] block mb-1" style={{ color: accent }}>
                  INTEL PROFILE
                </span>
                <p className="text-[7px] whitespace-pre-line leading-[1.5]" style={{ color: "rgba(200,230,255,0.7)" }}>
                  {satProfile}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  accent,
  highlight = false,
}: {
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[6px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      <span
        className="text-[8px] font-mono tabular-nums"
        style={{
          color: highlight ? "#FF3333" : `${accent}90`,
        }}
      >
        {value}
      </span>
    </div>
  );
}
