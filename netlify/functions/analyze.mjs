import { analyzePlant, publicError } from '../../lib/plant-analysis.mjs';

export const config = {
  path: '/api/analyze',
  method: 'POST',
};

const requestWindow = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 12;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function clientId(request) {
  return request.headers.get('x-nf-client-connection-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}

function isRateLimited(request) {
  const now = Date.now();
  const id = clientId(request);
  const current = requestWindow.get(id);

  if (!current || now - current.startedAt > RATE_LIMIT_WINDOW_MS) {
    requestWindow.set(id, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

export default async function analyze(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  if (!isSameOrigin(request)) {
    return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  }

  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return json({ error: 'Expected an application/json request.' }, 415);
  }

  if (isRateLimited(request)) {
    return json({ error: 'Too many analysis requests. Please try again later.' }, 429);
  }

  try {
    const payload = await request.json();
    const analysis = await analyzePlant(payload);
    return json(analysis);
  } catch (error) {
    const safe = publicError(error);
    return json({ error: safe.message }, safe.status);
  }
}
