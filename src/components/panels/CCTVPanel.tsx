"use client";

import { useState, useEffect, useRef } from "react";
import { useAIStore } from "@/stores/aiStore";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";
import { analyzeFrame } from "@/services/geminiService";
import { SFX } from "@/utils/audioEngine";
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
  const [predictionOn, setPredictionOn] = useState(false);

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
      className="fixed right-[200px] top-[60px] z-30 w-[300px] flex flex-col"
      style={{
        border: `1px solid ${accent}30`,
        backgroundColor: "rgba(0,5,15,0.96)",
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
          onClick={() => { SFX.click(); setSelectedCamera(null); }}
          className="text-[8px] font-bold transition-colors hover:opacity-80"
          style={{ color: "var(--text-dim)" }}
        >
          ✕
        </button>
      </div>

      {/* Camera metadata */}
      <div className="px-3 py-2 flex flex-col gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[6px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
            CAM-ID: {selectedCamera.id}
          </span>
          <span className="text-[6px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
            HWY: {selectedCamera.direction}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[6px] tabular-nums" style={{ color: `${accent}60` }}>
            {selectedCamera.lat.toFixed(4)}°N {Math.abs(selectedCamera.lon).toFixed(4)}°{selectedCamera.lon >= 0 ? 'E' : 'W'}
          </span>
          <span className="text-[6px] tabular-nums" style={{ color: `${accent}40` }}>
            FOV: 72° | EL: 12°
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[6px]" style={{ color: `${accent}40` }}>
            {selectedCamera.city.toUpperCase()}
          </span>
          <span className="text-[6px] tabular-nums" style={{ color: "var(--text-dim)" }}>
            RES: 1920×1080
          </span>
        </div>
      </div>

      {/* Feed view with scanlines */}
      <div
        className="relative mx-3 mt-2 flex h-[90px] items-center justify-center overflow-hidden"
        style={{
          backgroundColor: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,0,0,0.2)",
        }}
      >
        {/* Static noise pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
            backgroundSize: "100px 100px",
            opacity: 0.5,
          }}
        />
        {/* Scanlines */}
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)`,
          }}
        />
        <div className="relative flex flex-col items-center gap-1">
          <span className="text-[8px] font-bold" style={{ color: "#FF3333" }}>
            LIVE FEED
          </span>
          <span className="text-[6px]" style={{ color: "var(--text-dim)" }}>
            {isAnalyzing ? "ANALYZING FRAME..." : "FRAME CAPTURED"}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <div className="h-[3px] w-[3px] rounded-full animate-pulse" style={{ backgroundColor: "#FF3333" }} />
            <span className="text-[5px] tracking-[1px]" style={{ color: "#FF3333" }}>
              REC
            </span>
          </div>
        </div>
        {/* Timestamp overlay */}
        <span
          className="absolute bottom-1 right-1 text-[5px] tabular-nums"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {new Date().toISOString().slice(11, 19)}Z
        </span>
      </div>

      {/* Dot-matrix signal strength chart */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[5px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
            SIGNAL STRENGTH
          </span>
          <span className="text-[5px] tabular-nums" style={{ color: accent }}>
            97.3%
          </span>
        </div>
        <DotMatrixChart accent={accent} />
      </div>

      {/* Analysis results */}
      <div className="px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
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
              className="px-2 py-1"
              style={{
                borderLeft: `2px solid ${accent}40`,
                backgroundColor: `${accent}05`,
              }}
            >
              <span className="text-[7px]" style={{ color: "rgba(200,230,255,0.7)" }}>
                {analysis.summary}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons grid */}
      <div
        className="grid grid-cols-3 gap-[1px] mx-3 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        <ActionBtn label="FEED ID" accent={accent} onClick={() => SFX.click()} />
        <ActionBtn label="COVERAGE" accent={accent} onClick={() => SFX.click()} />
        <ActionBtn
          label={predictionOn ? "PRED ON" : "PRED OFF"}
          accent={accent}
          active={predictionOn}
          onClick={() => { SFX.toggle(); setPredictionOn(!predictionOn); }}
        />
        <ActionBtn label="ALIGN" accent={accent} onClick={() => SFX.click()} />
        <ActionBtn label="BRIEF" accent={accent} onClick={() => SFX.click()} />
        <ActionBtn label="NEXT SAT" accent={accent} onClick={() => SFX.click()} />
      </div>

      {/* Status footer */}
      <div
        className="flex items-center justify-between px-3 py-1"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.04)",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      >
        <span className="text-[5px] tabular-nums" style={{ color: "var(--text-dim)" }}>
          {analysis?.cached ? "CACHED" : "LIVE"} — {analysis?.timestamp?.slice(11, 19) ?? "--:--:--"}Z
        </span>
        <span className="text-[5px] tabular-nums" style={{ color: `${accent}40` }}>
          LATENCY: 12ms
        </span>
      </div>
    </div>
  );
}

/* Dot-matrix signal strength visualization */
function DotMatrixChart({ accent }: { accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cols = 30;
    const rows = 6;
    const dotW = W / cols;
    const dotH = H / rows;

    let frame = 0;
    let animId: number;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      for (let col = 0; col < cols; col++) {
        // Generate a signal level for this column (wave pattern + noise)
        const t = (col / cols) * Math.PI * 3 + frame * 0.05;
        const level = Math.floor(
          (Math.sin(t) * 0.4 + 0.5 + Math.sin(t * 2.3 + 1) * 0.15 + Math.random() * 0.08) * rows
        );

        for (let row = 0; row < rows; row++) {
          const active = rows - 1 - row < level;
          const x = col * dotW + 1;
          const y = row * dotH + 1;

          if (active) {
            // Top rows = red/amber warning, bottom = accent/green
            const intensity = (rows - 1 - row) / rows;
            if (intensity > 0.8) {
              ctx.fillStyle = "#FF333380";
            } else if (intensity > 0.6) {
              ctx.fillStyle = "#FFA50060";
            } else {
              ctx.fillStyle = accent + "60";
            }
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.03)";
          }

          ctx.fillRect(x, y, dotW - 2, dotH - 2);
        }
      }

      frame++;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [accent]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={36}
      className="w-full"
      style={{ height: 30, imageRendering: "pixelated" }}
    />
  );
}

/* Small action button for CCTV panel */
function ActionBtn({
  label,
  accent,
  active,
  onClick,
}: {
  label: string;
  accent: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center py-[5px] text-[6px] font-bold tracking-[0.5px] transition-all hover:brightness-125 cursor-pointer"
      style={{
        backgroundColor: active ? `${accent}15` : "rgba(0,5,15,0.9)",
        color: active ? accent : "rgba(200,230,255,0.5)",
        border: `1px solid ${active ? accent + "40" : "rgba(255,255,255,0.08)"}`,
        boxShadow: active ? `0 0 6px ${accent}20` : "none",
      }}
    >
      {label}
    </button>
  );
}
