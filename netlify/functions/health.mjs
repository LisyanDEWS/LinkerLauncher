import { jsonResponse, preflightResponse } from '../lib/aiProviders.mjs';

export const config = {
  path: '/api/health',
  method: ['GET', 'OPTIONS'],
};

export default async (req) => {
  if (req.method === 'OPTIONS') return preflightResponse();
  return jsonResponse(200, { ok: true, service: 'linkerru-server' });
};
