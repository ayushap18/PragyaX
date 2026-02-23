import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';
import { SATELLITE_PROFILE_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('sat-profile', { maxRequests: 10, windowMs: 60_000 });

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse('NO_API_KEY', 'Anthropic API key not configured', 503);
  }

  try {
    const body = await request.json();
    const { name, noradId, orbitType, inclination, intlDesignator } = body;

    const cacheKey = `sat-profile-${noradId}`;
    const cached = cache.get<{ profile: string }>(cacheKey);
    if (cached) {
      return NextResponse.json({ profile: cached.profile, cached: true });
    }

    const userPrompt = `Satellite: ${name}
NORAD ID: ${noradId}
International Designator: ${intlDesignator}
Orbit Type: ${orbitType}
Inclination: ${inclination}°

Generate the intelligence profile.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        temperature: 0.4,
        system: SATELLITE_PROFILE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return errorResponse('ANTHROPIC_ERROR', `Claude API error: ${res.status}`, 502);
    }

    const data = await res.json();
    const profile = data.content?.[0]?.text || '';

    cache.set(cacheKey, { profile }, 3_600_000); // Cache for 1 hour per satellite

    return NextResponse.json({ profile, cached: false });
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to generate satellite profile',
      502
    );
  }
}
