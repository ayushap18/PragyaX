"use client";

import { useRef, useCallback } from "react";

interface SliderControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  accentColor?: string;
  onChange: (value: number) => void;
}

export default function SliderControl({
  label,
  value,
  min = 0,
  max = 100,
  accentColor = "var(--accent-cyan)",
  onChange,
}: SliderControlProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newVal = Math.round(min + (x / rect.width) * (max - min));
    onChange(Math.max(min, Math.min(max, newVal)));
  }, [min, max, onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    updateValue(e.clientX);

    const handleMouseMove = (ev: MouseEvent) => {
      if (dragging.current) updateValue(ev.clientX);
    };
    const handleMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [updateValue]);

  return (
    <div className="flex w-full flex-col gap-[6px] px-3 py-[6px]">
      <div className="flex items-center justify-between">
        <span className="text-[7px] tracking-wider" style={{ color: "var(--text-dim)" }}>
          {label}
        </span>
        <span className="text-[8px] font-bold tabular-nums" style={{ color: accentColor }}>
          {value}
        </span>
      </div>
      <div
        ref={trackRef}
        className="relative h-[4px] w-full cursor-pointer rounded-sm"
        style={{ backgroundColor: `${accentColor}1A` }}
        onMouseDown={handleMouseDown}
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-sm transition-[width] duration-75"
          style={{
            width: `${pct}%`,
            backgroundColor: accentColor,
            boxShadow: `0 0 6px ${accentColor}40`,
          }}
        />
        {/* Handle */}
        <div
          className="absolute top-1/2 rounded-full transition-[left] duration-75"
          style={{
            left: `${pct}%`,
            transform: `translateX(-50%) translateY(-50%)`,
            width: 10,
            height: 10,
            backgroundColor: accentColor,
            boxShadow: `0 0 4px ${accentColor}`,
            border: "1px solid rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </div>
  );
}
