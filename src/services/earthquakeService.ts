import type { EarthquakeResponse } from '@/types';

export async function fetchEarthquakes(
  minmag: number = 2.0,
  hours: number = 24
): Promise<EarthquakeResponse> {
  const params = new URLSearchParams({
    minmag: String(minmag),
    hours: String(hours),
  });
  const res = await fetch(`/api/earthquakes?${params}`);
  if (!res.ok) throw new Error(`Earthquake fetch failed: ${res.status}`);
  return res.json();
}
