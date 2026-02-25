"use client";

import { useRef, useEffect, useCallback } from "react";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  showFill?: boolean;
  label?: string;
}

/**
 * Canvas-based sparkline mini-chart themed to current visual mode.
 */
export function Sparkline({
  data,
  width = 120,
  height = 30,
  showFill = true,
  label,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const pad = 2;

    // Draw fill
    if (showFill) {
      ctx.beginPath();
      ctx.moveTo(0, height);
      data.forEach((v, i) => {
        const x = i * stepX;
        const y = height - pad - ((v - min) / range) * (height - pad * 2);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(width, height);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, accent + "20");
      grad.addColorStop(1, accent + "02");
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Draw line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw latest value dot
    const lastX = (data.length - 1) * stepX;
    const lastY =
      height - pad - ((data[data.length - 1] - min) / range) * (height - pad * 2);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.strokeStyle = accent + "40";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [data, width, height, showFill, accent]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col gap-[2px]">
      {label && (
        <span
          className="text-[5px] tracking-[1px]"
          style={{ color: `${accent}60` }}
        >
          {label}
        </span>
      )}
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
    </div>
  );
}

interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  suffix?: string;
}

/**
 * Canvas-based circular gauge widget.
 */
export function Gauge({
  value,
  max = 100,
  size = 48,
  label,
  suffix = "%",
}: GaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;
    const lineWidth = 3;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const pct = Math.min(value / max, 1);
    const valueAngle = startAngle + (endAngle - startAngle) * pct;

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = accent + "15";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Value arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, valueAngle);
    ctx.strokeStyle = accent;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Glow on value arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, valueAngle);
    ctx.strokeStyle = accent + "40";
    ctx.lineWidth = lineWidth + 3;
    ctx.lineCap = "round";
    ctx.stroke();

    // Center value text
    ctx.fillStyle = accent;
    ctx.font = `bold ${Math.round(size * 0.22)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(value)}${suffix}`, cx, cy);
  }, [value, max, size, suffix, accent]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-[2px]">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
      {label && (
        <span
          className="text-[5px] tracking-[1px]"
          style={{ color: `${accent}60` }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

interface RadarChartProps {
  axes: string[];
  values: number[];
  max?: number;
  size?: number;
}

/**
 * Canvas-based radar/spider chart for multi-axis threat assessment.
 */
export function RadarChart({
  axes,
  values,
  max = 100,
  size = 80,
}: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || axes.length < 3) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 14;
    const n = axes.length;
    const angleStep = (Math.PI * 2) / n;

    // Draw background rings
    [0.25, 0.5, 0.75, 1].forEach((pct) => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius * pct;
        const y = cy + Math.sin(angle) * radius * pct;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = accent + "10";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Draw axes
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.strokeStyle = accent + "15";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Axis label
      const labelR = radius + 8;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      ctx.fillStyle = accent + "60";
      ctx.font = "5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(axes[i], lx, ly);
    }

    // Draw data polygon
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const angle = idx * angleStep - Math.PI / 2;
      const pct = Math.min(values[idx] / max, 1);
      const x = cx + Math.cos(angle) * radius * pct;
      const y = cy + Math.sin(angle) * radius * pct;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.fillStyle = accent + "15";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const pct = Math.min(values[i] / max, 1);
      const x = cx + Math.cos(angle) * radius * pct;
      const y = cy + Math.sin(angle) * radius * pct;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
    }
  }, [axes, values, max, size, accent]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="block"
    />
  );
}
