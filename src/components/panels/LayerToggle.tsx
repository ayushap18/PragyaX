"use client";

import { useLayerStore } from "@/stores/layerStore";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";
import type { LayerName } from "@/types";

interface LayerToggleProps {
  id: LayerName;
  label: string;
  icon: string;
}

const ICON_MAP: Record<string, string> = {
  plane: "✈",
  activity: "⬡",
  satellite: "○",
  car: "▣",
  cloud: "☁",
  video: "◉",
};

export default function LayerToggle({ id, label, icon }: LayerToggleProps) {
  const layer = useLayerStore((s) => s.layers[id]);
  const toggleLayer = useLayerStore((s) => s.toggleLayer);
  const accent = MODE_ACCENTS[useModeStore((s) => s.current)];

  const enabled = layer.enabled;
  const count = layer.count;

  return (
    <button
      onClick={() => toggleLayer(id)}
      className="flex w-full items-center justify-between px-3 transition-colors"
      style={{
        height: 32,
        borderBottom: "1px solid var(--border-row)",
        borderLeft: enabled ? `2px solid ${accent}` : "2px solid transparent",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[11px]"
          style={{ color: enabled ? accent : "rgba(200,230,255,0.4)" }}
        >
          {ICON_MAP[icon] || "●"}
        </span>
        <span
          className="text-[9px]"
          style={{
            color: enabled ? "rgba(200,230,255,0.9)" : "rgba(200,230,255,0.5)",
          }}
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {count > 0 && enabled && (
          <span
            className="rounded-sm px-[5px] py-[1px] text-[6px] font-bold"
            style={{
              backgroundColor: `${accent}1A`,
              color: accent,
            }}
          >
            {count > 1000 ? `${(count / 1000).toFixed(1)}K` : count}
          </span>
        )}
        {!enabled && (
          <span className="text-[6px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
            OFF
          </span>
        )}
      </div>
    </button>
  );
}
