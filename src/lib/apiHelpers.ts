import { NextResponse } from 'next/server';

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
