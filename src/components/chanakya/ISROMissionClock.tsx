"use client";

import { useState, useEffect } from "react";
import { NEXT_ISRO_LAUNCH, CHANAKYA_COLORS } from "@/constants/chanakya";

const saffron = CHANAKYA_COLORS.saffron;

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function ISROMissionClock() {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(NEXT_ISRO_LAUNCH.targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown('T+00D 00H 00M');
        return;
      }

      const days = Math.floor(diff / (86400000));
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);

      setCountdown(`T-${padZero(days)}D ${padZero(hrs)}H ${padZero(mins)}M`);
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed bottom-[118px] right-[230px] z-15 flex items-center gap-2 rounded-sm px-3 py-[5px]"
      style={{
        backgroundColor: CHANAKYA_COLORS.panel,
        border: `1px solid ${saffron}20`,
      }}
    >
      <div
        className="h-[4px] w-[4px] rounded-full animate-pulse-slow"
        style={{ backgroundColor: CHANAKYA_COLORS.green, boxShadow: `0 0 4px ${CHANAKYA_COLORS.green}` }}
      />
      <span className="text-[6px] tracking-[1px]" style={{ color: `${saffron}60` }}>
        NEXT LAUNCH
      </span>
      <span className="text-[7px] font-bold tabular-nums" style={{ color: saffron }}>
        {NEXT_ISRO_LAUNCH.vehicle}
      </span>
      <span className="text-[6px]" style={{ color: `${saffron}50` }}>
        {NEXT_ISRO_LAUNCH.payload}
      </span>
      <span className="text-[8px] font-bold tabular-nums tracking-wider" style={{ color: CHANAKYA_COLORS.green }}>
        {countdown}
      </span>
    </div>
  );
}
