import { jsonResponse, preflightResponse, probeProviders } from '../lib/aiProviders.mjs';

export const config = {
  path: '/api/ai/warmup',
  method: ['GET', 'OPTIONS'],
};

export default async (req) => {
  if (req.method === 'OPTIONS') return preflightResponse();

  try {
    const verifiedModels = await probeProviders();
    return jsonResponse(200, { ok: true, verifiedModels, primaryEngine: 'Lroutev1' });
  } catch {
    return jsonResponse(200, { ok: true, verifiedModels: ['openrouter/free'], primaryEngine: 'Lroutev1' });
  }
};
