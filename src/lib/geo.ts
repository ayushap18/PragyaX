/**
 * Point-in-polygon test using ray-casting algorithm.
 * Works with latitude/longitude coordinate pairs.
 */
export function pointInPolygon(
  point: { lat: number; lon: number },
  polygon: { lat: number; lon: number }[]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = polygon[i].lat;
    const xi = polygon[i].lon;
    const yj = polygon[j].lat;
    const xj = polygon[j].lon;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Haversine distance between two lat/lon points in kilometers.
 */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Compute the centroid of a polygon.
 */
export function polygonCentroid(
  vertices: { lat: number; lon: number }[]
): { lat: number; lon: number } {
  let latSum = 0;
  let lonSum = 0;
  for (const v of vertices) {
    latSum += v.lat;
    lonSum += v.lon;
  }
  return { lat: latSum / vertices.length, lon: lonSum / vertices.length };
}

/**
 * Bounding box check (fast pre-filter before ray-casting).
 */
export function pointInBoundingBox(
  point: { lat: number; lon: number },
  polygon: { lat: number; lon: number }[]
): boolean {
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;
  for (const v of polygon) {
    if (v.lat < minLat) minLat = v.lat;
    if (v.lat > maxLat) maxLat = v.lat;
    if (v.lon < minLon) minLon = v.lon;
    if (v.lon > maxLon) maxLon = v.lon;
  }
  return point.lat >= minLat && point.lat <= maxLat && point.lon >= minLon && point.lon <= maxLon;
}
