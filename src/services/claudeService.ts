import type { IntelBriefRequest, IntelBriefResponse, CommandResponse } from '@/types';

export async function generateIntelBrief(
  params: IntelBriefRequest
): Promise<IntelBriefResponse> {
  const res = await fetch('/api/intel/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Intel brief failed: ${res.status}`);
  return res.json();
}

export async function parseCommand(
  command: string,
  context: {
    currentCity: string;
    currentLat: number;
    currentLon: number;
    currentMode: string;
    activeLayers: string[];
    flightCount: number;
    satelliteCount: number;
  }
): Promise<CommandResponse> {
  const res = await fetch('/api/intel/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, context }),
  });
  if (!res.ok) throw new Error(`Command parse failed: ${res.status}`);
  return res.json();
}

export async function generateSatelliteProfile(params: {
  name: string;
  noradId: number;
  orbitType: string;
  inclination: number;
  intlDesignator: string;
}): Promise<{ profile: string; cached: boolean }> {
  const res = await fetch('/api/intel/satellite-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Satellite profile failed: ${res.status}`);
  return res.json();
}

export async function fetchBreadcrumbs(
  city: string
): Promise<{ breadcrumbs: string[]; cached: boolean }> {
  const res = await fetch('/api/intel/breadcrumbs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city }),
  });
  if (!res.ok) throw new Error(`Breadcrumbs failed: ${res.status}`);
  return res.json();
}

export async function fetchTickerMessages(): Promise<{
  messages: string[];
  cached: boolean;
}> {
  const res = await fetch('/api/status/ticker');
  if (!res.ok) throw new Error(`Ticker failed: ${res.status}`);
  return res.json();
}
