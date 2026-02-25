"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook that animates a numeric value from its previous to current value.
 * Uses easeOutQuart for natural deceleration.
 * Returns the animated value and a flash flag for significant changes.
 */
export function useAnimatedNumber(
  target: number,
  duration: number = 300,
  flashThreshold: number = 0.1
): { value: number; flashing: boolean } {
  const [display, setDisplay] = useState(target);
  const [flashing, setFlashing] = useState(false);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = target;

    if (prev === target) return;

    // Check for significant change (flash)
    const delta = Math.abs(target - prev);
    const pctDelta = prev !== 0 ? delta / Math.abs(prev) : delta;
    if (pctDelta > flashThreshold) {
      setFlashing(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlashing(false), 300);
    }

    // Animate
    const startTime = performance.now();
    const startValue = prev;

    function easeOutQuart(t: number): number {
      return 1 - Math.pow(1 - t, 4);
    }

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = startValue + (target - startValue) * easedProgress;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [target, duration, flashThreshold]);

  return { value: display, flashing };
}
