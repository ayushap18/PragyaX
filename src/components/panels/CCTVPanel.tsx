"use client";

import { useState, useEffect  } from "react";
import { useAIStore } from "@/stores/aiStore";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";
import { analyzeFrame } from "@/services/geminiService";
import type { VisionAnalysisResponse } from "@/types";

export default function CCTVPanel() {
  const selectedCamera = useAIStore((s) => s.selectedCamera);
  const setSelectedCamera = useAIStore((s) => s.setSelectedCamera);
  const isAnalyzing = useAIStore((s) => s.isAnalyzing);
  const setAnalyzing = useAIStore((s) => s.setAnalyzing);
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  const [analysis, setAnalysis] = useState<VisionAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCamera) {
      setAnalysis(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setAnalyzing(true);
    setError(null);

    analyzeFrame({
      cameraId: selectedCamera.id,
      city: selectedCamera.city,
      label: selectedCamera.label,
      lat: selectedCamera.lat,
      lon: selectedCamera.lon,
      direction: selectedCamera.direction,
    })
      .then((result) => {
        if (!cancelled) {
          setAnalysis(result);
          setAnalyzing(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Analysis failed");
          setAnalyzing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCamera, setAnalyzing]);

  if (!selectedCamera) return null;

  const flowColor =
    analysis?.trafficFlow === "CONGESTED"
      ? "#FF3333"
      : analysis?.trafficFlow === "HEAVY"
      ? "#FFA500"
      : analysis?.trafficFlow === "MODERATE"
      ? "#FFD700"
      : "#00FF41";

  const densityColor =
    analysis?.crowdDensity === "CRITICAL"
      ? "#FF3333"
      : analysis?.crowdDensity === "HIGH"
      ? "#FFA500"
      : analysis?.crowdDensity === "MODERATE"
      ? "#FFD700"
      : "#00FF41";

  return (
    <div
      className="fixed right-[200px] top-[60px] z-30 w-[280px] flex flex-col"
      style={{
        border: `1px solid ${accent}30`,
        backgroundColor: "rgba(0,5,15,0.95)",
        boxShadow: `0 0 20px ${accent}10`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          borderBottom: `1px solid ${accent}15`,
          backgroundColor: "rgba(255,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-[6px] w-[6px] rounded-full animate-pulse"
            style={{ backgroundColor: "#FF3333" }}
          />
          <span
            className="text-[7px] font-bold tracking-[1px]"
            style={{ color: "#FF3333" }}
          >
            CCTV FEED — {selectedCamera.label.toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => setSelectedCamera(null)}
          className="text-[8px] font-bold transition-colors hover:opacity-80"
          style={{ color: "var(--text-dim)" }}
        >
          ✕
        </button>
      </div>

      {/* Camera info */}
      <div className="px-3 py-2 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[7px]" style={{ color: "var(--text-dim)" }}>
            ID: {selectedCamera.id}
          </span>
          <span className="text-[7px]" style={{ color: "var(--text-dim)" }}>
            DIR: {selectedCamera.direction}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[7px] tabular-nums" style={{ color: `${accent}60` }}>
            {selectedCamera.lat.toFixed(4)}°N {selectedCamera.lon.toFixed(4)}°E
          </span>
          <span className="text-[7px] tabular-nums" style={{ color: `${accent}60` }}>
            {selectedCamera.city}
          </span>
        </div>
      </div>

      {/* Feed placeholder */}
      <div
        className="mx-3 flex h-[100px] items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,0,0,0.2)",
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-bold" style={{ color: "#FF3333" }}>
            LIVE FEED
          </span>
          <span className="text-[6px]" style={{ color: "var(--text-dim)" }}>
            {isAnalyzing ? "ANALYZING..." : "FRAME CAPTURED"}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <div className="h-[3px] w-[3px] rounded-full animate-pulse" style={{ backgroundColor: "#FF3333" }} />
            <span className="text-[5px] tracking-[1px]" style={{ color: "#FF3333" }}>
              REC
            </span>
          </div>
        </div>
      </div>

      {/* Analysis results */}
      <div className="px-3 py-2">
        {isAnalyzing && (
          <span
            className="text-[7px] font-bold tracking-[1px] animate-pulse"
            style={{ color: accent }}
          >
            OVERWATCH ANALYZING...
          </span>
        )}

        {error && (
          <span className="text-[7px] font-bold" style={{ color: "#FF3333" }}>
            ERROR: {error}
          </span>
        )}

        {analysis && !isAnalyzing && (
          <div className="flex flex-col gap-2">
            {/* Stats row */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-[14px] font-bold tabular-nums" style={{ color: accent }}>
                  {analysis.vehicleCount}
                </span>
                <span className="text-[5px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
                  VEHICLES
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold" style={{ color: flowColor }}>
                  {analysis.trafficFlow}
                </span>
                <span className="text-[5px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
                  FLOW
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold" style={{ color: densityColor }}>
                  {analysis.crowdDensity}
                </span>
                <span className="text-[5px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
                  CROWD
                </span>
              </div>
            </div>

            {/* Weather */}
            <div className="flex items-center gap-1">
              <span className="text-[6px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
                WX:
              </span>
              <span className="text-[7px]" style={{ color: `${accent}80` }}>
                {analysis.weatherObserved}
              </span>
            </div>

            {/* Anomalies */}
            {analysis.anomalies.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[6px] font-bold tracking-[1px]" style={{ color: "#FFA500" }}>
                  ANOMALIES DETECTED
                </span>
                {analysis.anomalies.map((a, i) => (
                  <span key={i} className="text-[7px]" style={{ color: "#FFA500" }}>
                    • {a}
                  </span>
                ))}
              </div>
            )}

            {/* Summary */}
            <div
              className="mt-1 px-2 py-1"
              style={{
                borderLeft: `2px solid ${accent}40`,
                backgroundColor: `${accent}05`,
              }}
            >
              <span className="text-[7px]" style={{ color: "rgba(200,230,255,0.7)" }}>
                {analysis.summary}
              </span>
            </div>

            {/* Timestamp */}
            <span className="text-[6px] tabular-nums" style={{ color: "var(--text-dim)" }}>
              {analysis.cached ? "CACHED" : "LIVE"} — {analysis.timestamp?.slice(11, 19)}Z
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
