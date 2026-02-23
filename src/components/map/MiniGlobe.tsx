"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useDataStore } from "@/stores/dataStore";
import { useMapStore } from "@/stores/mapStore";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";
import { CITIES } from "@/constants/cities";

// Simplified coastline points (lon, lat)
const COASTLINE: [number, number][][] = [
  [[-130,50],[-125,50],[-124,48],[-123,46],[-120,35],[-117,33],[-115,30],[-110,25],[-105,20],[-100,20],[-97,26],[-95,29],[-90,30],[-85,30],[-82,25],[-80,26],[-75,35],[-70,42],[-67,45],[-65,47],[-60,47],[-55,50],[-60,55],[-65,60],[-70,60],[-80,63],[-90,65],[-100,70],[-110,70],[-120,70],[-130,65],[-140,60],[-150,60],[-165,65],[-168,66],[-160,70],[-155,71],[-130,70],[-130,50]],
  [[-80,10],[-75,10],[-60,5],[-50,0],[-35,-5],[-35,-10],[-38,-15],[-40,-22],[-48,-28],[-50,-30],[-52,-33],[-55,-35],[-57,-38],[-65,-40],[-68,-46],[-70,-50],[-73,-45],[-75,-40],[-75,-30],[-70,-18],[-70,-15],[-75,-5],[-78,0],[-80,5],[-80,10]],
  [[-10,36],[-5,36],[0,38],[3,43],[5,43],[5,46],[10,45],[13,45],[15,42],[18,42],[20,40],[25,37],[28,37],[30,40],[30,42],[28,45],[25,46],[20,55],[18,55],[15,55],[10,55],[10,57],[5,58],[5,60],[10,63],[15,65],[20,68],[25,70],[30,70],[35,68],[40,67],[40,62],[30,60],[27,58],[22,55],[20,55],[25,46],[30,42],[30,40],[25,37],[22,37],[20,40],[18,42],[15,42],[13,45],[10,45],[5,46],[5,43],[3,43],[0,38],[-5,36],[-10,36]],
  [[-15,30],[-17,15],[-15,10],[-10,5],[5,5],[10,5],[10,0],[30,-5],[35,-10],[40,-15],[35,-25],[30,-30],[28,-33],[20,-35],[18,-34],[15,-30],[12,-20],[10,-10],[10,0],[10,5],[15,10],[20,15],[25,20],[30,30],[33,32],[35,35],[30,37],[10,37],[5,36],[0,36],[-5,34],[-5,30],[-15,30]],
  [[30,42],[35,42],[40,42],[45,40],[50,38],[55,37],[60,35],[65,25],[70,22],[75,15],[80,10],[85,15],[90,22],[95,15],[100,5],[105,0],[105,15],[110,20],[115,22],[120,25],[122,30],[125,35],[130,35],[130,42],[135,45],[140,42],[145,45],[150,55],[155,60],[160,62],[165,65],[170,65],[175,65],[180,65],[180,70],[170,70],[160,68],[150,60],[145,55],[140,50],[135,52],[130,55],[120,55],[110,55],[100,55],[90,50],[80,50],[70,55],[60,55],[50,52],[40,47],[30,42]],
  [[115,-35],[115,-22],[130,-12],[135,-12],[140,-18],[145,-15],[150,-22],[153,-28],[150,-35],[140,-38],[130,-35],[120,-35],[115,-35]],
];

function projectOrtho(
  lon: number, lat: number,
  centerLon: number, centerLat: number,
  radius: number, cx: number, cy: number
): [number, number, boolean] {
  const RAD = Math.PI / 180;
  const cosC =
    Math.sin(centerLat * RAD) * Math.sin(lat * RAD) +
    Math.cos(centerLat * RAD) * Math.cos(lat * RAD) * Math.cos((lon - centerLon) * RAD);
  if (cosC < 0) return [0, 0, false];
  const x = radius * Math.cos(lat * RAD) * Math.sin((lon - centerLon) * RAD);
  const y = radius * (
    Math.cos(centerLat * RAD) * Math.sin(lat * RAD) -
    Math.sin(centerLat * RAD) * Math.cos(lat * RAD) * Math.cos((lon - centerLon) * RAD)
  );
  return [cx + x, cy - y, true];
}

export default function MiniGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  // Independent rotation state for the mini globe
  const [globeCenter, setGlobeCenter] = useState({ lon: 0, lat: 20 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, lon: 0, lat: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, lon: globeCenter.lon, lat: globeCenter.lat };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [globeCenter]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newLon = dragStart.current.lon - dx * 1.8;
    const newLat = Math.max(-80, Math.min(80, dragStart.current.lat + dy * 1.8));
    setGlobeCenter({ lon: newLon, lat: newLat });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 3;

    const frame = frameRef.current++;
    const cLon = globeCenter.lon;
    const cLat = globeCenter.lat;
    const { lat: camLat, lon: camLon } = useMapStore.getState();
    const { flights, earthquakes } = useDataStore.getState();

    ctx.clearRect(0, 0, W, H);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
    ctx.clip();

    // Globe background with subtle radial gradient
    const bgGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    bgGrad.addColorStop(0, "rgba(10, 20, 35, 0.95)");
    bgGrad.addColorStop(1, "rgba(0, 3, 10, 0.98)");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Lat/lon grid
    ctx.strokeStyle = `${accent}15`;
    ctx.lineWidth = 0.4;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let first = true;
      for (let lon = -180; lon <= 180; lon += 6) {
        const [px, py, vis] = projectOrtho(lon, lat, cLon, cLat, R, cx, cy);
        if (!vis) { first = true; continue; }
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let first = true;
      for (let lat = -90; lat <= 90; lat += 6) {
        const [px, py, vis] = projectOrtho(lon, lat, cLon, cLat, R, cx, cy);
        if (!vis) { first = true; continue; }
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Equator
    ctx.strokeStyle = `${accent}30`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    let eFirst = true;
    for (let lon = -180; lon <= 180; lon += 4) {
      const [px, py, vis] = projectOrtho(lon, 0, cLon, cLat, R, cx, cy);
      if (!vis) { eFirst = true; continue; }
      if (eFirst) { ctx.moveTo(px, py); eFirst = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Coastlines
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 0.7;
    for (const coast of COASTLINE) {
      ctx.beginPath();
      let first = true;
      for (const [lon, lat] of coast) {
        const [px, py, vis] = projectOrtho(lon, lat, cLon, cLat, R, cx, cy);
        if (!vis) { first = true; continue; }
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Flight dots (cyan)
    ctx.fillStyle = "#00FFD1";
    for (const f of flights) {
      if (!f.lat || !f.lon) continue;
      const [px, py, vis] = projectOrtho(f.lon, f.lat, cLon, cLat, R, cx, cy);
      if (!vis) continue;
      ctx.fillRect(px - 0.6, py - 0.6, 1.2, 1.2);
    }

    // Earthquake dots (pulsing red/orange rings)
    for (const q of earthquakes) {
      const [px, py, vis] = projectOrtho(q.lon, q.lat, cLon, cLat, R, cx, cy);
      if (!vis) continue;
      const pulseR = 1.5 + q.magnitude * 0.5 + Math.sin(frame * 0.08 + q.magnitude) * 1.2;
      const pulseAlpha = 0.4 + Math.sin(frame * 0.08 + q.magnitude) * 0.3;
      ctx.beginPath();
      ctx.arc(px, py, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = q.magnitude >= 5 ? `rgba(255,50,50,${pulseAlpha})` : `rgba(255,165,0,${pulseAlpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Center dot
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fillStyle = q.magnitude >= 5 ? "#FF3333" : "#FFA500";
      ctx.fill();
    }

    // City markers (small diamonds)
    for (const city of CITIES) {
      const [px, py, vis] = projectOrtho(city.lon, city.lat, cLon, cLat, R, cx, cy);
      if (!vis) continue;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `${accent}90`;
      ctx.fillRect(-1.5, -1.5, 3, 3);
      ctx.restore();
      // City label
      ctx.fillStyle = `${accent}50`;
      ctx.font = "4px monospace";
      ctx.textAlign = "left";
      ctx.fillText(city.name.split(" ")[0].toUpperCase(), px + 4, py + 1);
    }

    // Camera position on this globe (where main viewer is looking)
    const [cpx, cpy, cvis] = projectOrtho(camLon, camLat, cLon, cLat, R, cx, cy);
    if (cvis) {
      // Pulsing ring
      const camPulse = 3 + Math.sin(frame * 0.06) * 1.5;
      ctx.beginPath();
      ctx.arc(cpx, cpy, camPulse, 0, Math.PI * 2);
      ctx.strokeStyle = `${accent}80`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Center dot
      ctx.beginPath();
      ctx.arc(cpx, cpy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      // Crosshair lines
      ctx.strokeStyle = `${accent}50`;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(cpx - 6, cpy); ctx.lineTo(cpx - 2, cpy);
      ctx.moveTo(cpx + 2, cpy); ctx.lineTo(cpx + 6, cpy);
      ctx.moveTo(cpx, cpy - 6); ctx.lineTo(cpx, cpy - 2);
      ctx.moveTo(cpx, cpy + 2); ctx.lineTo(cpx, cpy + 6);
      ctx.stroke();
    }

    // Atmospheric glow on edge
    const atmosGrad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R + 2);
    atmosGrad.addColorStop(0, "transparent");
    atmosGrad.addColorStop(0.7, `${accent}08`);
    atmosGrad.addColorStop(1, `${accent}20`);
    ctx.beginPath();
    ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
    ctx.fillStyle = atmosGrad;
    ctx.fill();

    ctx.restore(); // un-clip

    // Globe border ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = `${accent}40`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stats text (bottom)
    ctx.fillStyle = `${accent}55`;
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${flights.length} AC  ${earthquakes.length} EQ`, cx, H - 4);

    // Coord text (top)
    ctx.fillStyle = `${accent}40`;
    ctx.font = "4px monospace";
    ctx.fillText(`${cLat.toFixed(0)}°N ${Math.abs(cLon % 360).toFixed(0)}°${cLon >= 0 ? 'E' : 'W'}`, cx, 7);

    animRef.current = requestAnimationFrame(draw);
  }, [accent, globeCenter]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div
      className="fixed bottom-[62px] right-3 z-20"
      style={{
        borderRadius: "50%",
        boxShadow: `0 0 15px ${accent}15, inset 0 0 8px rgba(0,0,0,0.5)`,
        overflow: "hidden",
        width: 110,
        height: 110,
        cursor: dragging.current ? "grabbing" : "grab",
      }}
    >
      <canvas
        ref={canvasRef}
        width={110}
        height={110}
        style={{ width: 110, height: 110, display: "block", touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
