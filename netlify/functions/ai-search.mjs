import { fetchWithTimeout, jsonResponse, preflightResponse } from '../lib/aiProviders.mjs';

export const config = {
  path: '/api/ai/search',
  method: ['GET', 'OPTIONS'],
};

// In-memory cache for search (warm Netlify instances)
const SEARCH_CACHE = new Map();
const SEARCH_TTL = 5 * 60 * 1000;

export default async (req) => {
  if (req.method === 'OPTIONS') return preflightResponse();

  const url = new URL(req.url);
  const query = (url.searchParams.get('q') || '').trim();
  if (!query) return jsonResponse(400, { error: 'Query parameter q is required' });

  const cacheKey = query.toLowerCase().slice(0, 80);
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < SEARCH_TTL) {
    return jsonResponse(200, cached.data);
  }

  const results = [];

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const searchRes = await fetchWithTimeout(
      searchUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'ru,en;q=0.9',
        },
      },
      4000
    );

    if (searchRes.ok) {
      const html = await searchRes.text();
      const resultRegex = /<a class="result__url" href="([^"]+)"[\s\S]*?<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      const titleRegex = /<a class="result__a" href="[^"]*">([\s\S]*?)<\/a>/gi;

      const rawTitles = [];
      let tMatch;
      while ((tMatch = titleRegex.exec(html)) !== null && rawTitles.length < 8) {
        rawTitles.push(tMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      let match;
      let idx = 0;
      while ((match = resultRegex.exec(html)) !== null && results.length < 6) {
        let rawUrl = match[1].trim();
        if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;
        if (rawUrl.includes('uddg=')) {
          const parsed = new URL(rawUrl, 'https://duckduckgo.com');
          rawUrl = decodeURIComponent(parsed.searchParams.get('uddg') || rawUrl);
        }

        let domain = '';
        try {
          domain = new URL(rawUrl).hostname.replace(/^www\./, '');
        } catch {
          domain = rawUrl.split('/')[0] || 'web';
        }

        const snippet = match[2]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .trim();
        const title = rawTitles[idx] || domain;

        if (rawUrl.startsWith('http') && snippet.length > 10) {
          results.push({ title, url: rawUrl, snippet, domain });
        }
        idx++;
      }
    }

    if (results.length === 0) {
      try {
        const ddgJson = await fetchWithTimeout(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
          {},
          2500
        );
        if (ddgJson.ok) {
          const data = await ddgJson.json();
          if (data.AbstractText) {
            results.push({
              title: data.Heading || query,
              url: data.AbstractURL || 'https://en.wikipedia.org',
              snippet: data.AbstractText,
              domain: data.AbstractSource || 'wikipedia.org',
            });
          }
          if (Array.isArray(data.RelatedTopics)) {
            for (const topic of data.RelatedTopics.slice(0, 4)) {
              if (topic.Text && topic.FirstURL) {
                let dom = 'web';
                try {
                  dom = new URL(topic.FirstURL).hostname.replace(/^www\./, '');
                } catch {}
                results.push({
                  title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 40),
                  url: topic.FirstURL,
                  snippet: topic.Text,
                  domain: dom,
                });
              }
            }
          }
        }
      } catch {}
    }

    const responseData = { query, count: results.length, results };
    SEARCH_CACHE.set(cacheKey, { data: responseData, ts: Date.now() });
    if (SEARCH_CACHE.size > 100) {
      const first = SEARCH_CACHE.keys().next().value;
      if (first) SEARCH_CACHE.delete(first);
    }
    return jsonResponse(200, responseData);
  } catch (err) {
    console.warn('Search error:', err);
    return jsonResponse(200, { query, count: 0, results: [] });
  }
};
