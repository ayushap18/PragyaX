"use client";

import { useState, useEffect, useCallback } from "react";
import { useHUDStore } from "@/stores/hudStore";
import type { IntelEvent } from "@/stores/hudStore";

const TOAST_COLORS: Record<string, string> = {
  info: "var(--accent-cyan)",
  warn: "var(--accent-amber)",
  alert: "var(--accent-red)",
  success: "var(--accent-green)",
};

interface ToastItem {
  event: IntelEvent;
  dismissing: boolean;
}

export default function AlertToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.event.id === id ? { ...t, dismissing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.event.id !== id));
    }, 300);
  }, []);

  // Subscribe to zustand store outside of render cycle
  useEffect(() => {
    let lastSeenId = -1;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const unsub = useHUDStore.subscribe((state) => {
      if (state.intelFeed.length === 0) return;
      const latest = state.intelFeed[0];
      if (latest.id <= lastSeenId) return;

      lastSeenId = latest.id;

      setToasts((prev) => {
        const next = [{ event: latest, dismissing: false }, ...prev];
        return next.length > 3 ? next.slice(0, 3) : next;
      });

      // Auto-dismiss after 5s
      const eventId = latest.id;
      const timer = setTimeout(() => {
        dismissToast(eventId);
      }, 5000);
      timers.push(timer);
    });

    return () => {
      unsub();
      timers.forEach(clearTimeout);
    };
  }, [dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[42px] right-[4px] z-30 flex flex-col gap-[3px] pointer-events-none" style={{ width: 260 }}>
      {toasts.map((toast) => (
        <div
          key={toast.event.id}
          className={toast.dismissing ? "animate-fade-out" : "animate-slide-in-right"}
          style={{
            backgroundColor: "rgba(0, 8, 16, 0.95)",
            borderLeft: `2px solid ${TOAST_COLORS[toast.event.type]}`,
            borderRight: `1px solid rgba(255,255,255,0.06)`,
            borderTop: `1px solid rgba(255,255,255,0.06)`,
            borderBottom: `1px solid rgba(255,255,255,0.06)`,
            padding: "4px 8px",
            pointerEvents: "auto",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-[4px] w-[4px] rounded-full shrink-0"
              style={{
                backgroundColor: TOAST_COLORS[toast.event.type],
                boxShadow: `0 0 4px ${TOAST_COLORS[toast.event.type]}`,
              }}
            />
            <span className="text-[5px] tabular-nums shrink-0" style={{ color: "var(--text-dim)" }}>
              {toast.event.time.slice(0, 8)}
            </span>
          </div>
          <p className="text-[6px] mt-[2px] leading-[1.4]" style={{ color: TOAST_COLORS[toast.event.type] }}>
            {toast.event.text}
          </p>
        </div>
      ))}
    </div>
  );
}
