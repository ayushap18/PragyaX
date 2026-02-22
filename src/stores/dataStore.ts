import { create } from 'zustand';
import type { Aircraft, Earthquake, SatelliteTLE } from '@/types';

interface DataState {
  flights: Aircraft[];
  earthquakes: Earthquake[];
  satelliteTLEs: SatelliteTLE[];
  lastFlightFetch: number;
  lastEarthquakeFetch: number;
  lastSatelliteFetch: number;
  setFlights: (flights: Aircraft[]) => void;
  setEarthquakes: (earthquakes: Earthquake[]) => void;
  setSatelliteTLEs: (tles: SatelliteTLE[]) => void;
}

export const useDataStore = create<DataState>((set) => ({
  flights: [],
  earthquakes: [],
  satelliteTLEs: [],
  lastFlightFetch: 0,
  lastEarthquakeFetch: 0,
  lastSatelliteFetch: 0,
  setFlights: (flights) =>
    set({ flights, lastFlightFetch: Date.now() }),
  setEarthquakes: (earthquakes) =>
    set({ earthquakes, lastEarthquakeFetch: Date.now() }),
  setSatelliteTLEs: (satelliteTLEs) =>
    set({ satelliteTLEs, lastSatelliteFetch: Date.now() }),
}));
