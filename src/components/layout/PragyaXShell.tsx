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
import IndiaBorderLayer from "@/components/layers/IndiaBorderLayer";
import StrategicNodeLayer from "@/components/layers/StrategicNodeLayer";
import ISROSatelliteLayer from "@/components/layers/ISROSatelliteLayer";
import AQILayer from "@/components/layers/AQILayer";
import DataPollingManager from "@/components/data/DataPollingManager";
import CommandModal from "@/components/panels/CommandModal";
import CCTVPanel from "@/components/panels/CCTVPanel";
import EntityDetail from "@/components/panels/EntityDetail";
import MiniGlobe from "@/components/map/MiniGlobe";
import ChanakyaLeftPanel from "@/components/chanakya/ChanakyaLeftPanel";
import ChanakyaRightPanel from "@/components/chanakya/ChanakyaRightPanel";
import ChanakyaBottomNav from "@/components/chanakya/ChanakyaBottomNav";
import ISROMissionClock from "@/components/chanakya/ISROMissionClock";
import AlertToast from "@/components/ui/AlertToast";
import ShortcutOverlay from "@/components/ui/ShortcutOverlay";
import { useChanakyaMode } from "@/hooks/useChanakyaMode";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const CesiumViewer = dynamic(
  () => import("@/components/map/CesiumViewer"),
  { ssr: false }
);

export default function PragyaXShell() {
  const [booted, setBooted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Manages auto-fly, layer toggling on mode switch
  const { isChanakya } = useChanakyaMode();

  // Global keyboard shortcuts
  useKeyboardShortcuts(booted, showShortcuts, setShowShortcuts);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Boot sequence overlay */}
      {!booted && <BootSequence onComplete={handleBootComplete} />}

      {/* Globe - z-0 (full viewport) — ALWAYS rendered */}
      <ErrorBoundary name="CesiumViewer">
        <CesiumViewer />
      </ErrorBoundary>

      {/* Edge glow + scanlines - z-2/3/4 */}
      <VisualModeFilter />

      {/* Scope vignette + crosshair + range rings - z-5 */}
      <ScopeOverlay />

      {/* Panels - z-10/20 */}
      {booted && (
        <>
          <TopHUD />
          <AlertToast />

          {/* Standard WORLDVIEW panels */}
          {!isChanakya && (
            <ErrorBoundary name="Standard Panels">
              <LeftPanel />
              <RightPanel />
              <BottomNav />
              <MiniGlobe />
            </ErrorBoundary>
          )}

          {/* Chanakya India intelligence panels */}
          {isChanakya && (
            <ErrorBoundary name="Chanakya Panels">
              <ChanakyaLeftPanel />
              <ChanakyaRightPanel />
              <ChanakyaBottomNav />
              <ISROMissionClock />
            </ErrorBoundary>
          )}

          {/* Headless data layers — always active */}
          <ErrorBoundary name="Data Layers">
            <FlightLayer />
            <EarthquakeLayer />
            <SatelliteLayer />
            <WeatherLayer />
            <CCTVLayer />
            <TrafficLayer />
            <GraticuleLayer />

            {/* India-specific layers — active when enabled */}
            <IndiaBorderLayer />
            <StrategicNodeLayer />
            <ISROSatelliteLayer />
            <AQILayer />
          </ErrorBoundary>

          <ErrorBoundary name="Data Polling">
            <DataPollingManager />
          </ErrorBoundary>
          <CommandModal />
          <CCTVPanel />
          <EntityDetail />

          {/* Shortcut overlay */}
          {showShortcuts && <ShortcutOverlay onClose={() => setShowShortcuts(false)} />}
        </>
      )}
    </div>
  );
}
