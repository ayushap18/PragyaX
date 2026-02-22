import type { FlightResponse } from '@/types';

export async function fetchFlights(bbox?: {
  lamin: number;
  lamax: number;
  lomin: number;
  lomax: number;
}): Promise<FlightResponse> {
  const params = new URLSearchParams();
  if (bbox) {
    params.set('lamin', String(bbox.lamin));
    params.set('lamax', String(bbox.lamax));
    params.set('lomin', String(bbox.lomin));
    params.set('lomax', String(bbox.lomax));
  }
  const url = `/api/flights${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Flight fetch failed: ${res.status}`);
  return res.json();
}
