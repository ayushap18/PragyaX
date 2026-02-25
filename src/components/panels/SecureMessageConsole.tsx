"use client";

import { useState, useEffect, useRef } from "react";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";
import { SFX } from "@/utils/audioEngine";

type MessageChannel = "FLASH" | "PRIORITY" | "ROUTINE" | "ADMIN";
type MessageClassification = "TS" | "S" | "C" | "U";

interface SecureMessage {
  id: string;
  timestamp: string;
  classification: MessageClassification;
  channel: MessageChannel;
  text: string;
  fromAI?: boolean;
}

const CHANNEL_COLORS: Record<MessageChannel, string> = {
  FLASH: "#FF3333",
  PRIORITY: "#FFA500",
  ROUTINE: "#00FFD1",
  ADMIN: "#4488FF",
};

const CLASSIFICATION_LABELS: Record<MessageClassification, string> = {
  TS: "TOP SECRET",
  S: "SECRET",
  C: "CONFIDENTIAL",
  U: "UNCLASSIFIED",
};

const AI_MESSAGES: string[] = [
  "SIGINT intercept confirmed on FREQ 14.225MHz. Monitoring.",
  "Satellite GSAT-30 telemetry nominal. Uplink stable.",
  "Flight density anomaly detected sector NW-7. Analyzing.",
  "Seismic activity cluster forming near Andaman trench.",
  "AQI spike detected Delhi-NCR region. PM2.5 > 300.",
  "Border patrol checkpoint Alpha reports all clear.",
  "ISRO PSLV-C59 launch T-minus 72 hours. Pre-launch GO.",
  "Cyber threat intelligence update: APT actors active.",
  "Maritime patrol reports unusual vessel activity Arabian Sea.",
  "Weather front approaching eastern seaboard. Advisory issued.",
  "ELINT scan complete sector 4. No anomalous emissions.",
  "Ground station handover ISTRAC → IDSN complete.",
];

interface SecureMessageConsoleProps {
  onClose: () => void;
}

export default function SecureMessageConsole({ onClose }: SecureMessageConsoleProps) {
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<MessageChannel>("ROUTINE");
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulated incoming AI messages
  useEffect(() => {
    const addAIMessage = () => {
      const text = AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)];
      const channels: MessageChannel[] = ["FLASH", "PRIORITY", "ROUTINE"];
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const classifications: MessageClassification[] = ["TS", "S", "C"];
      const classification = classifications[Math.floor(Math.random() * classifications.length)];

      const msg: SecureMessage = {
        id: `ai-${Date.now()}`,
        timestamp: new Date().toISOString().slice(11, 19),
        classification,
        channel,
        text,
        fromAI: true,
      };

      setMessages((prev) => [...prev.slice(-50), msg]); // Keep last 50
      SFX.alert();
    };

    // Initial message after 2 seconds
    const initialTimeout = setTimeout(addAIMessage, 2000);

    // Then every 15-30 seconds
    aiIntervalRef.current = setInterval(
      addAIMessage,
      15000 + Math.random() * 15000
    );

    return () => {
      clearTimeout(initialTimeout);
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const msg: SecureMessage = {
      id: `user-${Date.now()}`,
      timestamp: new Date().toISOString().slice(11, 19),
      classification: "S",
      channel: selectedChannel,
      text: input.trim().toUpperCase(),
    };

    setMessages((prev) => [...prev.slice(-50), msg]);
    setInput("");
    SFX.click();
  };

  return (
    <div
      className="fixed left-[220px] top-[38px] bottom-14 z-30 w-[340px] flex flex-col panel-tier-1"
      style={{
        borderRight: `1px solid ${accent}20`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${accent}15` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-[4px] w-[4px] rounded-full animate-blink-rec"
            style={{ backgroundColor: accent }}
          />
          <span
            className="text-[7px] font-bold tracking-[1.5px]"
            style={{ color: accent }}
          >
            SECURE COMMS
          </span>
          <span
            className="text-[5px] tracking-[1px] px-1 rounded-sm"
            style={{
              color: "#FF3333",
              border: "1px solid #FF333340",
              backgroundColor: "rgba(255,51,51,0.1)",
            }}
          >
            ENCRYPTED
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[8px] font-bold transition-colors hover:opacity-80 cursor-pointer"
          style={{ color: "var(--text-dim)" }}
        >
          ✕
        </button>
      </div>

      {/* Channel selector */}
      <div className="flex items-center gap-1 px-3 py-1" style={{ borderBottom: `1px solid ${accent}10` }}>
        {(["FLASH", "PRIORITY", "ROUTINE", "ADMIN"] as MessageChannel[]).map((ch) => (
          <button
            key={ch}
            onClick={() => { setSelectedChannel(ch); SFX.click(); }}
            className="text-[5px] tracking-[0.5px] px-[5px] py-[2px] rounded-sm cursor-pointer transition-colors"
            style={{
              color: selectedChannel === ch ? "#000" : CHANNEL_COLORS[ch],
              backgroundColor: selectedChannel === ch ? CHANNEL_COLORS[ch] : "transparent",
              border: `1px solid ${CHANNEL_COLORS[ch]}30`,
              fontWeight: selectedChannel === ch ? 700 : 400,
            }}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1 font-mono"
        style={{ backgroundColor: "rgba(0,5,10,0.5)" }}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <span className="text-[6px] tracking-[1px]" style={{ color: "var(--text-dim)" }}>
              AWAITING TRANSMISSIONS...
            </span>
          </div>
        )}
        {messages.map((msg) => (
          <MessageLine key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input area */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderTop: `1px solid ${accent}15` }}
      >
        <span className="text-[6px] font-bold" style={{ color: accent }}>
          &gt;
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="ENTER MESSAGE..."
          className="flex-1 bg-transparent text-[7px] font-mono outline-none placeholder:text-[var(--text-dim)]"
          style={{ color: "var(--text-primary)" }}
        />
        <button
          onClick={handleSend}
          className="text-[6px] font-bold tracking-[1px] px-2 py-[2px] rounded-sm cursor-pointer transition-colors"
          style={{
            color: accent,
            border: `1px solid ${accent}40`,
            backgroundColor: `${accent}10`,
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}

function MessageLine({ message }: { message: SecureMessage }) {
  const channelColor = CHANNEL_COLORS[message.channel];

  return (
    <div
      className="flex items-start gap-[4px] py-[2px] animate-fade-in-up text-[6px] font-mono leading-[1.6]"
      style={{ borderLeft: message.fromAI ? `2px solid ${channelColor}40` : "2px solid transparent", paddingLeft: 4 }}
    >
      <span className="tabular-nums shrink-0" style={{ color: "var(--text-dim)" }}>
        [{message.timestamp}]
      </span>
      <span
        className="shrink-0 font-bold"
        style={{ color: message.classification === "TS" ? "#FF3333" : "#FFA500" }}
      >
        [{CLASSIFICATION_LABELS[message.classification]}]
      </span>
      <span className="shrink-0 font-bold" style={{ color: channelColor }}>
        [{message.channel}]
      </span>
      <span style={{ color: message.fromAI ? "rgba(200,230,255,0.7)" : "rgba(200,230,255,0.9)" }}>
        {message.text}
      </span>
    </div>
  );
}
