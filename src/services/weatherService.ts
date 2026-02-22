const WEATHER_LAYERS = [
  'precipitation_new',
  'clouds_new',
  'wind_new',
  'temp_new',
  'pressure_new',
] as const;

export type WeatherLayerType = (typeof WEATHER_LAYERS)[number];

export function getWeatherTileUrl(layer: WeatherLayerType = 'precipitation_new'): string {
  return `/api/weather/tile/${layer}/{z}/{x}/{y}`;
}

export { WEATHER_LAYERS };
