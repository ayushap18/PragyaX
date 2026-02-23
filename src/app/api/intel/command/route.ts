import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';
import { COMMAND_PARSER_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('intel-command', { maxRequests: 60, windowMs: 60_000 });

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
    const { command, context } = body;

    if (!command || typeof command !== 'string') {
      return errorResponse('INVALID_REQUEST', 'Missing command string', 400);
    }

    const userPrompt = `Context:
- Current city: ${context?.currentCity || 'Unknown'}
- Current position: ${context?.currentLat || 0}°N, ${context?.currentLon || 0}°E
- Current mode: ${context?.currentMode || 'NORMAL'}
- Active layers: ${(context?.activeLayers || []).join(', ')}
- Flights in view: ${context?.flightCount || 0}
- Satellites tracked: ${context?.satelliteCount || 0}

User command: "${command}"`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        temperature: 0.1,
        system: COMMAND_PARSER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return errorResponse('ANTHROPIC_ERROR', `Claude API error: ${res.status}`, 502);
    }

    const data = await res.json();
    let responseText = data.content?.[0]?.text || '';

    // Strip markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json({
        ...parsed,
        parsed: true,
        confidence: 0.9,
        narration: `Executing: ${command}`,
      });
    } catch {
      return NextResponse.json({
        action: 'alert',
        message: `Could not parse command: "${command}"`,
        severity: 'INFO',
        parsed: false,
        confidence: 0,
        narration: 'Command not understood',
      });
    }
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to parse command',
      502
    );
  }
}
