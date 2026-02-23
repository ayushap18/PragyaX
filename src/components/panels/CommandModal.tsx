"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAIStore } from "@/stores/aiStore";
import { useMapStore } from "@/stores/mapStore";
import { useModeStore } from "@/stores/modeStore";
import { useLayerStore } from "@/stores/layerStore";
import { useDataStore } from "@/stores/dataStore";
import { parseCommand } from "@/services/claudeService";
import { executeCommand } from "@/utils/commandExecutor";
import { MODE_ACCENTS } from "@/constants/modes";

export default function CommandModal() {
  const isOpen = useAIStore((s) => s.commandModalOpen);
  const setOpen = useAIStore((s) => s.setCommandModalOpen);
  const addCommand = useAIStore((s) => s.addCommand);
  const commandHistory = useAIStore((s) => s.commandHistory);
  const isProcessing = useAIStore((s) => s.isProcessingCommand);
  const setProcessing = useAIStore((s) => s.setProcessingCommand);
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K global listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setInput("");
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const cmd = input.trim();
      if (!cmd || isProcessing) return;

      setProcessing(true);
      const entryId = Date.now();

      addCommand({
        id: entryId,
        input: cmd,
        response: {},
        timestamp: new Date().toISOString(),
        status: "pending",
      });

      try {
        const currentCity = useMapStore.getState().currentCity;
        const lat = useMapStore.getState().lat;
        const lon = useMapStore.getState().lon;
        const mode = useModeStore.getState().current;
        const layers = useLayerStore.getState().layers;
        const activeLayers = Object.entries(layers)
          .filter(([, v]) => v.enabled)
          .map(([k]) => k);
        const flights = useDataStore.getState().flights;
        const satellites = useDataStore.getState().satelliteTLEs;

        const response = await parseCommand(cmd, {
          currentCity,
          currentLat: lat,
          currentLon: lon,
          currentMode: mode,
          activeLayers,
          flightCount: flights.length,
          satelliteCount: satellites.length,
        });

        const result = executeCommand(response);

        addCommand({
          id: entryId,
          input: cmd,
          response: { ...response, executionResult: result },
          timestamp: new Date().toISOString(),
          status: result.success ? "success" : "error",
        });

        setInput("");
      } catch (err) {
        addCommand({
          id: entryId,
          input: cmd,
          response: { error: err instanceof Error ? err.message : "Failed" },
          timestamp: new Date().toISOString(),
          status: "error",
        });
      } finally {
        setProcessing(false);
      }
    },
    [input, isProcessing, setProcessing, addCommand]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="w-[560px] max-w-[90vw] flex flex-col"
        style={{
          border: `1px solid ${accent}40`,
          backgroundColor: "rgba(0,5,15,0.95)",
          boxShadow: `0 0 40px ${accent}15, inset 0 1px 0 ${accent}10`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            borderBottom: `1px solid ${accent}20`,
            backgroundColor: `${accent}05`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[7px] font-bold tracking-[2px]"
              style={{ color: accent }}
            >
              ARGUS COMMAND INTERFACE
            </span>
            <span
              className="text-[6px] tracking-[1px]"
              style={{ color: `${accent}60` }}
            >
              v7.4
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[6px] tracking-[1px]"
              style={{ color: "var(--text-dim)" }}
            >
              ESC TO CLOSE
            </span>
            <span
              className="rounded-sm px-1 py-[1px] text-[6px] font-bold"
              style={{
                backgroundColor: `${accent}20`,
                color: accent,
                border: `1px solid ${accent}30`,
              }}
            >
              CMD+K
            </span>
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-3">
          <span
            className="mr-2 text-[10px] font-bold"
            style={{ color: accent }}
          >
            &gt;
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ENTER COMMAND..."
            disabled={isProcessing}
            className="flex-1 bg-transparent text-[11px] font-mono tracking-wide outline-none placeholder:opacity-30"
            style={{
              color: "rgba(200,230,255,0.9)",
              caretColor: accent,
            }}
            autoComplete="off"
            spellCheck={false}
          />
          {isProcessing && (
            <span
              className="text-[7px] font-bold tracking-[1px] animate-pulse"
              style={{ color: accent }}
            >
              PROCESSING
            </span>
          )}
        </form>

        {/* Command history */}
        {commandHistory.length > 0 && (
          <div
            className="max-h-[240px] overflow-y-auto px-4 py-2"
            style={{
              borderTop: `1px solid ${accent}15`,
            }}
          >
            <div className="flex flex-col gap-2">
              {commandHistory.slice(0, 8).map((entry) => (
                <div key={entry.id} className="flex flex-col gap-[2px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[7px] font-mono"
                      style={{ color: `${accent}60` }}
                    >
                      {entry.timestamp.slice(11, 19)}Z
                    </span>
                    <span
                      className="text-[7px]"
                      style={{
                        color:
                          entry.status === "success"
                            ? "#00FF41"
                            : entry.status === "error"
                            ? "#FF3333"
                            : `${accent}80`,
                      }}
                    >
                      {entry.status === "success"
                        ? "OK"
                        : entry.status === "error"
                        ? "ERR"
                        : "..."}
                    </span>
                    <span
                      className="text-[8px] font-mono"
                      style={{ color: "rgba(200,230,255,0.6)" }}
                    >
                      {entry.input}
                    </span>
                  </div>
                  {typeof (entry.response as Record<string, unknown>)?.narration === 'string' && (
                      <span
                        className="ml-[60px] text-[7px]"
                        style={{ color: `${accent}50` }}
                      >
                        {(entry.response as Record<string, unknown>).narration as string}
                      </span>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick hints */}
        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{
            borderTop: `1px solid ${accent}10`,
            backgroundColor: `${accent}03`,
          }}
        >
          <span
            className="text-[6px] tracking-[1px]"
            style={{ color: "var(--text-dim)" }}
          >
            TRY:
          </span>
          {["fly to tokyo", "switch to NVG", "enable satellites", "status"].map(
            (hint) => (
              <button
                key={hint}
                onClick={() => setInput(hint)}
                className="text-[6px] tracking-[0.5px] transition-colors hover:opacity-80"
                style={{
                  color: `${accent}50`,
                  cursor: "pointer",
                }}
              >
                {hint}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
