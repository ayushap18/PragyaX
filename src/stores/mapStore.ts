import { create } from 'zustand';

interface MapState {
  lat: number;
  lon: number;
  altitudeKm: number;
  heading: number;
  pitch: number;
  currentCity: string;
  flyTo: (lat: number, lon: number, altKm?: number) => void;
  setCity: (city: string) => void;
  setPosition: (lat: number, lon: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  lat: 38.8977,
  lon: -77.0365,
  altitudeKm: 5,
  heading: 0,
  pitch: -60,
  currentCity: 'Washington DC',
  flyTo: (lat, lon, altKm = 5) => set({ lat, lon, altitudeKm: altKm }),
  setCity: (city) => set({ currentCity: city }),
  setPosition: (lat, lon) => set({ lat, lon }),
}));
