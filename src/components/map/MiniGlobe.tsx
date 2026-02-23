"use client";

import { useEffect, useRef, useCallback } from "react";
import { useDataStore } from "@/stores/dataStore";
import { useMapStore } from "@/stores/mapStore";
import { useModeStore } from "@/stores/modeStore";
import { MODE_ACCENTS } from "@/constants/modes";

// Simple coastline points (lon, lat) for rough continent outlines
const COASTLINE: [number, number][][] = [
  // North America (simplified)
  [[-130,50],[-125,50],[-124,48],[-123,46],[-120,35],[-117,33],[-115,30],[-110,25],[-105,20],[-100,20],[-97,26],[-95,29],[-90,30],[-85,30],[-82,25],[-80,26],[-75,35],[-70,42],[-67,45],[-65,47],[-60,47],[-55,50],[-60,55],[-65,60],[-70,60],[-80,63],[-90,65],[-100,70],[-110,70],[-120,70],[-130,65],[-140,60],[-150,60],[-165,65],[-168,66],[-160,70],[-155,71],[-130,70],[-130,50]],
  // South America
  [[-80,10],[-75,10],[-60,5],[-50,0],[-35,-5],[-35,-10],[-38,-15],[-40,-22],[-48,-28],[-50,-30],[-52,-33],[-55,-35],[-57,-38],[-65,-40],[-68,-46],[-70,-50],[-73,-45],[-75,-40],[-75,-30],[-70,-18],[-70,-15],[-75,-5],[-78,0],[-80,5],[-80,10]],
  // Europe
  [[-10,36],[-5,36],[0,38],[3,43],[5,43],[5,46],[10,45],[13,45],[15,42],[18,42],[20,40],[25,37],[28,37],[30,40],[30,42],[28,45],[25,46],[20,55],[18,55],[15,55],[10,55],[10,57],[5,58],[5,60],[10,63],[15,65],[20,68],[25,70],[30,70],[35,68],[40,67],[40,62],[30,60],[27,58],[22,55],[20,55],[25,46],[30,42],[30,40],[25,37],[22,37],[20,40],[18,42],[15,42],[13,45],[10,45],[5,46],[5,43],[3,43],[0,38],[-5,36],[-10,36]],
  // Africa
  [[-15,30],[-17,15],[-15,10],[-10,5],[5,5],[10,5],[10,0],[30,-5],[35,-10],[40,-15],[35,-25],[30,-30],[28,-33],[20,-35],[18,-34],[15,-30],[12,-20],[10,-10],[10,0],[10,5],[15,10],[20,15],[25,20],[30,30],[33,32],[35,35],[30,37],[10,37],[5,36],[0,36],[-5,34],[-5,30],[-15,30]],
  // Asia (simplified)
  [[30,42],[35,42],[40,42],[45,40],[50,38],[55,37],[60,35],[65,25],[70,22],[75,15],[80,10],[85,15],[90,22],[95,15],[100,5],[105,0],[105,15],[110,20],[115,22],[120,25],[122,30],[125,35],[130,35],[130,42],[135,45],[140,42],[145,45],[150,55],[155,60],[160,62],[165,65],[170,65],[175,65],[180,65],[180,70],[170,70],[160,68],[150,60],[145,55],[140,50],[135,52],[130,55],[120,55],[110,55],[100,55],[90,50],[80,50],[70,55],[60,55],[50,52],[40,47],[30,42]],
  // Australia
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
  if (cosC < 0) return [0, 0, false]; // behind globe
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
  const currentMode = useModeStore((s) => s.current);
  const accent = MODE_ACCENTS[currentMode];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 4;

    const { lat: cLat, lon: cLon } = useMapStore.getState();
    const { flights } = useDataStore.getState();

    ctx.clearRect(0, 0, W, H);

    // Globe background
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 5, 15, 0.9)";
    ctx.fill();
    ctx.strokeStyle = `${accent}40`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lat/lon grid lines
    ctx.strokeStyle = `${accent}18`;
    ctx.lineWidth = 0.5;
    // Latitude lines every 30°
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let firstVisible = true;
      for (let lon = -180; lon <= 180; lon += 5) {
        const [px, py, vis] = projectOrtho(lon, lat, cLon, cLat, R, cx, cy);
        if (!vis) { firstVisible = true; continue; }
        if (firstVisible) { ctx.moveTo(px, py); firstVisible = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // Longitude lines every 30°
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let firstVisible = true;
      for (let lat = -90; lat <= 90; lat += 5) {
        const [px, py, vis] = projectOrtho(lon, lat, cLon, cLat, R, cx, cy);
        if (!vis) { firstVisible = true; continue; }
        if (firstVisible) { ctx.moveTo(px, py); firstVisible = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Coastlines
    ctx.strokeStyle = `${accent}50`;
    ctx.lineWidth = 0.8;
    for (const coast of COASTLINE) {
      ctx.beginPath();
      let firstVisible = true;
      for (const [lon, lat] of coast) {
        const [px, py, vis] = projectOrtho(lon, lat, cLon, cLat, R, cx, cy);
        if (!vis) { firstVisible = true; continue; }
        if (firstVisible) { ctx.moveTo(px, py); firstVisible = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Flight dots
    for (const f of flights) {
      if (!f.lat || !f.lon) continue;
      const [px, py, vis] = projectOrtho(f.lon, f.lat, cLon, cLat, R, cx, cy);
      if (!vis) continue;
      ctx.fillStyle = "#00FFD1";
      ctx.fillRect(px - 0.8, py - 0.8, 1.6, 1.6);
    }

    // Camera position indicator
    const [cpx, cpy, cvis] = projectOrtho(cLon, cLat, cLon, cLat, R, cx, cy);
    if (cvis) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cpx, cpy, 3, 0, Math.PI * 2);
      ctx.stroke();
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(cpx - 5, cpy); ctx.lineTo(cpx + 5, cpy);
      ctx.moveTo(cpx, cpy - 5); ctx.lineTo(cpx, cpy + 5);
      ctx.strokeStyle = `${accent}60`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Equator highlight
    ctx.strokeStyle = `${accent}25`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    let eFirst = true;
    for (let lon = -180; lon <= 180; lon += 3) {
      const [px, py, vis] = projectOrtho(lon, 0, cLon, cLat, R, cx, cy);
      if (!vis) { eFirst = true; continue; }
      if (eFirst) { ctx.moveTo(px, py); eFirst = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = `${accent}60`;
    ctx.font = "6px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${cLat.toFixed(1)}°N ${Math.abs(cLon).toFixed(1)}°${cLon >= 0 ? 'E' : 'W'}`, cx, H - 3);

    // Flight count
    ctx.fillStyle = "#00FFD190";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${flights.length} AC`, 3, 8);

    animRef.current = requestAnimationFrame(draw);
  }, [accent]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div
      className="fixed bottom-[62px] right-3 z-20"
      style={{
        border: `1px solid ${accent}30`,
        backgroundColor: "rgba(0,5,15,0.85)",
        borderRadius: "4px",
        boxShadow: `0 0 12px ${accent}10`,
      }}
    >
      <div className="flex items-center justify-between px-2 py-[2px]" style={{ borderBottom: `1px solid ${accent}15` }}>
        <span className="text-[5px] font-bold tracking-[1px]" style={{ color: `${accent}80` }}>
          GLOBAL OVERVIEW
        </span>
        <span className="text-[5px] tabular-nums" style={{ color: "var(--text-dim)" }}>
          LIVE
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        style={{ width: 160, height: 160, display: "block" }}
      />
    </div>
  );
}
