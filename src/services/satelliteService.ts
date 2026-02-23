import type { SatelliteResponse, SatellitePosition } from '@/types';

export async function fetchSatelliteTLEs(
  group: string = 'stations'
): Promise<SatelliteResponse> {
  const res = await fetch(`/api/satellites?group=${group}`, {
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`Satellite fetch failed: ${res.status}`);
  return res.json();
}

export async function computeSatellitePosition(
  tleLine1: string,
  tleLine2: string,
  date: Date
): Promise<SatellitePosition | null> {
  // Dynamic import to avoid SSR issues (satellite.js uses ArrayBuffer)
  const satellite = await import('satellite.js');

  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const posVel = satellite.propagate(satrec, date);

    if (
      !posVel ||
      !posVel.position ||
      typeof posVel.position === 'boolean'
    ) {
      return null;
    }

    const gmst = satellite.gstime(date);
    const geodetic = satellite.eciToGeodetic(
      posVel.position as { x: number; y: number; z: number },
      gmst
    );

    const lat = satellite.degreesLat(geodetic.latitude);
    const lon = satellite.degreesLong(geodetic.longitude);

    let velocityKms = 0;
    if (posVel.velocity && typeof posVel.velocity !== 'boolean') {
      const v = posVel.velocity as { x: number; y: number; z: number };
      velocityKms = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    }

    return {
      lat,
      lon,
      altitudeKm: geodetic.height,
      velocityKms,
    };
  } catch {
    return null;
  }
}
