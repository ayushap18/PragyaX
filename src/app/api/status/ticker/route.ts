import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';
import { STATUS_TICKER_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('ticker', { maxRequests: 5, windowMs: 60_000 });

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const cacheKey = 'status-ticker';
  const cached = cache.get<{ messages: string[] }>(cacheKey);
  if (cached) {
    return NextResponse.json({ messages: cached.messages, cached: true });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Return default messages if no API key
    const defaults = [
      'SATCOM RELAY ALPHA — SIGNAL NOMINAL',
      'ADS-B FEED INTEGRITY CHECK — PASSED',
      'ENCRYPTION RATCHET — KEY ROTATION COMPLETE',
      'ORBITAL TRACK PREDICTION — NEXT UPDATE 00:15Z',
      'SENSOR GRID — 94% COVERAGE ACTIVE',
      'SIGINT ARRAY — SCANNING 12.4-14.8 GHz',
      'IMINT PIPELINE — 3 TASKS QUEUED',
      'COMSAT HANDOVER — RELAY BRAVO STANDBY',
      'TERRAIN MODEL — GL30 DATASET LOADED',
      'FEED LATENCY — 12ms AVERAGE',
    ];
    return NextResponse.json({ messages: defaults, cached: false });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        temperature: 0.7,
        system: STATUS_TICKER_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: 'Generate 20 different system status messages, one per line. No numbering, no bullets, just the raw messages.',
        }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return errorResponse('ANTHROPIC_ERROR', `Claude API error: ${res.status}`, 502);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const messages = text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line.length <= 80);

    if (messages.length > 0) {
      cache.set(cacheKey, { messages }, 600_000); // 10 min cache
      return NextResponse.json({ messages, cached: false });
    }

    return NextResponse.json({ messages: ['SYSTEM STATUS — NOMINAL'], cached: false });
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to generate ticker',
      502
    );
  }
}
