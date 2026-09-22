import { fetchWithTimeout, jsonResponse, preflightResponse } from '../lib/aiProviders.mjs';

export const config = {
  path: '/api/geoip',
  method: ['GET', 'OPTIONS'],
};

const FALLBACK = { city: 'Москва', country: 'Россия', latitude: 55.7558, longitude: 37.6173 };

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
  const local = isPrivateIp(ip);

  try {
    const geoRes = await fetchWithTimeout(
      local ? 'https://freeipapi.com/api/json' : `https://freeipapi.com/api/json/${ip}`,
      {},
      4000
    );
    if (geoRes.ok) {
      const data = await geoRes.json();
      if (data && data.cityName && data.latitude) {
        return jsonResponse(200, {
          city: data.cityName,
          country: data.countryName || '',
          latitude: data.latitude,
          longitude: data.longitude,
          ip: data.ipAddress || ip,
        });
      }
    }

    const whoRes = await fetchWithTimeout(local ? 'https://ipwho.is/' : `https://ipwho.is/${ip}`, {}, 4000);
    if (whoRes.ok) {
      const data = await whoRes.json();
      if (data && data.success && data.city) {
        return jsonResponse(200, {
          city: data.city,
          country: data.country || '',
          latitude: data.latitude,
          longitude: data.longitude,
          ip: data.ip || ip,
        });
      }
    }
  } catch {}

  return jsonResponse(200, { ...FALLBACK, ip: ip || '127.0.0.1' });
};
