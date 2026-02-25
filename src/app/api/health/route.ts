import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET() {
  const stats = cache.getStats();

  // Only expose connection status — never reveal which API keys are configured
  const upstreams: Record<string, { status: string }> = {
    flights: {
      status: cache.has('flights-fallback') ? 'connected' : 'standby',
    },
    seismic: {
      status: stats.keys.some((k) => k.startsWith('earthquakes-')) ? 'connected' : 'standby',
    },
    orbital: {
      status: stats.keys.some((k) => k.startsWith('satellites-')) ? 'connected' : 'standby',
    },
  };

  return NextResponse.json({
    status: 'operational',
    cacheEntries: stats.entries,
    upstreams,
    timestamp: new Date().toISOString(),
  });
}
