"use client";

import { useEffect, useRef } from 'react';
import { useModeStore } from '@/stores/modeStore';
import { useSpectrumStore } from '@/stores/exclusiveStores';
import { MODE_ACCENTS } from '@/constants/modes';
import { generateSpectrumSnapshot, generateWaterfallLine } from '@/lib/spectrumSimulator';

const BINS = 256;
const WATERFALL_ROWS = 60;

export default function SpectrumAnalyzer({ onClose }: { onClose: () => void }) {
  const mode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[mode];
  const signals = useSpectrumStore((s) => s.signals);
  const setSignals = useSpectrumStore((s) => s.setSignals);
  const noiseFloor = useSpectrumStore((s) => s.noiseFloor);
  const rangeStart = useSpectrumStore((s) => s.rangeStartMHz);
  const rangeEnd = useSpectrumStore((s) => s.rangeEndMHz);

  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const waterfallCanvasRef = useRef<HTMLCanvasElement>(null);
  const waterfallData = useRef<number[][]>([]);
  const animRef = useRef<number>(0);

  const drawRef = useRef<() => void>(undefined);

  useEffect(() => {
    drawRef.current = () => {
    const snap = generateSpectrumSnapshot(noiseFloor);
    setSignals(snap);

    const line = generateWaterfallLine(snap, BINS, rangeStart, rangeEnd, noiseFloor);
    waterfallData.current.unshift(line);
    if (waterfallData.current.length > WATERFALL_ROWS) waterfallData.current.pop();

    // ── Draw Spectrum ──
    const specCanvas = spectrumCanvasRef.current;
    if (specCanvas) {
      const ctx = specCanvas.getContext('2d');
      if (ctx) {
        const w = specCanvas.width;
        const h = specCanvas.height;
        ctx.clearRect(0, 0, w, h);

        // Background grid
        ctx.strokeStyle = `${accent}15`;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 10; i++) {
          const y = (i / 10) * h;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        for (let i = 0; i < 8; i++) {
          const x = (i / 8) * w;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        // Noise floor line
        const nfY = mapPowerToY(noiseFloor, h);
        ctx.strokeStyle = `${accent}30`;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, nfY);
        ctx.lineTo(w, nfY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Spectrum line
        ctx.beginPath();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 4;
        for (let i = 0; i < BINS; i++) {
          const x = (i / BINS) * w;
          const y = mapPowerToY(line[i], h);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Fill under curve
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = `${accent}08`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Signal labels for strong signals
        ctx.font = '7px monospace';
        ctx.fillStyle = `${accent}90`;
        for (const sig of snap) {
          if (sig.powerDbm > noiseFloor + 20) {
            const logFreq = Math.log10(sig.frequencyMHz);
            const logStart = Math.log10(rangeStart);
            const logEnd = Math.log10(rangeEnd);
            const x = ((logFreq - logStart) / (logEnd - logStart)) * w;
            const y = mapPowerToY(sig.powerDbm, h) - 4;
            if (x > 10 && x < w - 30) {
              ctx.fillStyle = sig.anomalous ? '#FF4444' : `${accent}80`;
              ctx.fillText(sig.label, x - 10, Math.max(10, y));
            }
          }
        }
      }
    }

    // ── Draw Waterfall ──
    const wfCanvas = waterfallCanvasRef.current;
    if (wfCanvas) {
      const ctx = wfCanvas.getContext('2d');
      if (ctx) {
        const w = wfCanvas.width;
        const h = wfCanvas.height;
        ctx.clearRect(0, 0, w, h);

        const rowH = h / WATERFALL_ROWS;
        for (let row = 0; row < waterfallData.current.length; row++) {
          const rowData = waterfallData.current[row];
          for (let bin = 0; bin < BINS; bin++) {
            const x = (bin / BINS) * w;
            const bw = w / BINS + 1;
            const power = rowData[bin];
            const normalized = Math.max(0, Math.min(1, (power - noiseFloor) / 60));
            ctx.fillStyle = powerToColor(normalized);
            ctx.fillRect(x, row * rowH, bw, rowH + 1);
          }
        }
      }
    }

  };
  }, [accent, noiseFloor, rangeStart, rangeEnd, setSignals]);

  useEffect(() => {
    const tick = () => {
      drawRef.current?.();
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const anomalousCount = signals.filter((s) => s.anomalous).length;
  const activeCount = signals.length;

  return (
    <div
      className="fixed right-0 top-12 bottom-14 w-[420px] z-30 flex flex-col"
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
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
          <span className="text-[9px] tracking-[3px] font-bold" style={{ color: accent }}>
            EM SPECTRUM ANALYZER
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

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-3 py-1" style={{ borderBottom: `1px solid ${accent}10` }}>
        <span className="text-[7px]" style={{ color: `${accent}70` }}>
          SIGNALS: <span style={{ color: accent }}>{activeCount}</span>
        </span>
        <span className="text-[7px]" style={{ color: anomalousCount > 0 ? '#FF4444' : `${accent}70` }}>
          ANOMALOUS: <span style={{ color: anomalousCount > 0 ? '#FF4444' : accent }}>{anomalousCount}</span>
        </span>
        <span className="text-[7px]" style={{ color: `${accent}70` }}>
          NOISE: <span style={{ color: accent }}>{noiseFloor}dBm</span>
        </span>
        <span className="text-[7px]" style={{ color: `${accent}70` }}>
          BAND: <span style={{ color: accent }}>FULL</span>
        </span>
      </div>

      {/* Frequency axis labels */}
      <div className="flex items-center justify-between px-3 py-[2px]">
        {['3kHz', '30kHz', '300kHz', '3MHz', '30MHz', '300MHz', '3GHz', '30GHz'].map((label) => (
          <span key={label} className="text-[5px]" style={{ color: `${accent}40` }}>{label}</span>
        ))}
      </div>

      {/* Spectrum canvas */}
      <div className="relative px-2 flex-shrink-0" style={{ height: '35%' }}>
        <canvas
          ref={spectrumCanvasRef}
          width={400}
          height={200}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Y-axis labels */}
        <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-between py-1">
          {['-40', '-60', '-80', '-100', '-120'].map((db) => (
            <span key={db} className="text-[5px]" style={{ color: `${accent}30` }}>{db}dBm</span>
          ))}
        </div>
      </div>

      {/* Waterfall label */}
      <div className="px-3 py-[2px]" style={{ borderTop: `1px solid ${accent}15` }}>
        <span className="text-[6px] tracking-[2px]" style={{ color: `${accent}50` }}>WATERFALL DISPLAY</span>
      </div>

      {/* Waterfall canvas */}
      <div className="flex-1 px-2 pb-2 min-h-0">
        <canvas
          ref={waterfallCanvasRef}
          width={400}
          height={240}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Signal list */}
      <div
        className="px-3 py-1 max-h-24 overflow-y-auto"
        style={{ borderTop: `1px solid ${accent}15` }}
      >
        <span className="text-[6px] tracking-[2px] block mb-1" style={{ color: `${accent}50` }}>
          ACTIVE SIGNALS
        </span>
        <div className="flex flex-wrap gap-x-3 gap-y-[2px]">
          {signals
            .filter((s) => s.powerDbm > noiseFloor + 15)
            .slice(0, 20)
            .map((s, i) => (
              <span
                key={i}
                className="text-[6px] font-mono"
                style={{ color: s.anomalous ? '#FF4444' : `${accent}70` }}
              >
                {s.label} {s.frequencyMHz.toFixed(1)}MHz {s.powerDbm.toFixed(0)}dBm
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

function mapPowerToY(powerDbm: number, height: number): number {
  // Map -40 dBm (top) to -130 dBm (bottom)
  const normalized = (powerDbm - (-130)) / ((-40) - (-130));
  return height * (1 - Math.max(0, Math.min(1, normalized)));
}

function powerToColor(normalized: number): string {
  if (normalized < 0.1) return 'rgba(0,0,0,0.95)';
  if (normalized < 0.25) return `rgba(0,0,80,${0.3 + normalized})`;
  if (normalized < 0.5) return `rgba(0,60,180,${0.5 + normalized * 0.5})`;
  if (normalized < 0.7) return `rgba(0,200,100,${0.6 + normalized * 0.3})`;
  if (normalized < 0.85) return `rgba(255,200,0,${0.7 + normalized * 0.2})`;
  return `rgba(255,50,50,${0.8 + normalized * 0.2})`;
}
