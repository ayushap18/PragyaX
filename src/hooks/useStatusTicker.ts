"use client";

import { useEffect, useRef } from 'react';
import { useAIStore } from '@/stores/aiStore';
import { fetchTickerMessages } from '@/services/claudeService';

export function useStatusTicker() {
  const setTickerMessages = useAIStore((s) => s.setTickerMessages);
  const advanceTicker = useAIStore((s) => s.advanceTicker);
  const tickerMessages = useAIStore((s) => s.tickerMessages);
  const fetchedRef = useRef(false);
  const tickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch ticker messages on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchTickerMessages()
      .then((result) => {
        if (result.messages?.length > 0) {
          setTickerMessages(result.messages);
        }
      })
      .catch(() => {
        // Use fallback messages
        setTickerMessages([
          'SYSTEM NOMINAL — ALL FEEDS ACTIVE',
          'COMSAT RELAY LATENCY 12MS — NOMINAL',
          'ORBIT PREDICTION ACCURACY 99.7%',
          'ENCRYPTION RATCHET — SESSION KEY ACTIVE',
          'SENSOR COVERAGE 94% — 3 SECTORS DEGRADED',
          'DATA FUSION ENGINE — 14,221 ENTITIES TRACKED',
          'SIGINT PROCESSOR — 847 INTERCEPTS QUEUED',
          'IMINT PIPELINE — 12 HIGH-PRI TASKS',
          'MESH NETWORK — 8 NODES ONLINE',
          'BACKUP UPLINK — STANDBY',
        ]);
      });
  }, [setTickerMessages]);

  // Advance ticker every 5s
  useEffect(() => {
    if (tickerMessages.length === 0) return;

    tickerIntervalRef.current = setInterval(() => {
      advanceTicker();
    }, 5000);

    return () => {
      if (tickerIntervalRef.current) {
        clearInterval(tickerIntervalRef.current);
      }
    };
  }, [tickerMessages.length, advanceTicker]);
}
