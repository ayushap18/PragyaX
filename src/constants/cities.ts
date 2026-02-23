import type { City } from '@/types';

export const CITIES: City[] = [
  {
    name: 'Washington DC',
    lat: 38.8977,
    lon: -77.0365,
    landmarks: [
      { name: 'US Capitol', lat: 38.8899, lon: -77.0091 },
      { name: 'Washington Monument', lat: 38.8895, lon: -77.0353 },
      { name: 'Lincoln Memorial', lat: 38.8893, lon: -77.0502 },
      { name: 'Pentagon', lat: 38.8719, lon: -77.0563 },
      { name: 'Jefferson Memorial', lat: 38.8814, lon: -77.0365 },
    ],
  },
  {
    name: 'Austin',
    lat: 30.2672,
    lon: -97.7431,
    landmarks: [
      { name: 'Texas State Capitol', lat: 30.2747, lon: -97.7404 },
      { name: 'UT Tower', lat: 30.2862, lon: -97.7394 },
      { name: 'Barton Springs', lat: 30.2640, lon: -97.7713 },
      { name: 'Congress Ave Bridge', lat: 30.2613, lon: -97.7450 },
      { name: 'Zilker Park', lat: 30.2670, lon: -97.7731 },
    ],
  },
  {
    name: 'San Francisco',
    lat: 37.7749,
    lon: -122.4194,
    landmarks: [
      { name: 'Golden Gate Bridge', lat: 37.8199, lon: -122.4783 },
      { name: 'Alcatraz', lat: 37.8267, lon: -122.4230 },
      { name: 'Fishermans Wharf', lat: 37.8080, lon: -122.4177 },
      { name: 'Coit Tower', lat: 37.8024, lon: -122.4058 },
      { name: 'Twin Peaks', lat: 37.7544, lon: -122.4477 },
    ],
  },
  {
    name: 'New York',
    lat: 40.7128,
    lon: -74.006,
    landmarks: [
      { name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445 },
      { name: 'Times Square', lat: 40.7580, lon: -73.9855 },
      { name: 'Central Park', lat: 40.7829, lon: -73.9654 },
      { name: 'Empire State', lat: 40.7484, lon: -73.9857 },
      { name: 'Brooklyn Bridge', lat: 40.7061, lon: -73.9969 },
    ],
  },
  {
    name: 'Tokyo',
    lat: 35.6762,
    lon: 139.6503,
    landmarks: [
      { name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454 },
      { name: 'Shibuya Crossing', lat: 35.6595, lon: 139.7004 },
      { name: 'Imperial Palace', lat: 35.6852, lon: 139.7528 },
      { name: 'Sensoji Temple', lat: 35.7148, lon: 139.7967 },
      { name: 'Skytree', lat: 35.7101, lon: 139.8107 },
    ],
  },
  {
    name: 'London',
    lat: 51.5074,
    lon: -0.1278,
    landmarks: [
      { name: 'Big Ben', lat: 51.5007, lon: -0.1246 },
      { name: 'Tower Bridge', lat: 51.5055, lon: -0.0754 },
      { name: 'Buckingham Palace', lat: 51.5014, lon: -0.1419 },
      { name: 'London Eye', lat: 51.5033, lon: -0.1195 },
      { name: 'Tower of London', lat: 51.5081, lon: -0.0759 },
    ],
  },
  {
    name: 'Paris',
    lat: 48.8566,
    lon: 2.3522,
    landmarks: [
      { name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945 },
      { name: 'Arc de Triomphe', lat: 48.8738, lon: 2.2950 },
      { name: 'Louvre Museum', lat: 48.8606, lon: 2.3376 },
      { name: 'Notre-Dame', lat: 48.8530, lon: 2.3499 },
      { name: 'Sacre-Coeur', lat: 48.8867, lon: 2.3431 },
    ],
  },
  {
    name: 'Dubai',
    lat: 25.2048,
    lon: 55.2708,
    landmarks: [
      { name: 'Burj Khalifa', lat: 25.1972, lon: 55.2744 },
      { name: 'Palm Jumeirah', lat: 25.1124, lon: 55.1390 },
      { name: 'Dubai Mall', lat: 25.1985, lon: 55.2796 },
      { name: 'Burj Al Arab', lat: 25.1412, lon: 55.1854 },
      { name: 'Dubai Frame', lat: 25.2350, lon: 55.3004 },
    ],
  },
];
