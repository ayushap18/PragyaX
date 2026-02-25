import { NextResponse } from 'next/server';

const MAX_BODY_SIZE = 50_000; // 50KB max request body

export function errorResponse(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: true, code, message, ...extra },
    { status }
  );
}

export function rateLimitResponse(retryAfterMs: number) {
  return errorResponse(
    'RATE_LIMITED',
    'Too many requests',
    429,
    { retryAfterMs }
  );
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return '127.0.0.1';
}

/**
 * Parse and validate JSON body with size limit.
 * Returns the parsed body or an error response.
 */
export async function parseBody<T = Record<string, unknown>>(
  request: Request
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return { error: errorResponse('BODY_TOO_LARGE', 'Request body exceeds size limit', 413) };
  }
  try {
    const data = await request.json() as T;
    return { data };
  } catch {
    return { error: errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400) };
  }
}

/**
 * Validate coordinate values are within valid ranges.
 */
export function validateCoordinates(lat: unknown, lon: unknown): { lat: number; lon: number } | null {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (isNaN(latNum) || isNaN(lonNum)) return null;
  if (latNum < -90 || latNum > 90) return null;
  if (lonNum < -180 || lonNum > 180) return null;
  return { lat: latNum, lon: lonNum };
}

/**
 * Sanitize user input for LLM prompts — strip injection patterns.
 */
export function sanitizeForPrompt(input: string, maxLen: number = 500): string {
  return input
    .slice(0, maxLen)
    .replace(/[<>{}]/g, '')         // strip HTML/template chars
    .replace(/\r?\n/g, ' ')         // flatten to single line
    .trim();
}
