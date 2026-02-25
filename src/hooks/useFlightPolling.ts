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
  return flights.map((f) => {
    // Convert heading to radians for lat/lon drift
    const hdgRad = f.heading * Math.PI / 180;
    // Speed-proportional drift: faster planes cover more ground between polls
    const speedFactor = Math.max(0.3, f.velocityMs / 250);
    const driftLat = Math.cos(hdgRad) * 0.002 * speedFactor;
    const driftLon = Math.sin(hdgRad) * 0.002 * speedFactor;
    // Very gentle heading drift — no random jitter
    const headingDelta = (Math.random() - 0.5) * 0.5;
    return {
      ...f,
      lat: f.lat + driftLat,
      lon: f.lon + driftLon,
      altitudeFt: Math.max(1000, f.altitudeFt + (Math.random() - 0.5) * 40),
      altitudeM: Math.max(300, f.altitudeM + (Math.random() - 0.5) * 12),
      heading: (f.heading + headingDelta + 360) % 360,
    };
  });
}

export function useFlightPolling() {
  const enabled = useLayerStore((s) => s.layers.flights.enabled);
  const setFlights = useDataStore((s) => s.setFlights);
  const setCount = useLayerStore((s) => s.setCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driftRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockFlightsRef = useRef<Aircraft[] | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (driftRef.current) {
        clearInterval(driftRef.current);
        driftRef.current = null;
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

      // Generate mock flights on first poll
      const { lat, lon } = useMapStore.getState();
      if (!mockFlightsRef.current) {
        mockFlightsRef.current = generateMockFlights(lat, lon);
        setFlights(mockFlightsRef.current);
        setCount('flights', mockFlightsRef.current.length);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 10_000);

    // Smooth micro-drift every 2s for mock flights — makes them look like they're moving
    driftRef.current = setInterval(() => {
      if (mockFlightsRef.current) {
        mockFlightsRef.current = driftFlights(mockFlightsRef.current);
        setFlights(mockFlightsRef.current);
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (driftRef.current) {
        clearInterval(driftRef.current);
        driftRef.current = null;
      }
    };
  }, [enabled, setFlights, setCount]);
}
