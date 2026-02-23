"use client";

import { useEffect, useRef } from 'react';
import { fetchFlights } from '@/services/flightService';
import { useDataStore } from '@/stores/dataStore';
import { useLayerStore } from '@/stores/layerStore';
import { useCesiumStore } from '@/stores/cesiumStore';
import { useMapStore } from '@/stores/mapStore';
import type { Aircraft } from '@/types';

const AIRLINES = ['UAL', 'DAL', 'AAL', 'SWA', 'JBU', 'BAW', 'DLH', 'AFR', 'ANA', 'JAL', 'QFA', 'SIA', 'THY', 'RYR', 'EZY', 'KLM', 'UAE'];
const COUNTRIES = ['United States', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia', 'Turkey', 'Singapore', 'Netherlands', 'UAE'];

function generateMockFlights(centerLat: number, centerLon: number, count = 60): Aircraft[] {
  const flights: Aircraft[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 5;
    const lat = centerLat + dist * Math.cos(angle);
    const lon = centerLon + dist * Math.sin(angle);
    const altFt = 5000 + Math.random() * 40000;
    const prefix = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
    const num = Math.floor(100 + Math.random() * 9000);
    flights.push({
      icao24: `mock${i.toString(16).padStart(6, '0')}`,
      callsign: `${prefix}${num}`,
      originCountry: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
      lat,
      lon,
      altitudeM: altFt * 0.3048,
      altitudeFt: Math.round(altFt),
      velocityMs: 150 + Math.random() * 150,
      velocityKts: Math.round(290 + Math.random() * 290),
      heading: Math.random() * 360,
      verticalRateMs: (Math.random() - 0.5) * 10,
      onGround: false,
      squawk: `${Math.floor(1000 + Math.random() * 6999)}`,
    });
  }
  return flights;
}

function driftFlights(flights: Aircraft[]): Aircraft[] {
  return flights.map((f) => ({
    ...f,
    lat: f.lat + Math.cos(f.heading * Math.PI / 180) * 0.002 + (Math.random() - 0.5) * 0.001,
    lon: f.lon + Math.sin(f.heading * Math.PI / 180) * 0.002 + (Math.random() - 0.5) * 0.001,
    altitudeFt: Math.max(1000, f.altitudeFt + (Math.random() - 0.5) * 200),
    altitudeM: Math.max(300, f.altitudeM + (Math.random() - 0.5) * 60),
    heading: (f.heading + (Math.random() - 0.5) * 3 + 360) % 360,
  }));
}

export function useFlightPolling() {
  const enabled = useLayerStore((s) => s.layers.flights.enabled);
  const setFlights = useDataStore((s) => s.setFlights);
  const setCount = useLayerStore((s) => s.setCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockFlightsRef = useRef<Aircraft[] | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    async function poll() {
      try {
        const viewer = useCesiumStore.getState().viewer;
        const cesium = useCesiumStore.getState().cesium;

        let bbox: { lamin: number; lamax: number; lomin: number; lomax: number } | undefined;

        if (viewer && cesium && !viewer.isDestroyed()) {
          try {
            const rect = viewer.camera.computeViewRectangle();
            if (rect) {
              bbox = {
                lamin: cesium.Math.toDegrees(rect.south),
                lamax: cesium.Math.toDegrees(rect.north),
                lomin: cesium.Math.toDegrees(rect.west),
                lomax: cesium.Math.toDegrees(rect.east),
              };
            }
          } catch {
            // Use global if camera rectangle fails
          }
        }

        const data = await fetchFlights(bbox);
        if (data.aircraft.length > 0) {
          setFlights(data.aircraft);
          setCount('flights', data.count);
          mockFlightsRef.current = null;
          return;
        }
      } catch {
        // API failed, fall through to mock data
      }

      // Generate or drift mock flights
      const { lat, lon } = useMapStore.getState();
      if (!mockFlightsRef.current) {
        mockFlightsRef.current = generateMockFlights(lat, lon);
      } else {
        mockFlightsRef.current = driftFlights(mockFlightsRef.current);
      }
      setFlights(mockFlightsRef.current);
      setCount('flights', mockFlightsRef.current.length);
    }

    poll();
    intervalRef.current = setInterval(poll, 10_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, setFlights, setCount]);
}
