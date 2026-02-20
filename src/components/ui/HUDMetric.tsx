"use client";

interface HUDMetricProps {
  label: string;
  value: string;
  color?: string;
}

export default function HUDMetric({
  label,
  value,
  color = "var(--accent-cyan)",
}: HUDMetricProps) {
  return (
    <div className="flex items-center gap-[6px]">
      <span className="text-[7px] tracking-wider" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      <span
        className="text-[8px] font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}
