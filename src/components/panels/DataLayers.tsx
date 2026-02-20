"use client";

import LayerToggle from "./LayerToggle";
import { LAYERS } from "@/constants/layers";

export default function DataLayers() {
  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center px-3 py-[6px]">
        <span
          className="text-[7px] font-semibold tracking-[1.2px]"
          style={{ color: "var(--text-dim)" }}
        >
          DATA LAYERS
        </span>
      </div>
      {LAYERS.map((layer) => (
        <LayerToggle key={layer.id} id={layer.id} label={layer.label} icon={layer.icon} />
      ))}
    </div>
  );
}
