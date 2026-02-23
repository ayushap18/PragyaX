import { create } from 'zustand';
import type { Aircraft, Earthquake, SatelliteTLE, AQIStation } from '@/types';

interface DataState {
  flights: Aircraft[];
  earthquakes: Earthquake[];
  satelliteTLEs: SatelliteTLE[];
  aqiStations: AQIStation[];
  lastFlightFetch: number;
  lastEarthquakeFetch: number;
  lastSatelliteFetch: number;
  lastAQIFetch: number;
  setFlights: (flights: Aircraft[]) => void;
  setEarthquakes: (earthquakes: Earthquake[]) => void;
  setSatelliteTLEs: (tles: SatelliteTLE[]) => void;
  setAQIStations: (stations: AQIStation[]) => void;
}

export const useDataStore = create<DataState>((set) => ({
  flights: [],
  earthquakes: [],
  satelliteTLEs: [],
  aqiStations: [],
  lastFlightFetch: 0,
  lastEarthquakeFetch: 0,
  lastSatelliteFetch: 0,
  lastAQIFetch: 0,
  setFlights: (flights) =>
    set({ flights, lastFlightFetch: Date.now() }),
  setEarthquakes: (earthquakes) =>
    set({ earthquakes, lastEarthquakeFetch: Date.now() }),
  setSatelliteTLEs: (satelliteTLEs) =>
    set({ satelliteTLEs, lastSatelliteFetch: Date.now() }),
  setAQIStations: (aqiStations) =>
    set({ aqiStations, lastAQIFetch: Date.now() }),
}));
