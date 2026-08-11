const MAX_IMAGE_BYTES = 3_500_000;
const REQUEST_TIMEOUT_MS = 25_000;
const ALLOWED_LANGUAGES = new Set(['uz', 'ru', 'en']);
const ALLOWED_SEVERITIES = new Set(['HEALTHY', 'WARNING', 'CRITICAL']);

class PublicError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'PublicError';
    this.status = status;
  }
}

function safeString(value, fallback, maxLength) {
  if (typeof value !== 'string') return fallback;
  const result = value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
  return result || fallback;
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validateImage(image) {
  if (typeof image !== 'string') {
    throw new PublicError('An image is required for analysis.', 400);
  }

  const match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    throw new PublicError('The image must be a JPEG, PNG, or WebP data URL.', 400);
  }

  const base64 = match[2].replace(/\s/g, '');
  const bytes = Math.floor((base64.length * 3) / 4);
  if (!base64 || bytes > MAX_IMAGE_BYTES) {
    throw new PublicError('The image is too large. Use an image below 3.5 MB.', 413);
  }

  const mimeType = match[1].toLowerCase() === 'jpg' ? 'image/jpeg' : 'image/' + match[1].toLowerCase();
  return {
    mimeType,
    base64,
    dataUrl: 'data:' + mimeType + ';base64,' + base64,
  };
}

function normalizeRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new PublicError('The request body must be JSON.', 400);
  }

  const language = ALLOWED_LANGUAGES.has(input.language) ? input.language : 'uz';
  const sensorData = input.sensorData && typeof input.sensorData === 'object'
    ? {
        temperature: safeNumber(input.sensorData.temperature),
        humidity: safeNumber(input.sensorData.humidity),
        gas: safeNumber(input.sensorData.gas),
        moisture: safeNumber(input.sensorData.moisture),
      }
    : null;

  return {
    image: validateImage(input.image),
    language,
    sensorData,
  };
}

function languageName(language) {
  if (language === 'ru') return 'Russian';
  if (language === 'en') return 'English';
  return 'Uzbek (Latin script)';
}

function buildPrompt({ language, sensorData }) {
  const sensorSummary = sensorData
    ? 'Optional current sensor snapshot: temperature ' + (sensorData.temperature ?? 'unknown') + '°C, humidity ' + (sensorData.humidity ?? 'unknown') + '%, air value ' + (sensorData.gas ?? 'unknown') + ' ppm, soil moisture ' + (sensorData.moisture ?? 'unknown') + '%.'
    : 'No sensor snapshot is available.';

  return [
    'You are Smart Dala, an agricultural crop-diagnostics assistant.',
    'Inspect the supplied crop photo carefully. Give cautious, practical advice; do not present a visual assessment as certainty. If diagnosis is unclear, say so and recommend a local agronomist or laboratory inspection. Do not invent pesticide rates. Any treatment must advise following the product label and local regulations.',
    'Answer only in ' + languageName(language) + '.',
    sensorSummary,
    'Return ONLY a valid JSON object, without Markdown fences, with exactly these fields:',
    '{',
    '  "crop": "short crop name or Unknown",',
    '  "diagnosis": "short assessment",',
    '  "treatment": "practical next step(s)",',
    '  "irrigation": "required / not required / inspect soil",',
    '  "severity": "HEALTHY, WARNING, or CRITICAL",',
    '  "report": "concise explanation, observations, and safe next steps"',
    '}',
  ].join('\n');
}

function extractJson(text) {
  if (typeof text !== 'string') return null;
  const clean = text.replace(/^\x60\x60\x60(?:json)?/i, '').replace(/\x60\x60\x60$/i, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? clean.slice(start, end + 1) : clean;
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeResult(raw, fallbackText = '') {
  const severity = String(raw?.severity || '').trim().toUpperCase();
  return {
    crop: safeString(raw?.crop, 'Unknown crop', 160),
    diagnosis: safeString(raw?.diagnosis, 'Further inspection recommended', 240),
    treatment: safeString(raw?.treatment, 'Inspect the plant closely and follow local agronomy guidance.', 600),
    irrigation: safeString(raw?.irrigation, 'Inspect soil moisture', 160),
    severity: ALLOWED_SEVERITIES.has(severity) ? severity : 'WARNING',
    report: safeString(raw?.report, fallbackText || 'The AI response could not be structured. Please inspect the crop with a qualified agronomist.', 6000),
  };
}

function providerError(provider, status) {
  const error = new Error(provider + ' request failed with status ' + status);
  error.provider = provider;
  error.status = status >= 400 && status < 500 ? 502 : 503;
  return error;
}

async function jsonFromResponse(response) {
  if (typeof response.text === 'function') {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { text };
    }
  }
  return response.json();
}

async function fetchWithTimeout(fetchImpl, url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('AI provider timed out');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('\n')
      .trim();
  }
  return '';
}

function nvidiaText(body) {
  return contentToText(body?.choices?.[0]?.message?.content)
    || contentToText(body?.choices?.[0]?.delta?.content)
    || contentToText(body?.choices?.[0]?.text)
    || contentToText(body?.response?.choices?.[0]?.message?.content)
    || contentToText(body?.output_text)
    || contentToText(body?.text);
}

async function requestGemini({ apiKey, model, prompt, image, fetchImpl }) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const response = await fetchWithTimeout(fetchImpl, endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: image.mimeType, data: image.base64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 850,
        responseMimeType: 'application/json',
      },
    }),
  });
  const body = await jsonFromResponse(response);
  if (!response.ok) throw providerError('Gemini', response.status);

  const text = body?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('\n')
    .trim();
  if (!text) throw providerError('Gemini', 502);
  return normalizeResult(extractJson(text), text);
}

async function pollNvidiaStatus({ requestId, apiKey, fetchImpl }) {
  const statusUrl = 'https://integrate.api.nvidia.com/v1/status/' + encodeURIComponent(requestId);
  for (let attempt = 0; attempt < 7; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    const response = await fetchWithTimeout(fetchImpl, statusUrl, {
      headers: { Authorization: 'Bearer ' + apiKey, Accept: 'application/json' },
    });
    const body = await jsonFromResponse(response);
    if (response.status === 202) continue;
    if (!response.ok) throw providerError('NVIDIA', response.status);
    return body;
  }
  const error = new Error('NVIDIA request did not finish in time');
  error.status = 504;
  throw error;
}

async function requestNvidia({ apiKey, model, endpoint, prompt, image, fetchImpl }) {
  const response = await fetchWithTimeout(fetchImpl, endpoint, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: image.dataUrl } },
        ],
      }],
      temperature: 0.2,
      max_tokens: 850,
      stream: false,
    }),
  });

  let body = await jsonFromResponse(response);
  if (response.status === 202) {
    const requestId = body?.requestId || body?.request_id || body?.id;
    if (!requestId) throw providerError('NVIDIA', 502);
    body = await pollNvidiaStatus({ requestId, apiKey, fetchImpl });
  } else if (!response.ok) {
    throw providerError('NVIDIA', response.status);
  }

  const text = nvidiaText(body);
  if (!text) throw providerError('NVIDIA', 502);
  return normalizeResult(extractJson(text), text);
}

export async function analyzePlant(input, { fetchImpl = globalThis.fetch, environment = process.env } = {}) {
  const request = normalizeRequest(input);
  const prompt = buildPrompt(request);
  const failures = [];
  const geminiKey = environment.GEMINI_API_KEY;
  const nvidiaKey = environment.NVIDIA_API_KEY;

  if (geminiKey) {
    try {
      const result = await requestGemini({
        apiKey: geminiKey,
        model: environment.GEMINI_MODEL || 'gemini-flash-latest',
        prompt,
        image: request.image,
        fetchImpl,
      });
      return { provider: 'gemini', result };
    } catch (error) {
      failures.push(error);
      console.warn('Gemini analysis unavailable', error?.status || 'network');
    }
  }

  if (nvidiaKey) {
    try {
      const model = environment.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';
      const endpoint = environment.NVIDIA_ENDPOINT || 'https://integrate.api.nvidia.com/v1/' + model;
      const result = await requestNvidia({
        apiKey: nvidiaKey,
        model,
        endpoint,
        prompt,
        image: request.image,
        fetchImpl,
      });
      return { provider: 'nvidia', result };
    } catch (error) {
      failures.push(error);
      console.warn('NVIDIA analysis unavailable', error?.status || 'network');
    }
  }

  if (!geminiKey && !nvidiaKey) {
    throw new PublicError('No AI provider is configured on the server.', 503);
  }

  const lastFailure = failures.at(-1);
  throw new PublicError('AI analysis is temporarily unavailable. Please try again shortly.', lastFailure?.status || 502);
}

export function publicError(error) {
  if (error instanceof PublicError) {
    return { status: error.status, message: error.message };
  }
  return {
    status: Number.isInteger(error?.status) ? Math.min(Math.max(error.status, 400), 599) : 500,
    message: 'The analysis service could not complete this request.',
  };
}
