import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';
import { BREADCRUMB_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('breadcrumbs', { maxRequests: 20, windowMs: 60_000 });

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
    const { city } = body;

    if (!city || typeof city !== 'string') {
      return errorResponse('INVALID_REQUEST', 'Missing city name', 400);
    }

    const cacheKey = `breadcrumbs-${city.toLowerCase()}`;
    const cached = cache.get<{ breadcrumbs: string[] }>(cacheKey);
    if (cached) {
      return NextResponse.json({ breadcrumbs: cached.breadcrumbs, cached: true });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        temperature: 0.2,
        system: BREADCRUMB_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: city }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return errorResponse('ANTHROPIC_ERROR', `Claude API error: ${res.status}`, 502);
    }

    const data = await res.json();
    let text = data.content?.[0]?.text || '[]';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const breadcrumbs = JSON.parse(text);
      if (Array.isArray(breadcrumbs)) {
        // Cache permanently per city (until server restart)
        cache.set(cacheKey, { breadcrumbs }, 86_400_000); // 24h cache
        return NextResponse.json({ breadcrumbs, cached: false });
      }
    } catch {
      // Parse failed
    }

    return NextResponse.json({ breadcrumbs: [], cached: false });
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to generate breadcrumbs',
      502
    );
  }
}
