"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import TopHUD from "./TopHUD";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import BottomNav from "./BottomNav";
import BootSequence from "./BootSequence";
import ScopeOverlay from "@/components/map/ScopeOverlay";
import VisualModeFilter from "@/components/map/VisualModeFilter";
import FlightLayer from "@/components/layers/FlightLayer";
import EarthquakeLayer from "@/components/layers/EarthquakeLayer";
import SatelliteLayer from "@/components/layers/SatelliteLayer";
import WeatherLayer from "@/components/layers/WeatherLayer";
import CCTVLayer from "@/components/layers/CCTVLayer";
import TrafficLayer from "@/components/layers/TrafficLayer";
import GraticuleLayer from "@/components/layers/GraticuleLayer";
import DataPollingManager from "@/components/data/DataPollingManager";
import CommandModal from "@/components/panels/CommandModal";
import CCTVPanel from "@/components/panels/CCTVPanel";
import EntityDetail from "@/components/panels/EntityDetail";
import MiniGlobe from "@/components/map/MiniGlobe";

const CesiumViewer = dynamic(
  () => import("@/components/map/CesiumViewer"),
  { ssr: false }
);

export default function PragyaXShell() {
  const [booted, setBooted] = useState(false);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Boot sequence overlay */}
      {!booted && <BootSequence onComplete={handleBootComplete} />}

      {/* Globe - z-0 (full viewport) */}
      <CesiumViewer />

      {/* Edge glow + scanlines - z-2/3/4 */}
      <VisualModeFilter />

      {/* Scope vignette + crosshair + range rings - z-5 */}
      <ScopeOverlay />

      {/* Panels - z-10/20 */}
      {booted && (
        <>
          <TopHUD />
          <LeftPanel />
          <RightPanel />
          <BottomNav />
          {/* Headless data layers */}
          <FlightLayer />
          <EarthquakeLayer />
          <SatelliteLayer />
          <WeatherLayer />
          <CCTVLayer />
          <TrafficLayer />
          <GraticuleLayer />
          <DataPollingManager />
          <CommandModal />
          <CCTVPanel />
          <EntityDetail />
          <MiniGlobe />
        </>
      )}
    </div>
  );
}
