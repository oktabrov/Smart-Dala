import { analyzePlant, publicError } from '../lib/plant-analysis.mjs';

// Compatibility endpoint for Vercel deployments. The recovered Netlify app
// uses /api/analyze; this keeps the same server-side AI implementation usable
// when the project is deployed to Vercel instead.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const analysis = await analyzePlant(payload);
    return res.status(200).json(analysis);
  } catch (error) {
    const safe = publicError(error);
    return res.status(safe.status).json({ error: safe.message });
  }
}
