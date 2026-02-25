import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP, parseBody, sanitizeForPrompt, validateCoordinates } from '@/lib/apiHelpers';
import { COMMAND_PARSER_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('intel-command', { maxRequests: 60, windowMs: 60_000 });

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse('SERVICE_UNAVAILABLE', 'AI service not available', 503);
  }

  try {
    const result = await parseBody<{ command: string; context?: Record<string, unknown> }>(request);
    if (result.error) return result.error;
    const { command, context } = result.data;

    if (!command || typeof command !== 'string') {
      return errorResponse('INVALID_REQUEST', 'Missing command string', 400);
    }

    const sanitizedCommand = sanitizeForPrompt(command, 300);
    const coords = validateCoordinates(context?.currentLat, context?.currentLon);
    const city = sanitizeForPrompt(String(context?.currentCity || 'Unknown'), 50);
    const mode = sanitizeForPrompt(String(context?.currentMode || 'NORMAL'), 20);

    const userPrompt = `Context:
- Current city: ${city}
- Current position: ${coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'Unknown'}
- Current mode: ${mode}
- Active layers: ${Array.isArray(context?.activeLayers) ? (context.activeLayers as string[]).slice(0, 20).join(', ') : 'none'}
- Flights in view: ${Math.max(0, Math.min(99999, Number(context?.flightCount) || 0))}
- Satellites tracked: ${Math.max(0, Math.min(99999, Number(context?.satelliteCount) || 0))}

User command: "${sanitizedCommand}"`;

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
      return errorResponse('UPSTREAM_ERROR', 'AI service returned an error', 502);
    }

    const data = await res.json();
    let responseText = data.content?.[0]?.text || '';

    // Strip markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(responseText);
      // Only allow expected fields through (prevent prototype pollution)
      return NextResponse.json({
        action: String(parsed.action || 'alert'),
        message: String(parsed.message || ''),
        severity: String(parsed.severity || 'INFO'),
        target: parsed.target != null ? String(parsed.target) : undefined,
        value: parsed.value != null ? parsed.value : undefined,
        parsed: true,
        confidence: 0.9,
        narration: `Executing: ${sanitizedCommand}`,
      });
    } catch {
      return NextResponse.json({
        action: 'alert',
        message: 'Command not understood',
        severity: 'INFO',
        parsed: false,
        confidence: 0,
        narration: 'Command not understood',
      });
    }
  } catch {
    return errorResponse('INTERNAL_ERROR', 'Failed to process command', 502);
  }
}
