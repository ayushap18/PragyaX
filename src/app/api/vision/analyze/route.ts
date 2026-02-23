import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';
import { CCTV_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('vision-analyze', { maxRequests: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  try {
    const body = await request.json();
    const { cameraId, city, label, lat, lon, direction } = body;

    const cacheKey = `cctv-${cameraId}`;
    const cached = cache.get<{
      vehicleCount: number;
      trafficFlow: string;
      anomalies: string[];
      weatherObserved: string;
      crowdDensity: string;
      summary: string;
    }>(cacheKey);

    if (cached) {
      return NextResponse.json({
        cameraId,
        timestamp: new Date().toISOString(),
        ...cached,
        cached: true,
      });
    }

    const userPrompt = `Camera: ${label} (${cameraId})
City: ${city}
Position: ${lat}°N, ${lon}°E
Facing: ${direction}
Time: ${new Date().toISOString()}

Generate the surveillance analysis.`;

    let responseText = '';
    let apiSucceeded = false;

    // Try Gemini first, then Anthropic, then fall back to simulated data
    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: CCTV_ANALYSIS_SYSTEM_PROMPT }] },
              contents: [{ parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 300,
              },
            }),
            signal: AbortSignal.timeout(15000),
          }
        );

        if (res.ok) {
          const data = await res.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (responseText) apiSucceeded = true;
        }
      } catch {
        // Gemini failed, will try fallback
      }
    }

    if (!apiSucceeded && anthropicKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 200,
            temperature: 0.5,
            system: CCTV_ANALYSIS_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          const data = await res.json();
          responseText = data.content?.[0]?.text || '';
          if (responseText) apiSucceeded = true;
        }
      } catch {
        // Anthropic failed, will use simulated data
      }
    }

    // If API parsed successfully, return structured data
    if (apiSucceeded) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsed = JSON.parse(responseText);

        cache.set(cacheKey, parsed, 300_000); // 5min cache

        return NextResponse.json({
          cameraId,
          timestamp: new Date().toISOString(),
          vehicleCount: parsed.vehicleCount || 0,
          trafficFlow: parsed.trafficFlow || 'MODERATE',
          anomalies: parsed.anomalies || [],
          weatherObserved: parsed.weatherObserved || 'CLEAR',
          crowdDensity: parsed.crowdDensity || 'MODERATE',
          summary: parsed.summary || 'Analysis complete.',
          cached: false,
        });
      } catch {
        // JSON parse failed, fall through to simulated
      }
    }

    // Simulated analysis — always returns valid data
    const hour = new Date().getUTCHours();
    const isNight = hour < 6 || hour > 20;
    const vehicleCount = Math.floor(15 + Math.random() * 60);
    const flows = ['FREE', 'MODERATE', 'HEAVY'] as const;
    const flow = flows[Math.min(Math.floor(vehicleCount / 30), 2)];
    const densities = ['LOW', 'MODERATE', 'HIGH'] as const;
    const density = densities[Math.min(Math.floor(vehicleCount / 30), 2)];
    const simulated = {
      vehicleCount,
      trafficFlow: flow,
      anomalies: [] as string[],
      weatherObserved: isNight ? 'CLEAR — LOW LIGHT' : 'CLEAR VISIBILITY',
      crowdDensity: density,
      summary: `${city} — ${label}: ${flow.toLowerCase()} traffic flow detected. ${vehicleCount} vehicles in frame. ${isNight ? 'Low-light conditions.' : 'Standard daylight operations.'} No anomalies.`,
    };

    cache.set(cacheKey, simulated, 300_000);

    return NextResponse.json({
      cameraId,
      timestamp: new Date().toISOString(),
      ...simulated,
      cached: false,
    });
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to analyze camera feed',
      502
    );
  }
}
