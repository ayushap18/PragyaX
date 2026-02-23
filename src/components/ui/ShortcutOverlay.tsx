"use client";

import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";

const SHORTCUTS = [
  { key: '1-6', action: 'Switch visual mode (NORMAL/CRT/NVG/FLIR/GREEN/DRONE)' },
  { key: 'C', action: 'Toggle Chanakya mode' },
  { key: 'F', action: 'Toggle flights layer' },
  { key: 'S', action: 'Toggle satellites layer' },
  { key: 'E', action: 'Toggle earthquakes layer' },
  { key: 'SPACE', action: 'Toggle globe auto-rotation' },
  { key: 'Cmd+K', action: 'Open command modal' },
  { key: 'ESC', action: 'Close modal / overlay' },
  { key: '?', action: 'Show this help overlay' },
];

export default function ShortcutOverlay({ onClose }: { onClose: () => void }) {
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col gap-3 p-6 panel-chrome"
        style={{
          backgroundColor: "rgba(0, 8, 16, 0.98)",
          border: `1px solid ${accent}30`,
          minWidth: 340,
          maxWidth: 420,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `1px solid ${accent}20` }}>
          <span className="text-[10px] font-bold tracking-[2px]" style={{ color: accent }}>
            KEYBOARD SHORTCUTS
          </span>
          <div className="flex-1" />
          <span className="text-[6px] tracking-wider" style={{ color: "var(--text-dim)" }}>
            PRAGYAX OPERATIONS MANUAL
          </span>
        </div>

        {/* Shortcuts list */}
        <div className="flex flex-col gap-[6px]">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <div
                className="flex items-center justify-center px-2 py-[3px] rounded-sm min-w-[50px]"
                style={{
                  backgroundColor: `${accent}15`,
                  border: `1px solid ${accent}30`,
                }}
              >
                <span className="text-[8px] font-bold tabular-nums" style={{ color: accent }}>
                  {s.key}
                </span>
              </div>
              <span className="text-[8px]" style={{ color: "var(--text-primary)" }}>
                {s.action}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center pt-2" style={{ borderTop: `1px solid ${accent}15` }}>
          <span className="text-[5px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
            PRESS ESC OR CLICK OUTSIDE TO CLOSE
          </span>
        </div>
      </div>
    </div>
  );
}
