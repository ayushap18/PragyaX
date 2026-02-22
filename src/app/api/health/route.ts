import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET() {
  const stats = cache.getStats();

  const upstreams: Record<string, { status: string; lastFetch: number | null }> = {
    opensky: {
      status: cache.has('flights-fallback') ? 'connected' : 'unknown',
      lastFetch: cache.getAge('flights-fallback'),
    },
    usgs: {
      status: stats.keys.some((k) => k.startsWith('earthquakes-')) ? 'connected' : 'unknown',
      lastFetch: null,
    },
    celestrak: {
      status: stats.keys.some((k) => k.startsWith('satellites-')) ? 'connected' : 'unknown',
      lastFetch: null,
    },
    openweather: {
      status: process.env.OPENWEATHER_API_KEY ? 'configured' : 'no_key',
      lastFetch: null,
    },
    anthropic: {
      status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'no_key',
      lastFetch: null,
    },
    gemini: {
      status: process.env.GEMINI_API_KEY ? 'configured' : 'no_key',
      lastFetch: null,
    },
  };

  return NextResponse.json({
    status: 'operational',
    uptime: process.uptime(),
    cacheEntries: stats.entries,
    upstreams,
    timestamp: new Date().toISOString(),
  });
}
