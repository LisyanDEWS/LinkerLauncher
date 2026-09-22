import { fetchWithTimeout, jsonResponse, preflightResponse } from '../lib/aiProviders.mjs';

export const config = {
  path: '/api/geoip',
  method: ['GET', 'OPTIONS'],
};

const FALLBACK = { city: 'Москва', country: 'Россия', latitude: 55.7558, longitude: 37.6173 };
const GEOIP_CACHE = new Map();
const GEOIP_TTL = 30 * 60 * 1000;

function clientIp(req) {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    ''
  );
}

function isPrivateIp(ip) {
  return !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');
}

export default async (req) => {
  if (req.method === 'OPTIONS') return preflightResponse();

  const ip = clientIp(req);
  const cacheKey = ip || 'local';
  const cached = GEOIP_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < GEOIP_TTL) {
    return jsonResponse(200, cached.data);
  }

  const local = isPrivateIp(ip);

  try {
    const geoRes = await fetchWithTimeout(
      local ? 'https://freeipapi.com/api/json' : `https://freeipapi.com/api/json/${ip}`,
      {},
      2500
    );
    if (geoRes.ok) {
      const data = await geoRes.json();
      if (data && data.cityName && data.latitude) {
        const result = {
          city: data.cityName,
          country: data.countryName || '',
          latitude: data.latitude,
          longitude: data.longitude,
          ip: data.ipAddress || ip,
        };
        GEOIP_CACHE.set(cacheKey, { data: result, ts: Date.now() });
        return jsonResponse(200, result);
      }
    }

    const whoRes = await fetchWithTimeout(local ? 'https://ipwho.is/' : `https://ipwho.is/${ip}`, {}, 2500);
    if (whoRes.ok) {
      const data = await whoRes.json();
      if (data && data.success && data.city) {
        const result = {
          city: data.city,
          country: data.country || '',
          latitude: data.latitude,
          longitude: data.longitude,
          ip: data.ip || ip,
        };
        GEOIP_CACHE.set(cacheKey, { data: result, ts: Date.now() });
        return jsonResponse(200, result);
      }
    }
  } catch {}

  const fallback = { ...FALLBACK, ip: ip || '127.0.0.1' };
  GEOIP_CACHE.set(cacheKey, { data: fallback, ts: Date.now() });
  return jsonResponse(200, fallback);
};
