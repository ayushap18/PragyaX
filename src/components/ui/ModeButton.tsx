"use client";

import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";

interface ModeButtonProps {
  mode: string;
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

export default function ModeButton({
  label,
  icon,
  isActive,
  onClick,
}: ModeButtonProps) {
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode] || "#00FFD1";

  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-[2px] py-[2px] text-center transition-colors"
      style={{
        color: isActive ? accent : "rgba(255,255,255,0.4)",
        backgroundColor: isActive ? `${accent}14` : "transparent",
        borderBottom: isActive ? `2px solid ${accent}` : "2px solid transparent",
        fontWeight: isActive ? 700 : 400,
      }}
    >
      <span className="text-[11px]">{getIconChar(icon)}</span>
      <span className="text-[8px] tracking-wide">{label}</span>
    </button>
  );
}

function getIconChar(icon: string): string {
  const map: Record<string, string> = {
    globe: "◎",
    monitor: "▣",
    binoculars: "◌◌",
    thermometer: "≋",
    play: "▶",
    "layout-grid": "⊞",
    plane: "✕",
    brain: "⬡",
  };
  return map[icon] || "●";
}
