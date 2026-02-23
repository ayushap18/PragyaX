import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';

const checkRate = rateLimit('india-aqi', { maxRequests: 10, windowMs: 60_000 });

interface RawAQIRecord {
  id: string;
  country: string;
  state: string;
  city: string;
  station: string;
  last_update: string;
  pollutant_id: string;
  pollutant_min: string;
  pollutant_max: string;
  pollutant_avg: string;
  pollutant_unit: string;
}

interface AQIStation {
  id: string;
  stationName: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  nh3: number | null;
  lastUpdated: string;
}

// Approximate city coordinates for major Indian cities
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'Delhi': { lat: 28.6139, lon: 77.2090 },
  'New Delhi': { lat: 28.6139, lon: 77.2090 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Bengaluru': { lat: 12.9716, lon: 77.5946 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Jaipur': { lat: 26.9124, lon: 75.7873 },
  'Lucknow': { lat: 26.8467, lon: 80.9462 },
  'Kanpur': { lat: 26.4499, lon: 80.3319 },
  'Nagpur': { lat: 21.1458, lon: 79.0882 },
  'Visakhapatnam': { lat: 17.6868, lon: 83.2185 },
  'Bhopal': { lat: 23.2599, lon: 77.4126 },
  'Patna': { lat: 25.6093, lon: 85.1376 },
  'Vadodara': { lat: 22.3072, lon: 73.1812 },
  'Ghaziabad': { lat: 28.6692, lon: 77.4538 },
  'Ludhiana': { lat: 30.9010, lon: 75.8573 },
  'Agra': { lat: 27.1767, lon: 78.0081 },
  'Nashik': { lat: 19.9975, lon: 73.7898 },
  'Varanasi': { lat: 25.3176, lon: 82.9739 },
  'Chandigarh': { lat: 30.7333, lon: 76.7794 },
  'Indore': { lat: 22.7196, lon: 75.8577 },
  'Thane': { lat: 19.2183, lon: 72.9781 },
  'Coimbatore': { lat: 11.0168, lon: 76.9558 },
  'Guwahati': { lat: 26.1445, lon: 91.7362 },
  'Noida': { lat: 28.5355, lon: 77.3910 },
  'Gurugram': { lat: 28.4595, lon: 77.0266 },
  'Faridabad': { lat: 28.4089, lon: 77.3178 },
  'Jodhpur': { lat: 26.2389, lon: 73.0243 },
  'Raipur': { lat: 21.2514, lon: 81.6296 },
  'Kochi': { lat: 9.9312, lon: 76.2673 },
  'Dehradun': { lat: 30.3165, lon: 78.0322 },
  'Amritsar': { lat: 31.6340, lon: 74.8723 },
  'Ranchi': { lat: 23.3441, lon: 85.3096 },
  'Thiruvananthapuram': { lat: 8.5241, lon: 76.9366 },
  'Surat': { lat: 21.1702, lon: 72.8311 },
  'Rajkot': { lat: 22.3039, lon: 70.8022 },
  'Vijayawada': { lat: 16.5062, lon: 80.6480 },
  'Mysuru': { lat: 12.2958, lon: 76.6394 },
  'Muzaffarpur': { lat: 26.1225, lon: 85.3906 },
  'Howrah': { lat: 22.5958, lon: 88.2636 },
  'Gaya': { lat: 24.7914, lon: 85.0002 },
  'Jalandhar': { lat: 31.3260, lon: 75.5762 },
  'Patiala': { lat: 30.3398, lon: 76.3869 },
  'Ernakulam': { lat: 9.9816, lon: 76.2999 },
  'Hapur': { lat: 28.7307, lon: 77.7756 },
  'Talcher': { lat: 20.9517, lon: 85.2183 },
  'Bagalkot': { lat: 16.1691, lon: 75.6615 },
};

// Add small random offset so overlapping stations don't stack exactly
function getCityCoords(city: string): { lat: number; lon: number } | null {
  // Try exact match first
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  // Try case-insensitive
  const key = Object.keys(CITY_COORDS).find(
    (k) => k.toLowerCase() === city.toLowerCase()
  );
  if (key) return CITY_COORDS[key];
  return null;
}

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const cacheKey = 'india-aqi-stations';
  const cached = cache.get<{ stations: AQIStation[] }>(cacheKey);
  if (cached) {
    return NextResponse.json({
      count: cached.stations.length,
      stations: cached.stations,
      cached: true,
      source: 'data.gov.in',
    });
  }

  try {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (!apiKey) {
      return errorResponse('DATA_GOV_IN_API_KEY not configured', 'CONFIG_ERROR', 500);
    }

    const url = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${apiKey}&format=json&limit=500`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });

    if (!res.ok) {
      throw new Error(`data.gov.in responded ${res.status}`);
    }

    const data = await res.json();
    const records: RawAQIRecord[] = data.records || [];

    // Group by station to combine pollutants
    const stationMap = new Map<string, AQIStation>();
    let stationIdx = 0;

    for (const rec of records) {
      const stationKey = `${rec.city}-${rec.station}`;
      if (!stationMap.has(stationKey)) {
        const coords = getCityCoords(rec.city);
        if (!coords) continue; // skip unknown cities

        // Add slight offset per station so they don't overlap
        const offset = stationIdx * 0.005;
        stationIdx++;

        stationMap.set(stationKey, {
          id: stationKey.replace(/\s+/g, '-').toLowerCase(),
          stationName: rec.station,
          city: rec.city,
          state: rec.state,
          lat: coords.lat + (offset % 0.05),
          lon: coords.lon + ((offset * 1.3) % 0.05),
          aqi: 0,
          pm25: null,
          pm10: null,
          no2: null,
          so2: null,
          co: null,
          o3: null,
          nh3: null,
          lastUpdated: rec.last_update,
        });
      }

      const station = stationMap.get(stationKey)!;
      const avg = parseFloat(rec.pollutant_avg) || 0;
      const pid = rec.pollutant_id?.toUpperCase();

      if (pid === 'PM2.5') station.pm25 = avg;
      else if (pid === 'PM10') station.pm10 = avg;
      else if (pid === 'NO2') station.no2 = avg;
      else if (pid === 'SO2') station.so2 = avg;
      else if (pid === 'CO') station.co = avg;
      else if (pid === 'OZONE' || pid === 'O3') station.o3 = avg;
      else if (pid === 'NH3') station.nh3 = avg;
    }

    // Calculate simple AQI (dominant pollutant approach)
    for (const station of stationMap.values()) {
      const values = [
        station.pm25 ? station.pm25 * 1.5 : 0,
        station.pm10 ?? 0,
        station.no2 ? station.no2 * 0.8 : 0,
        station.so2 ? station.so2 * 0.6 : 0,
        station.co ? station.co * 0.3 : 0,
        station.o3 ? station.o3 * 0.7 : 0,
      ];
      station.aqi = Math.round(Math.max(...values, 50));
    }

    const stations = Array.from(stationMap.values());

    // Cache for 30 minutes (data updates hourly)
    cache.set(cacheKey, { stations }, 30 * 60 * 1000);

    return NextResponse.json({
      count: stations.length,
      stations,
      cached: false,
      source: 'data.gov.in',
    });
  } catch {
    // Return mock data as fallback
    const mockStations = generateMockAQI();
    return NextResponse.json({
      count: mockStations.length,
      stations: mockStations,
      cached: false,
      source: 'mock-fallback',
    });
  }
}

function generateMockAQI(): AQIStation[] {
  const cities = [
    { city: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090, aqi: 287 },
    { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, aqi: 134 },
    { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, aqi: 89 },
    { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, aqi: 102 },
    { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, aqi: 178 },
    { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, aqi: 112 },
    { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, aqi: 156 },
    { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, aqi: 95 },
    { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, aqi: 198 },
    { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, aqi: 245 },
    { city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, aqi: 312 },
    { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, aqi: 87 },
    { city: 'Patna', state: 'Bihar', lat: 25.6093, lon: 85.1376, aqi: 267 },
    { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, aqi: 143 },
    { city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, aqi: 76 },
    { city: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538, aqi: 298 },
    { city: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910, aqi: 276 },
    { city: 'Gurugram', state: 'Haryana', lat: 28.4595, lon: 77.0266, aqi: 264 },
    { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794, aqi: 118 },
    { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, aqi: 221 },
    { city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, aqi: 232 },
    { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, aqi: 105 },
    { city: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311, aqi: 128 },
    { city: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673, aqi: 54 },
    { city: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322, aqi: 92 },
    { city: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723, aqi: 187 },
    { city: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096, aqi: 143 },
    { city: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296, aqi: 165 },
    { city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366, aqi: 42 },
    { city: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362, aqi: 108 },
  ];

  return cities.map((c) => ({
    id: c.city.toLowerCase().replace(/\s+/g, '-'),
    stationName: `${c.city} Central`,
    city: c.city,
    state: c.state,
    lat: c.lat,
    lon: c.lon,
    aqi: c.aqi,
    pm25: Math.round(c.aqi * 0.6),
    pm10: Math.round(c.aqi * 0.9),
    no2: Math.round(c.aqi * 0.3),
    so2: Math.round(c.aqi * 0.15),
    co: Math.round(c.aqi * 0.1),
    o3: Math.round(c.aqi * 0.25),
    nh3: Math.round(c.aqi * 0.12),
    lastUpdated: new Date().toISOString(),
  }));
}
