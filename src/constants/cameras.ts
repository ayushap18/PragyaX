import type { CameraPosition } from '@/types';

export const CAMERAS: CameraPosition[] = [
  // Washington DC
  { id: 'dc-capitol', label: 'US Capitol', city: 'Washington DC', lat: 38.8899, lon: -77.0091, feedUrl: '', direction: 'N' },
  { id: 'dc-whitehouse', label: 'White House', city: 'Washington DC', lat: 38.8977, lon: -77.0365, feedUrl: '', direction: 'S' },
  { id: 'dc-pentagon', label: 'Pentagon', city: 'Washington DC', lat: 38.8719, lon: -77.0563, feedUrl: '', direction: 'NE' },
  { id: 'dc-mall', label: 'National Mall', city: 'Washington DC', lat: 38.8893, lon: -77.0228, feedUrl: '', direction: 'W' },
  { id: 'dc-lincoln', label: 'Lincoln Memorial', city: 'Washington DC', lat: 38.8893, lon: -77.0502, feedUrl: '', direction: 'E' },
  { id: 'dc-union', label: 'Union Station', city: 'Washington DC', lat: 38.8972, lon: -77.0064, feedUrl: '', direction: 'SW' },
  { id: 'dc-georgetown', label: 'Georgetown', city: 'Washington DC', lat: 38.9076, lon: -77.0723, feedUrl: '', direction: 'SE' },
  { id: 'dc-dupont', label: 'Dupont Circle', city: 'Washington DC', lat: 38.9096, lon: -77.0434, feedUrl: '', direction: 'N' },

  // New York
  { id: 'ny-timessq', label: 'Times Square', city: 'New York', lat: 40.7580, lon: -73.9855, feedUrl: '', direction: 'S' },
  { id: 'ny-wtc', label: 'WTC Area', city: 'New York', lat: 40.7116, lon: -74.0131, feedUrl: '', direction: 'N' },
  { id: 'ny-central', label: 'Central Park S', city: 'New York', lat: 40.7648, lon: -73.9724, feedUrl: '', direction: 'N' },
  { id: 'ny-brooklyn', label: 'Brooklyn Bridge', city: 'New York', lat: 40.7061, lon: -73.9969, feedUrl: '', direction: 'E' },
  { id: 'ny-empirestate', label: 'Empire State', city: 'New York', lat: 40.7484, lon: -73.9857, feedUrl: '', direction: 'W' },
  { id: 'ny-wallst', label: 'Wall Street', city: 'New York', lat: 40.7069, lon: -74.0089, feedUrl: '', direction: 'N' },
  { id: 'ny-un', label: 'UN Building', city: 'New York', lat: 40.7489, lon: -73.9680, feedUrl: '', direction: 'E' },
  { id: 'ny-grandcentral', label: 'Grand Central', city: 'New York', lat: 40.7527, lon: -73.9772, feedUrl: '', direction: 'S' },

  // Tokyo
  { id: 'tk-shibuya', label: 'Shibuya Crossing', city: 'Tokyo', lat: 35.6595, lon: 139.7004, feedUrl: '', direction: 'N' },
  { id: 'tk-tower', label: 'Tokyo Tower', city: 'Tokyo', lat: 35.6586, lon: 139.7454, feedUrl: '', direction: 'W' },
  { id: 'tk-akihabara', label: 'Akihabara', city: 'Tokyo', lat: 35.6984, lon: 139.7731, feedUrl: '', direction: 'S' },
  { id: 'tk-shinjuku', label: 'Shinjuku Station', city: 'Tokyo', lat: 35.6896, lon: 139.7006, feedUrl: '', direction: 'E' },
  { id: 'tk-imperial', label: 'Imperial Palace', city: 'Tokyo', lat: 35.6852, lon: 139.7528, feedUrl: '', direction: 'N' },
  { id: 'tk-skytree', label: 'Skytree', city: 'Tokyo', lat: 35.7101, lon: 139.8107, feedUrl: '', direction: 'SW' },
  { id: 'tk-asakusa', label: 'Asakusa', city: 'Tokyo', lat: 35.7148, lon: 139.7967, feedUrl: '', direction: 'W' },
  { id: 'tk-roppongi', label: 'Roppongi', city: 'Tokyo', lat: 35.6641, lon: 139.7292, feedUrl: '', direction: 'NE' },

  // London
  { id: 'ld-bigben', label: 'Big Ben', city: 'London', lat: 51.5007, lon: -0.1246, feedUrl: '', direction: 'N' },
  { id: 'ld-tower', label: 'Tower Bridge', city: 'London', lat: 51.5055, lon: -0.0754, feedUrl: '', direction: 'W' },
  { id: 'ld-trafalgar', label: 'Trafalgar Square', city: 'London', lat: 51.5080, lon: -0.1281, feedUrl: '', direction: 'S' },
  { id: 'ld-buckingham', label: 'Buckingham Palace', city: 'London', lat: 51.5014, lon: -0.1419, feedUrl: '', direction: 'E' },
  { id: 'ld-canary', label: 'Canary Wharf', city: 'London', lat: 51.5054, lon: -0.0235, feedUrl: '', direction: 'N' },
  { id: 'ld-piccadilly', label: 'Piccadilly Circus', city: 'London', lat: 51.5100, lon: -0.1340, feedUrl: '', direction: 'NE' },
  { id: 'ld-londoneye', label: 'London Eye', city: 'London', lat: 51.5033, lon: -0.1195, feedUrl: '', direction: 'E' },
  { id: 'ld-stpauls', label: "St Paul's", city: 'London', lat: 51.5138, lon: -0.0984, feedUrl: '', direction: 'W' },

  // San Francisco
  { id: 'sf-gg', label: 'Golden Gate', city: 'San Francisco', lat: 37.8199, lon: -122.4783, feedUrl: '', direction: 'S' },
  { id: 'sf-pier39', label: 'Pier 39', city: 'San Francisco', lat: 37.8087, lon: -122.4098, feedUrl: '', direction: 'N' },
  { id: 'sf-union', label: 'Union Square', city: 'San Francisco', lat: 37.7879, lon: -122.4074, feedUrl: '', direction: 'W' },
  { id: 'sf-ferry', label: 'Ferry Building', city: 'San Francisco', lat: 37.7955, lon: -122.3937, feedUrl: '', direction: 'E' },
  { id: 'sf-coit', label: 'Coit Tower', city: 'San Francisco', lat: 37.8024, lon: -122.4058, feedUrl: '', direction: 'S' },
  { id: 'sf-chinatown', label: 'Chinatown', city: 'San Francisco', lat: 37.7941, lon: -122.4078, feedUrl: '', direction: 'N' },
  { id: 'sf-mission', label: 'Mission District', city: 'San Francisco', lat: 37.7599, lon: -122.4148, feedUrl: '', direction: 'E' },
  { id: 'sf-castro', label: 'Castro', city: 'San Francisco', lat: 37.7609, lon: -122.4350, feedUrl: '', direction: 'W' },

  // Paris
  { id: 'pa-eiffel', label: 'Eiffel Tower', city: 'Paris', lat: 48.8584, lon: 2.2945, feedUrl: '', direction: 'N' },
  { id: 'pa-arc', label: 'Arc de Triomphe', city: 'Paris', lat: 48.8738, lon: 2.2950, feedUrl: '', direction: 'S' },
  { id: 'pa-louvre', label: 'Louvre', city: 'Paris', lat: 48.8606, lon: 2.3376, feedUrl: '', direction: 'W' },
  { id: 'pa-notre', label: 'Notre-Dame', city: 'Paris', lat: 48.8530, lon: 2.3499, feedUrl: '', direction: 'E' },
  { id: 'pa-sacre', label: 'Sacre-Coeur', city: 'Paris', lat: 48.8867, lon: 2.3431, feedUrl: '', direction: 'S' },
  { id: 'pa-champs', label: 'Champs-Elysees', city: 'Paris', lat: 48.8698, lon: 2.3076, feedUrl: '', direction: 'NW' },
  { id: 'pa-bastille', label: 'Bastille', city: 'Paris', lat: 48.8533, lon: 2.3692, feedUrl: '', direction: 'W' },
  { id: 'pa-gare', label: 'Gare du Nord', city: 'Paris', lat: 48.8809, lon: 2.3553, feedUrl: '', direction: 'S' },

  // Dubai
  { id: 'db-burj', label: 'Burj Khalifa', city: 'Dubai', lat: 25.1972, lon: 55.2744, feedUrl: '', direction: 'N' },
  { id: 'db-palm', label: 'Palm Jumeirah', city: 'Dubai', lat: 25.1124, lon: 55.1390, feedUrl: '', direction: 'E' },
  { id: 'db-marina', label: 'Dubai Marina', city: 'Dubai', lat: 25.0805, lon: 55.1403, feedUrl: '', direction: 'NE' },
  { id: 'db-mall', label: 'Dubai Mall', city: 'Dubai', lat: 25.1985, lon: 55.2796, feedUrl: '', direction: 'W' },
  { id: 'db-frame', label: 'Dubai Frame', city: 'Dubai', lat: 25.2350, lon: 55.3004, feedUrl: '', direction: 'S' },
  { id: 'db-creek', label: 'Dubai Creek', city: 'Dubai', lat: 25.2644, lon: 55.3076, feedUrl: '', direction: 'N' },
  { id: 'db-jumeirah', label: 'Jumeirah Beach', city: 'Dubai', lat: 25.2048, lon: 55.2321, feedUrl: '', direction: 'E' },
  { id: 'db-alarab', label: 'Burj Al Arab', city: 'Dubai', lat: 25.1412, lon: 55.1854, feedUrl: '', direction: 'W' },

  // Austin
  { id: 'au-capitol', label: 'State Capitol', city: 'Austin', lat: 30.2747, lon: -97.7404, feedUrl: '', direction: 'S' },
  { id: 'au-ut', label: 'UT Tower', city: 'Austin', lat: 30.2862, lon: -97.7394, feedUrl: '', direction: 'N' },
  { id: 'au-6th', label: '6th Street', city: 'Austin', lat: 30.2672, lon: -97.7388, feedUrl: '', direction: 'W' },
  { id: 'au-congress', label: 'Congress Ave Bridge', city: 'Austin', lat: 30.2613, lon: -97.7450, feedUrl: '', direction: 'E' },
  { id: 'au-zilker', label: 'Zilker Park', city: 'Austin', lat: 30.2670, lon: -97.7731, feedUrl: '', direction: 'N' },
  { id: 'au-barton', label: 'Barton Springs', city: 'Austin', lat: 30.2640, lon: -97.7713, feedUrl: '', direction: 'S' },
  { id: 'au-rainey', label: 'Rainey Street', city: 'Austin', lat: 30.2590, lon: -97.7390, feedUrl: '', direction: 'NW' },
  { id: 'au-ladybird', label: 'Lady Bird Lake', city: 'Austin', lat: 30.2611, lon: -97.7506, feedUrl: '', direction: 'E' },
];

export function getCamerasForCity(city: string): CameraPosition[] {
  return CAMERAS.filter((c) => c.city === city);
}
