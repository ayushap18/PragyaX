"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SFX } from "@/utils/audioEngine";

// ── Auth phase duration ──
const AUTH_DURATION = 2000;

// ── Boot phases ──
const PHASE_1_LINES = [
  { text: "PRAGYAX GEOSPATIAL INTELLIGENCE SYSTEM", delay: 0, color: "#00FFD1" },
  { text: "VERSION 4.2.1 BUILD 20260223-TS", delay: 150, color: "#00FFD180" },
  { text: "════════════════════════════════════════════", delay: 250, color: "#00FFD120" },
];

const PHASE_2_LINES = [
  { text: "[BIOS] POST check ................................ OK", delay: 400, color: "#00FF41" },
  { text: "[KERN] Loading microkernel rev.7 ................. OK", delay: 700, color: "#00FF41" },
  { text: "[INIT] Memory allocation 16384MB ................. OK", delay: 950, color: "#00FF41" },
  { text: "[DRVR] GPU compute pipeline initialized .......... OK", delay: 1200, color: "#00FF41" },
  { text: "[NETW] Establishing TLS 1.3 tunnel ............... OK", delay: 1500, color: "#00FF41" },
  { text: "[AUTH] Verifying clearance: TS/SCI-TK-GAMMA ...... OK", delay: 1800, color: "#00FF41" },
];

const PHASE_3_LINES = [
  { text: "[COMM] SATCOM relay handshake — KEYHOLE-19 ....... LOCKED", delay: 2200, color: "#FFA500" },
  { text: "[COMM] SIGINT uplink 14.223 GHz .................. ACTIVE", delay: 2500, color: "#FFA500" },
  { text: "[CESM] CesiumJS globe engine v1.138 .............. LOADED", delay: 2800, color: "#FFA500" },
  { text: "[TILE] Google Photorealistic 3D Tileset .......... LOADED", delay: 3000, color: "#FFA500" },
];

const PHASE_4_LINES = [
  { text: "[FEED] ADS-B transponder array ................... LIVE", delay: 3300, color: "#00FF41" },
  { text: "[FEED] SIGINT intercept mesh ..................... LIVE", delay: 3500, color: "#00FF41" },
  { text: "[FEED] Orbital tracking network .................. LIVE", delay: 3700, color: "#00FF41" },
  { text: "[FEED] Seismic telemetry grid .................... LIVE", delay: 3900, color: "#00FF41" },
  { text: "[FEED] CCTV surveillance mesh .................... LIVE", delay: 4050, color: "#00FF41" },
  { text: "[ENCR] AES-256-GCM session cipher ................ ESTABLISHED", delay: 4200, color: "#00FFD1" },
  { text: "[AI  ] ARGUS-7 neural core ....................... ONLINE", delay: 4400, color: "#00FFD1" },
  { text: "[SYS ] All 47 subsystems nominal", delay: 4600, color: "#00FF41" },
];

const FINAL_LINES = [
  { text: "", delay: 4800, color: "#00FFD1" },
  { text: "CLEARANCE GRANTED — WELCOME, OPERATOR", delay: 4900, color: "#00FFD1" },
  { text: "ENTERING OPERATIONAL MODE ►", delay: 5100, color: "#00FFD1" },
];

const ALL_LINES = [...PHASE_1_LINES, ...PHASE_2_LINES, ...PHASE_3_LINES, ...PHASE_4_LINES, ...FINAL_LINES];
const BOOT_DURATION = 6200;

// ── Biometric Auth Phase ──
function AuthPhase({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef(0);
  const [authStep, setAuthStep] = useState<'scanning' | 'verified'>('scanning');
  const [sessionCode] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());

  useEffect(() => {
    startTime.current = Date.now();
    SFX.biometricScan();
    const verifyTimer = setTimeout(() => {
      setAuthStep('verified');
      SFX.biometricSuccess();
    }, 1400);
    const completeTimer = setTimeout(() => onComplete(), AUTH_DURATION);
    return () => {
      clearTimeout(verifyTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;

    function draw() {
      if (!ctx) return;
      const elapsed = (Date.now() - startTime.current) / 1000;
      ctx.clearRect(0, 0, size, size);

      const isVerified = authStep === 'verified';
      const baseColor = isVerified ? '0,255,65' : '0,255,209';

      // Outer ring
      ctx.strokeStyle = `rgba(${baseColor},${isVerified ? 0.6 : 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.stroke();

      // Expanding scan rings
      if (!isVerified) {
        for (let i = 0; i < 3; i++) {
          const ringProgress = ((elapsed * 0.8 + i * 0.33) % 1);
          const ringRadius = 10 + ringProgress * 50;
          const alpha = (1 - ringProgress) * 0.4;
          ctx.strokeStyle = `rgba(${baseColor},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Scanning line
        const scanY = cy - 35 + (Math.sin(elapsed * 3) * 0.5 + 0.5) * 70;
        ctx.strokeStyle = `rgba(${baseColor},0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 30, scanY);
        ctx.lineTo(cx + 30, scanY);
        ctx.stroke();
      }

      // Fingerprint abstract arcs
      ctx.strokeStyle = `rgba(${baseColor},${isVerified ? 0.4 : 0.15})`;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 9; i++) {
        const r = 6 + i * 4.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -0.8 + i * 0.08, 0.8 + i * 0.08);
        ctx.stroke();
      }

      // Verified flash + checkmark
      if (isVerified) {
        // Green glow
        const glowAlpha = 0.15 + Math.sin(elapsed * 4) * 0.05;
        ctx.fillStyle = `rgba(0,255,65,${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.fill();

        // Checkmark
        ctx.strokeStyle = 'rgba(0,255,65,0.9)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00FF41';
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy);
        ctx.lineTo(cx - 4, cy + 12);
        ctx.lineTo(cx + 16, cy - 12);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Corner marks
      const m = 8;
      const len = 12;
      ctx.strokeStyle = `rgba(${baseColor},0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(m, m + len); ctx.lineTo(m, m); ctx.lineTo(m + len, m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(size - m - len, m); ctx.lineTo(size - m, m); ctx.lineTo(size - m, m + len); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m, size - m - len); ctx.lineTo(m, size - m); ctx.lineTo(m + len, size - m); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(size - m - len, size - m); ctx.lineTo(size - m, size - m); ctx.lineTo(size - m, size - m - len); ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [authStep]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} style={{ width: 160, height: 160 }} />

      <div className="flex flex-col items-center gap-2">
        <span
          className="text-[9px] font-bold tracking-[3px]"
          style={{ color: authStep === 'verified' ? '#00FF41' : '#00FFD1' }}
        >
          {authStep === 'verified' ? 'IDENTITY VERIFIED' : 'BIOMETRIC SCAN'}
        </span>

        <div className="flex flex-col items-center gap-[3px]">
          <AuthLine label="CLEARANCE" value="TS/SCI-TK-GAMMA" show={true} verified={authStep === 'verified'} />
          <AuthLine label="OPERATOR" value="AUTHORIZED" show={true} verified={authStep === 'verified'} />
          <AuthLine label="SESSION" value={sessionCode} show={true} verified={authStep === 'verified'} />
        </div>
      </div>
    </div>
  );
}

function AuthLine({ label, value, show, verified }: { label: string; value: string; show: boolean; verified: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[6px] tracking-[1px] w-[60px] text-right" style={{ color: 'rgba(200,230,255,0.3)' }}>
        {label}
      </span>
      <span className="text-[7px] font-bold tabular-nums" style={{ color: verified ? '#00FF41' : '#00FFD180' }}>
        {value}
      </span>
    </div>
  );
}

// ── Radar scope canvas ──
function RadarScope({ progress, phase }: { progress: number; phase: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngle = useRef(0);
  const animRef = useRef<number>(0);
  const blipsRef = useRef<{ x: number; y: number; age: number; size: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      // Background grid
      ctx.strokeStyle = "rgba(0,255,209,0.06)";
      ctx.lineWidth = 0.5;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (r / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Cross lines
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.stroke();

      // Diagonal lines
      ctx.strokeStyle = "rgba(0,255,209,0.03)";
      for (let a = 0; a < 360; a += 30) {
        const rad = (a * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
        ctx.stroke();
      }

      // Degree markers
      ctx.fillStyle = "rgba(0,255,209,0.25)";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      for (let a = 0; a < 360; a += 90) {
        const rad = (a * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * (r + 6);
        const ly = cy + Math.sin(rad) * (r + 6) + 3;
        ctx.fillText(`${a}°`, lx, ly);
      }

      // Sweep line
      sweepAngle.current += 0.03;
      const sweepRad = sweepAngle.current;
      const gradient = ctx.createLinearGradient(cx, cy, cx + Math.cos(sweepRad) * r, cy + Math.sin(sweepRad) * r);
      gradient.addColorStop(0, "rgba(0,255,209,0.01)");
      gradient.addColorStop(0.7, "rgba(0,255,209,0.3)");
      gradient.addColorStop(1, "rgba(0,255,209,0.6)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepRad) * r, cy + Math.sin(sweepRad) * r);
      ctx.stroke();

      // Sweep trail (fan)
      for (let i = 0; i < 30; i++) {
        const trailAngle = sweepRad - (i * 0.01);
        const alpha = 0.08 * (1 - i / 30);
        ctx.strokeStyle = `rgba(0,255,209,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(trailAngle) * r,
          cy + Math.sin(trailAngle) * r
        );
        ctx.stroke();
      }

      // Generate blips as phases advance
      if (phase >= 2 && Math.random() < 0.04) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * (r - 30);
        blipsRef.current.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          age: 0,
          size: 1 + Math.random() * 2,
        });
      }

      // Draw and age blips
      blipsRef.current = blipsRef.current.filter((b) => b.age < 120);
      blipsRef.current.forEach((b) => {
        b.age++;
        const alpha = Math.max(0, 1 - b.age / 120);
        ctx.fillStyle = `rgba(0,255,209,${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.fillStyle = `rgba(0,255,209,${alpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Center dot
      ctx.fillStyle = "rgba(0,255,209,0.8)";
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // Outer rim glow
      ctx.strokeStyle = `rgba(0,255,209,${0.15 + Math.sin(Date.now() / 500) * 0.05})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Progress arc
      if (progress > 0) {
        ctx.strokeStyle = "#00FFD1";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#00FFD1";
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [progress, phase]);

  return (
    <canvas
      ref={canvasRef}
      className="opacity-80"
      style={{ width: 280, height: 280 }}
    />
  );
}

// ── Hex grid background ──
function HexBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="hexPattern" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
            <path d="M28 2L54 18V50L28 66L2 50V18Z" fill="none" stroke="#00FFD1" strokeWidth="0.5" />
            <path d="M28 34L54 50V82L28 98L2 82V50Z" fill="none" stroke="#00FFD1" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexPattern)" />
      </svg>
    </div>
  );
}

// ── Status bar ──
function StatusBar({ label, value, maxValue, color, delay }: { label: string; value: number; maxValue: number; color: string; delay: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setCurrent((prev) => {
          const next = prev + Math.random() * maxValue * 0.05;
          if (next >= value) {
            clearInterval(interval);
            return value;
          }
          return next;
        });
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, maxValue, delay]);

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-right text-[7px] tracking-wider" style={{ color: "rgba(200,230,255,0.4)" }}>{label}</span>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,200,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${(current / maxValue) * 100}%`,
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}`,
          }}
        />
      </div>
      <span className="w-10 text-[7px] tabular-nums" style={{ color }}>
        {Math.round(current)}{label === "MEM" ? "MB" : "%"}
      </span>
    </div>
  );
}

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [authDone, setAuthDone] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [fading, setFading] = useState(false);
  const [phase, setPhase] = useState(0);
  const [sessionCode] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [bootTimestamp] = useState(() => new Date().toISOString().slice(0, 19));
  const progress = Math.min(visibleLines / ALL_LINES.length, 1);

  const handleAuthComplete = useCallback(() => {
    setAuthDone(true);
  }, []);

  useEffect(() => {
    if (!authDone) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    ALL_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
          // Sound effects
          if (line.text.includes("OK") || line.text.includes("LIVE") || line.text.includes("LOADED") || line.text.includes("LOCKED")) {
            SFX.bootChirp();
          } else if (line.text.includes("OPERATIONAL")) {
            SFX.bootReady();
          } else if (line.text.includes("═")) {
            SFX.bootStatic();
          } else if (line.text.length > 0) {
            SFX.bootBeep();
          }
        }, line.delay)
      );
    });

    // Phase transitions
    timers.push(setTimeout(() => setPhase(1), 300));
    timers.push(setTimeout(() => { setPhase(2); SFX.bootScan(); }, 2100));
    timers.push(setTimeout(() => { setPhase(3); SFX.bootScan(); }, 3200));
    timers.push(setTimeout(() => setPhase(4), 4500));

    timers.push(setTimeout(() => setFading(true), BOOT_DURATION - 800));
    timers.push(setTimeout(() => onComplete(), BOOT_DURATION));

    return () => timers.forEach(clearTimeout);
  }, [authDone, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <HexBackground />

      {/* Scanlines overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
        }}
      />

      {/* Auth Phase */}
      {!authDone && (
        <div className="relative">
          <AuthPhase onComplete={handleAuthComplete} />
        </div>
      )}

      {/* Main Boot Phase */}
      {authDone && (
        <div className="relative flex items-center gap-8">
          {/* Left: Radar scope */}
          <div className="relative flex flex-col items-center gap-2">
            <RadarScope progress={progress} phase={phase} />
            <span className="text-[8px] tracking-[3px] animate-pulse-slow" style={{ color: "#00FFD180" }}>
              {phase < 3 ? "SCANNING" : phase < 4 ? "ACQUIRING" : "LOCKED"}
            </span>
          </div>

          {/* Right: Terminal output */}
          <div className="flex w-[440px] flex-col gap-3">
            {/* Classification header */}
            <div className="flex items-center gap-3" style={{ opacity: phase >= 1 ? 1 : 0 }}>
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,50,50,0.3)" }} />
              <span className="text-[8px] font-bold tracking-[2px] animate-pulse-slow" style={{ color: "rgba(255,50,50,0.7)" }}>
                TOP SECRET // SI-TK // NOFORN
              </span>
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,50,50,0.3)" }} />
            </div>

            {/* Terminal lines */}
            <div className="scrollbar-hide max-h-[320px] overflow-y-auto font-mono">
              {ALL_LINES.slice(0, visibleLines).map((line, i) => (
                <div
                  key={i}
                  className="animate-fade-in-up text-[10px] leading-[1.7]"
                  style={{ color: line.color, opacity: line.text ? 1 : 0 }}
                >
                  {line.text}
                  {i === visibleLines - 1 && line.text && (
                    <span className="animate-cursor" style={{ color: line.color }}>{" "}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Status bars */}
            <div className="flex flex-col gap-[6px] mt-1" style={{ opacity: phase >= 2 ? 1 : 0.2, transition: "opacity 0.5s" }}>
              <StatusBar label="CPU" value={94} maxValue={100} color="#00FF41" delay={2200} />
              <StatusBar label="MEM" value={12480} maxValue={16384} color="#00FFD1" delay={2500} />
              <StatusBar label="GPU" value={87} maxValue={100} color="#FFA500" delay={2800} />
              <StatusBar label="UPLINK" value={98} maxValue={100} color="#00FF41" delay={3200} />
            </div>

            {/* Progress bar */}
            <div className="mt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7px] tracking-[1px]" style={{ color: "rgba(0,255,209,0.4)" }}>SYSTEM INITIALIZATION</span>
                <span className="text-[8px] tabular-nums font-bold" style={{ color: "#00FFD1" }}>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,200,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: "#00FFD1",
                    boxShadow: "0 0 8px #00FFD1, 0 0 20px #00FFD140",
                  }}
                />
              </div>
            </div>

            {/* Bottom info strip */}
            <div className="flex items-center justify-between mt-1" style={{ opacity: phase >= 1 ? 0.6 : 0 }}>
              <span className="text-[6px] tracking-[1px]" style={{ color: "rgba(200,230,255,0.3)" }}>
                OPERATOR: AUTHORIZED
              </span>
              <span className="text-[6px] tracking-[1px]" style={{ color: "rgba(200,230,255,0.3)" }}>
                SESSION: {sessionCode}
              </span>
              <span className="text-[6px] tracking-[1px] tabular-nums" style={{ color: "rgba(200,230,255,0.3)" }}>
                {bootTimestamp}Z
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t border-l" style={{ borderColor: "rgba(0,255,209,0.2)" }} />
      <div className="absolute top-6 right-6 w-8 h-8 border-t border-r" style={{ borderColor: "rgba(0,255,209,0.2)" }} />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l" style={{ borderColor: "rgba(0,255,209,0.2)" }} />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r" style={{ borderColor: "rgba(0,255,209,0.2)" }} />
    </div>
  );
}
