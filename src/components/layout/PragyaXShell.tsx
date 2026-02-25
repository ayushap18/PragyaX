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
import SatelliteGroundTrack from "@/components/layers/SatelliteGroundTrack";
import WeatherLayer from "@/components/layers/WeatherLayer";
import CCTVLayer from "@/components/layers/CCTVLayer";
import TrafficLayer from "@/components/layers/TrafficLayer";
import GraticuleLayer from "@/components/layers/GraticuleLayer";
import IndiaBorderLayer from "@/components/layers/IndiaBorderLayer";
import StrategicNodeLayer from "@/components/layers/StrategicNodeLayer";
import ISROSatelliteLayer from "@/components/layers/ISROSatelliteLayer";
import AQILayer from "@/components/layers/AQILayer";
import DayNightTerminator from "@/components/layers/DayNightTerminator";
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
import ModeTransition from "@/components/ui/ModeTransition";
import ReticleOverlay from "@/components/ui/ReticleOverlay";
import TimelineScrubber from "@/components/ui/TimelineScrubber";
import SpectrumAnalyzer from "@/components/panels/SpectrumAnalyzer";
import AnomalyPanel from "@/components/panels/AnomalyPanel";
import GeofencePanel from "@/components/panels/GeofencePanel";
import MissionPlanner from "@/components/panels/MissionPlanner";
import SurveillanceGrid from "@/components/panels/SurveillanceGrid";
import SecureMessageConsole from "@/components/panels/SecureMessageConsole";
import { useChanakyaMode } from "@/hooks/useChanakyaMode";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useGeofenceEngine } from "@/hooks/useGeofenceEngine";
import { useAnomalyEngine } from "@/hooks/useAnomalyEngine";
import { useVesselPolling } from "@/hooks/useVesselPolling";
import { useRealtimeLocation } from "@/hooks/useRealtimeLocation";

const CesiumViewer = dynamic(
  () => import("@/components/map/CesiumViewer"),
  { ssr: false }
);

export default function PragyaXShell() {
  const [booted, setBooted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [showGeofences, setShowGeofences] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showSurveillanceGrid, setShowSurveillanceGrid] = useState(false);
  const [showComms, setShowComms] = useState(false);
  // Manages auto-fly, layer toggling on mode switch
  const { isChanakya } = useChanakyaMode();

  // Exclusive feature engines — always active when booted
  useGeofenceEngine();
  useAnomalyEngine();
  useVesselPolling();

  // Realtime GPS location tracking
  const { gps, toggle: toggleGPS } = useRealtimeLocation();

  // Global keyboard shortcuts (after toggleGPS is available)
  useKeyboardShortcuts(booted, showShortcuts, setShowShortcuts, toggleGPS);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  // Panel toggle handlers — close other panels when opening one
  const openPanel = useCallback((panel: string) => {
    setShowSpectrum(panel === 'spectrum');
    setShowAnomalies(panel === 'anomalies');
    setShowGeofences(panel === 'geofences');
    setShowMissions(panel === 'missions');
    setShowSurveillanceGrid(panel === 'grid');
    setShowComms(panel === 'comms');
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Boot sequence overlay */}
      {!booted && <BootSequence onComplete={handleBootComplete} />}

      {/* Globe - z-0 (full viewport) — ALWAYS rendered */}
      <CesiumViewer />

      {/* Edge glow + scanlines - z-2/3/4 */}
      <VisualModeFilter />

      {/* Scope vignette + crosshair + range rings - z-5 */}
      <ScopeOverlay />

      {/* Mode transition cinematic overlay - z-60 */}
      <ModeTransition />

      {/* Heads-up reticle overlay - z-6 */}
      <ReticleOverlay />

      {/* Panels - z-10/20 */}
      {booted && (
        <>
          <TopHUD />
          <AlertToast />

          {/* Standard WORLDVIEW panels */}
          {!isChanakya && (
            <>
              <LeftPanel
                onOpenSpectrum={() => openPanel('spectrum')}
                onOpenAnomalies={() => openPanel('anomalies')}
                onOpenGeofences={() => openPanel('geofences')}
                onOpenMissions={() => openPanel('missions')}
                onOpenSurveillanceGrid={() => openPanel('grid')}
                onOpenComms={() => openPanel('comms')}
                onToggleGPS={toggleGPS}
                gpsActive={gps.active}
                gpsAccuracy={gps.accuracy}
              />
              <RightPanel />
              <BottomNav />
              <MiniGlobe />
              {/* Timeline scrubber — above bottom nav */}
              <div className="fixed bottom-14 left-0 right-0 z-20">
                <TimelineScrubber />
              </div>
            </>
          )}

          {/* Chanakya India intelligence panels */}
          {isChanakya && (
            <>
              <ChanakyaLeftPanel />
              <ChanakyaRightPanel />
              <ChanakyaBottomNav />
              <ISROMissionClock />
            </>
          )}

          {/* Headless data layers — always active */}
          <FlightLayer />
          <EarthquakeLayer />
          <SatelliteLayer />
          <SatelliteGroundTrack />
          <WeatherLayer />
          <CCTVLayer />
          <TrafficLayer />
          <GraticuleLayer />

          {/* India-specific layers — active when enabled */}
          <IndiaBorderLayer />
          <StrategicNodeLayer />
          <ISROSatelliteLayer />
          <AQILayer />
          <DayNightTerminator />

          <DataPollingManager />
          <CommandModal />
          <CCTVPanel />
          <EntityDetail />

          {/* Exclusive feature panels */}
          {showSpectrum && <SpectrumAnalyzer onClose={() => setShowSpectrum(false)} />}
          {showAnomalies && <AnomalyPanel onClose={() => setShowAnomalies(false)} />}
          {showGeofences && <GeofencePanel onClose={() => setShowGeofences(false)} />}
          {showMissions && <MissionPlanner onClose={() => setShowMissions(false)} />}
          {showSurveillanceGrid && <SurveillanceGrid onClose={() => setShowSurveillanceGrid(false)} />}
          {showComms && <SecureMessageConsole onClose={() => setShowComms(false)} />}

          {/* Shortcut overlay */}
          {showShortcuts && <ShortcutOverlay onClose={() => setShowShortcuts(false)} />}
        </>
      )}
    </div>
  );
}
