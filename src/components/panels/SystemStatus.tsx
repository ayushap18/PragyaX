"use client";

import { useHUDStore } from "@/stores/hudStore";
import { useCesiumStore } from "@/stores/cesiumStore";
import { useDataStore } from "@/stores/dataStore";
import { X } from "lucide-react";

export default function SystemStatus() {
  const { fps, cpu, mem, signalStrength, latency, feedQuality, toggleSystemStatus } = useHUDStore();
  const viewer = useCesiumStore((s) => s.viewer);
  const flights = useDataStore((s) => s.flights);
  const earthquakes = useDataStore((s) => s.earthquakes);
  const satellites = useDataStore((s) => s.satelliteTLEs);

  // System Health Calculation
  const healthScore = Math.round(
    (signalStrength + feedQuality + (fps > 30 ? 100 : 50)) / 3
  );

  const getStatusColor = (val: number, type: 'high' | 'low' = 'high') => {
    if (type === 'high') return val > 80 ? "text-[#00FF41]" : val > 50 ? "text-[#FFA500]" : "text-[#FF3333]";
    return val < 50 ? "text-[#00FF41]" : val < 80 ? "text-[#FFA500]" : "text-[#FF3333]";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[500px] border border-[#00FFD1]/30 bg-[#0a0a0a]/90 p-4 shadow-[0_0_30px_rgba(0,255,209,0.1)] backdrop-blur-md">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#00FFD1]/20 pb-2 mb-4">
          <h2 className="text-sm font-bold tracking-widest text-[#00FFD1]">SYSTEM DIAGNOSTICS</h2>
          <button onClick={toggleSystemStatus} className="text-[#00FFD1] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-1 p-2 bg-[#00FFD1]/5 border-l-2 border-[#00FFD1]">
             <span className="text-[9px] tracking-wider text-[#00FFD1]/60">SYSTEM HEALTH</span>
             <span className={`text-2xl font-bold tabular-nums ${getStatusColor(healthScore)}`}>{healthScore}%</span>
          </div>
          <div className="flex flex-col gap-1 p-2 bg-[#00FFD1]/5 border-l-2 border-[#00FFD1]">
             <span className="text-[9px] tracking-wider text-[#00FFD1]/60">GRAPHICS ENGINE</span>
             <div className="flex items-baseline gap-2">
               <span className={`text-2xl font-bold tabular-nums ${getStatusColor(fps)}`}>{fps}</span>
               <span className="text-[10px] text-[#00FFD1]/60">FPS</span>
             </div>
          </div>
        </div>

        {/* Subsystems Table */}
        <div className="space-y-2 mb-6">
           <h3 className="text-[10px] font-bold tracking-wider text-[#00FFD1]/80 mb-2">SUBSYSTEM STATUS</h3>

           <div className="grid grid-cols-3 gap-y-2 text-[10px] font-mono">
             <div className="text-[#00FFD1]/60">CESIUM CONTEXT</div>
             <div className="col-span-2 text-right">
                {viewer ? <span className="text-[#00FF41]">ACTIVE</span> : <span className="text-[#FF3333]">OFFLINE</span>}
             </div>

             <div className="text-[#00FFD1]/60">DATA FEED: AIR</div>
             <div className="col-span-2 text-right">
                {flights.length > 0 ? <span className="text-[#00FF41]">{flights.length} UNITS TRACKED</span> : <span className="text-[#FFA500]">SEARCHING...</span>}
             </div>

             <div className="text-[#00FFD1]/60">DATA FEED: ORBIT</div>
             <div className="col-span-2 text-right">
                {satellites.length > 0 ? <span className="text-[#00FF41]">{satellites.length} UNITS TRACKED</span> : <span className="text-[#FFA500]">SEARCHING...</span>}
             </div>

             <div className="text-[#00FFD1]/60">DATA FEED: SEISMIC</div>
             <div className="col-span-2 text-right">
                {earthquakes.length > 0 ? <span className="text-[#00FF41]">{earthquakes.length} EVENTS LOGGED</span> : <span className="text-[#FFA500]">WAITING...</span>}
             </div>

             <div className="text-[#00FFD1]/60">UPLINK LATENCY</div>
             <div className="col-span-2 text-right tabular-nums text-[#00FFD1]">
                {latency}ms
             </div>

             <div className="text-[#00FFD1]/60">CPU LOAD</div>
             <div className="col-span-2 text-right tabular-nums">
                <span className={getStatusColor(cpu, 'low')}>{cpu}%</span>
             </div>

             <div className="text-[#00FFD1]/60">MEMORY USAGE</div>
             <div className="col-span-2 text-right tabular-nums">
                <span className={getStatusColor(mem, 'low')}>{mem}%</span>
             </div>
           </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#00FFD1]/20 flex justify-between items-center">
            <span className="text-[8px] tracking-widest text-[#00FFD1]/40">PRAGYAX INTELLIGENCE SUITE v4.2.1</span>
            <span className="text-[8px] tracking-widest text-[#00FF41] animate-pulse">ALL SYSTEMS OPERATIONAL</span>
        </div>

      </div>
    </div>
  );
}
