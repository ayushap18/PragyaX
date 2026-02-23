"use client";

import { useState, useEffect } from "react";
import { useMapStore } from "@/stores/mapStore";
import { useModeStore } from "@/stores/modeStore";
import { useCesiumStore } from "@/stores/cesiumStore";
import { useLayerStore } from "@/stores/layerStore";
import { INDIAN_CITIES, CHANAKYA_COLORS, ARTHASHASTRA_QUOTES } from "@/constants/chanakya";
import { MODE_ACCENTS } from "@/constants/modes";
import { SFX } from "@/utils/audioEngine";
import type { Landmark, LayerName, VisualMode } from "@/types";

const saffron = CHANAKYA_COLORS.saffron;

export default function ChanakyaBottomNav() {
  const currentCity = useMapStore((s) => s.currentCity);
  const flyTo = useMapStore((s) => s.flyTo);
  const setCity = useMapStore((s) => s.setCity);
  const deactivateChanakya = useModeStore((s) => s.deactivateChanakya);
  const currentMode = useModeStore((s) => s.current);
  const setMode = useModeStore((s) => s.setMode);
  const layers = useLayerStore((s) => s.layers);
  const toggleLayer = useLayerStore((s) => s.toggleLayer);
  const [activeLandmarkIdx, setActiveLandmarkIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const activeCity = INDIAN_CITIES.find((c) => c.name === currentCity) || INDIAN_CITIES[0];
  const landmarks: Landmark[] = activeCity.landmarks;

  // Quote ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((p) => (p + 1) % ARTHASHASTRA_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCityClick = (city: typeof INDIAN_CITIES[number]) => {
    SFX.flyTo();
    setCity(city.name);
    setActiveLandmarkIdx(0);
    flyTo(city.lat, city.lon, 5);

    // Also fly Cesium camera
    const { viewer, cesium } = useCesiumStore.getState();
    if (viewer && cesium && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: cesium.Cartesian3.fromDegrees(city.lon, city.lat, 50000),
        duration: 3,
      });
    }
  };

  const handleLandmarkClick = (landmark: Landmark, idx: number) => {
    SFX.flyTo();
    setActiveLandmarkIdx(idx);
    flyTo(landmark.lat, landmark.lon, 1.5);

    const { viewer, cesium } = useCesiumStore.getState();
    if (viewer && cesium && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: cesium.Cartesian3.fromDegrees(landmark.lon, landmark.lat, 8000),
        duration: 2,
      });
    }
  };

  const layerToggles: { id: LayerName; label: string }[] = [
    { id: 'flights', label: 'FLIGHTS' },
    { id: 'aqi', label: 'AQI' },
    { id: 'isro', label: 'ISRO' },
    { id: 'borders', label: 'BORDERS' },
    { id: 'earthquakes', label: 'SEISMIC' },
    { id: 'strategic', label: 'NODES' },
  ];

  const visualModes: { mode: VisualMode; label: string; hint: string }[] = [
    { mode: 'CHANAKYA', label: 'चाणक्य', hint: 'DEFAULT' },
    { mode: 'NORMAL', label: 'NORMAL', hint: 'CLEAN' },
    { mode: 'CRT', label: 'CRT', hint: 'RETRO' },
    { mode: 'NVG', label: 'NVG', hint: 'NIGHT' },
    { mode: 'FLIR', label: 'FLIR', hint: 'THERMAL' },
    { mode: 'DRONE', label: 'DRONE', hint: 'UAV' },
  ];

  const handleModeSwitch = (mode: VisualMode) => {
    if (mode === currentMode) return;
    SFX.modeSwitch();
    setMode(mode);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 flex flex-col"
      style={{
        backgroundColor: CHANAKYA_COLORS.panel,
        borderTop: `1px solid ${saffron}20`,
        overscrollBehavior: 'contain',
      }}
    >
      {/* Tricolor bar */}
      <div className="flex h-[3px]">
        <div className="flex-1" style={{ backgroundColor: CHANAKYA_COLORS.saffron }} />
        <div className="flex-1" style={{ backgroundColor: CHANAKYA_COLORS.white }} />
        <div className="flex-1" style={{ backgroundColor: CHANAKYA_COLORS.green }} />
      </div>

      {/* Arthashastra quote ticker */}
      <div className="flex items-center px-3 py-[2px] overflow-hidden">
        <span className="text-[5px] tracking-[1px] mr-2" style={{ color: `${saffron}40` }}>
          अर्थशास्त्र
        </span>
        <p className="text-[6px] italic truncate" style={{ color: `${saffron}40` }}>
          {ARTHASHASTRA_QUOTES[quoteIdx]}
        </p>
      </div>

      {/* Row 1: Landmark breadcrumbs */}
      <div className="flex items-center gap-2 px-3 py-[3px]">
        <span className="text-[6px] tracking-[2px]" style={{ color: `${saffron}40` }}>
          स्थान
        </span>
        {landmarks.map((landmark, i) => (
          <button
            key={landmark.name}
            onClick={() => handleLandmarkClick(landmark, i)}
            className="rounded-sm px-2 py-[2px] text-[7px] transition-colors cursor-pointer hover:brightness-125"
            style={{
              backgroundColor: i === activeLandmarkIdx ? saffron : "transparent",
              color: i === activeLandmarkIdx ? "#000" : `${saffron}50`,
              border: i === activeLandmarkIdx ? "none" : `1px solid ${saffron}20`,
              fontWeight: i === activeLandmarkIdx ? 700 : 400,
            }}
          >
            {landmark.name}
          </button>
        ))}
      </div>

      {/* Row 2: City tabs */}
      <div className="flex items-center gap-1 px-2 overflow-x-auto scrollbar-hide">
        {INDIAN_CITIES.map((city) => (
          <button
            key={city.name}
            onClick={() => handleCityClick(city)}
            className="flex flex-col items-center gap-[2px] px-2 py-[2px] shrink-0 cursor-pointer"
          >
            <span
              className="text-[7px]"
              style={{
                color: city.name === currentCity ? "#FFF" : `${saffron}50`,
              }}
            >
              {city.name}
            </span>
            {city.name === currentCity && (
              <div className="h-[2px] w-full rounded-full" style={{ backgroundColor: saffron }} />
            )}
          </button>
        ))}
      </div>

      {/* Row 3: Layer toggles */}
      <div className="flex items-center px-3 py-[3px] gap-2">
        <span className="text-[5px] tracking-[1px]" style={{ color: `${saffron}30` }}>
          स्तर
        </span>
        {layerToggles.map((lt) => {
          const isOn = layers[lt.id]?.enabled;
          return (
            <button
              key={lt.id}
              onClick={() => { SFX.toggle(); toggleLayer(lt.id); }}
              className="px-2 py-[2px] rounded-sm text-[6px] cursor-pointer transition-colors"
              style={{
                backgroundColor: isOn ? `${saffron}20` : 'transparent',
                color: isOn ? saffron : `${saffron}40`,
                border: `1px solid ${isOn ? `${saffron}40` : `${saffron}15`}`,
              }}
            >
              {lt.label}
            </button>
          );
        })}
      </div>

      {/* Row 4: Visual mode selector + WORLDVIEW return */}
      <div className="flex items-center px-3 py-[3px] gap-2">
        <span className="text-[5px] tracking-[1px]" style={{ color: `${saffron}30` }}>
          दृष्टि
        </span>
        {visualModes.map((vm) => {
          const isActive = vm.mode === currentMode;
          const modeColor = MODE_ACCENTS[vm.mode];
          return (
            <button
              key={vm.mode}
              onClick={() => handleModeSwitch(vm.mode)}
              className="flex flex-col items-center gap-[1px] px-2 py-[2px] rounded-sm cursor-pointer transition-all hover:brightness-125"
              style={{
                backgroundColor: isActive ? `${modeColor}20` : 'transparent',
                border: `1px solid ${isActive ? `${modeColor}60` : `${saffron}15`}`,
              }}
            >
              <span
                className="text-[7px] font-bold tracking-wider"
                style={{ color: isActive ? modeColor : `${saffron}40` }}
              >
                {vm.label}
              </span>
              <span
                className="text-[4px] tracking-[1px]"
                style={{ color: isActive ? `${modeColor}80` : `${saffron}25` }}
              >
                {vm.hint}
              </span>
            </button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Return to WORLDVIEW */}
        <button
          onClick={() => {
            SFX.modeSwitch();
            deactivateChanakya();
          }}
          className="px-3 py-[3px] rounded-sm text-[7px] font-bold cursor-pointer transition-all hover:brightness-125"
          style={{
            backgroundColor: `${saffron}15`,
            color: saffron,
            border: `1px solid ${saffron}30`,
          }}
        >
          ← WORLDVIEW
        </button>
      </div>
    </div>
  );
}
