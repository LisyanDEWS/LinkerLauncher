import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index';
import { transcripts } from './src/db/schema';
import { desc, eq } from 'drizzle-orm';

const DEFAULT_LANGUAGES = ['ru', 'en'];
const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const INNERTUBE_PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player';
const ANDROID_CLIENT_VERSION = '20.40.39';
const USER_AGENT = 'com.google.android.youtube/' + ANDROID_CLIENT_VERSION + ' (Linux; U; Android 14) gzip';
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtmlEntities(value: string) {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function stripTags(value: string) {
  return String(value).replace(/<[^>]*>/g, '');
}

function normalizeLanguages(input?: string | string[]) {
  if (!input) return [...DEFAULT_LANGUAGES];
  const list = Array.isArray(input) ? input : String(input).split(',');
  return list.map((l) => String(l).trim().toLowerCase()).filter(Boolean);
}

interface TranscriptRecord {
  id: string;
  videoId: string;
  videoTitle: string;
  title: string;
  author: string;
  thumbnail: string;
  language: string;
  languageCode: string;
  isGenerated: boolean;
  content: string;
  text: string;
  snippetCount: number;
  snippets: { start: number; duration: number; text: string }[];
  availableLanguages: { code: string; name: string; generated: boolean }[];
  createdAt: string;
}

const transcriptsDb = new Map<string, TranscriptRecord>();

function extractVideoId(input: string): string {
  if (!input) return '';
  const trimmed = String(input).trim();
  if (!/[/?]/.test(trimmed)) {
    return trimmed;
  }
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([^&?\s]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return trimmed;
}

async function fetchVideoOEmbed(videoId: string) {
  try {
    const res = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {},
      5000
    );
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

function parseCaptionData(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      const snippets: { start: number; duration: number; text: string }[] = [];
      for (const event of data.events || []) {
        const text = stripTags(
          decodeHtmlEntities((event.segs || []).map((s: any) => s.utf8 || '').join(''))
        ).replace(/\s+/g, ' ').trim();
        if (text) {
          snippets.push({
            start: Math.round(((event.tStartMs || 0) / 1000) * 100) / 100,
            duration: Math.round(((event.dDurationMs || 0) / 1000) * 100) / 100,
            text,
          });
        }
      }
      return snippets;
    } catch {}
  }
  const snippets: { start: number; duration: number; text: string }[] = [];
  const tagRe = /<(text|p)([^>]*)>([\s\S]*?)<\/(?:text|p)>/g;
  let match;
  while ((match = tagRe.exec(raw)) !== null) {
    const tagName = match[1];
    const attrs = match[2];
    let start = 0;
    let duration = 0;
    if (tagName === 'p') {
      start = (parseFloat((attrs.match(/t="([^"]+)"/) || [])[1]) || 0) / 1000;
      duration = (parseFloat((attrs.match(/d="([^"]+)"/) || [])[1]) || 0) / 1000;
    } else {
      start = parseFloat((attrs.match(/start="([^"]+)"/) || [])[1]) || 0;
      duration = parseFloat((attrs.match(/dur="([^"]+)"/) || [])[1]) || 0;
    }
    const text = stripTags(decodeHtmlEntities(match[3])).replace(/\s+/g, ' ').trim();
    if (text) {
      snippets.push({
        start: Math.round(start * 100) / 100,
        duration: Math.round(duration * 100) / 100,
        text,
      });
    }
  }
  return snippets;
}

async function getTranscript(videoId: string, preferredLanguages?: string | string[]) {
  const oembed = await fetchVideoOEmbed(videoId);
  const languages = normalizeLanguages(preferredLanguages);
  let transcript: any;
  let language = "en";
  let languageCode = "en";
  let isGenerated = false;
  let snippets: { start: number; duration: number; text: string }[] = [];
  let lastError: any;
  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const result = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: languages[0],
    });
    transcript = result;
  } catch (error: any) {
    try {
      const { YoutubeTranscript } = await import("youtube-transcript");
      const result = await YoutubeTranscript.fetchTranscript(videoId);
      transcript = result;
    } catch (fallbackError) {
      lastError = error;
    }
  }
  if (transcript && Array.isArray(transcript)) {
    snippets = transcript.map((r: any) => ({
      start: Math.round(((r.offset || 0) / 1000) * 100) / 100,
      duration: Math.round(((r.duration || 0) / 1000) * 100) / 100,
      text: decodeHtmlEntities(r.text || '').replace(/\s+/g, ' ').trim(),
    })).filter((s: any) => Boolean(s.text));
  }
  if (snippets.length === 0) {
    const mirrors = [
      'https://inv.nadeko.net',
      'https://invidious.nerdvpn.de',
      'https://invidious.f5.si',
    ];
    for (const mirror of mirrors) {
      try {
        const capListRes = await fetchWithTimeout(`${mirror}/api/v1/captions/${videoId}`, {}, 5000);
        if (capListRes.ok) {
          const capList = await capListRes.json();
          if (Array.isArray(capList.captions) && capList.captions.length > 0) {
            let targetCap = capList.captions.find((c: any) => (c.languageCode || '').toLowerCase().startsWith(languages[0]));
            if (!targetCap) targetCap = capList.captions[0];
            if (targetCap && targetCap.url) {
              const url = targetCap.url.startsWith('http') ? targetCap.url : `${mirror}${targetCap.url}`;
              const subRes = await fetchWithTimeout(url, {}, 5000);
              if (subRes.ok) {
                const subText = await subRes.text();
                snippets = parseCaptionData(subText);
                if (snippets.length > 0) {
                  languageCode = targetCap.languageCode || languages[0];
                  language = targetCap.label || languageCode;
                  break;
                }
              }
            }
          }
        }
      } catch {}
    }
  }
  if (snippets.length === 0) {
    try {
      const { getSubtitles } = await import('youtube-caption-extractor');
      const res = await getSubtitles({ videoID: videoId, lang: languages[0] });
      if (res && res.length > 0) {
        snippets = res.map((r: any) => ({
          start: Math.round(parseFloat(r.start || '0') * 100) / 100,
          duration: Math.round(parseFloat(r.dur || '0') * 100) / 100,
          text: decodeHtmlEntities(r.text || '').replace(/\s+/g, ' ').trim(),
        })).filter((s: any) => Boolean(s.text));
      }
    } catch {}
  }
  if (snippets.length === 0) {
    if (lastError) throw lastError;
    throw new Error(`No subtitles or transcripts are available for video "${videoId}". Subtitles may be disabled by the creator, the video may be age-restricted/private, or YouTube requires manual browser verification.`);
  }
  const text = snippets.map((s: any) => s.text).join(' ');
  const title = (oembed && oembed.title) || `YouTube Video (${videoId})`;
  const author = (oembed && oembed.author_name) || null;
  const thumbnail = (oembed && oembed.thumbnail_url) || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return {
    videoId,
    title,
    author,
    thumbnail,
    language,
    languageCode,
    isGenerated,
    snippetCount: snippets.length,
    text,
    snippets,
    availableLanguages: [{ code: languageCode, name: language, generated: isGenerated }],
  };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
  
  app.use(express.json({ limit: '1mb' }));

  const handleTranscriptFetch = async (req: express.Request, res: express.Response) => {
    try {
      const { videoUrl, languages } = req.body || {};
      if (!videoUrl || !String(videoUrl).trim()) {
        return res.status(400).json({ success: false, error: 'videoUrl is required' });
      }
      const videoId = extractVideoId(videoUrl);
      if (!videoId || videoId.length < 5) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL or Video ID.' });
      }
      const cachedRecord = await db.select().from(transcripts).where(eq(transcripts.videoId, videoId)).get();
      if (cachedRecord) {
        return res.json({
          success: true,
          cached: true,
          data: cachedRecord,
        });
      }
      const transcriptData = await getTranscript(videoId, languages);
      const record = {
        videoId,
        title: transcriptData.title || videoUrl,
        author: transcriptData.author || '',
        thumbnail: transcriptData.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        language: transcriptData.language,
        content: transcriptData.text,
        createdAt: new Date(),
      };
      const inserted = await db.insert(transcripts).values(record).returning().get();
      return res.json({
        success: true,
        cached: false,
        data: inserted,
      });
    } catch (error: any) {
      const isKnownError = error?.message?.includes('Transcript is disabled') || error?.message?.includes('No subtitles');
      if (!isKnownError) {
        console.error('Transcript fetch error:', error);
      }
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleListTranscripts = async (_req: express.Request, res: express.Response) => {
    try {
      const list = await db.select().from(transcripts).orderBy(desc(transcripts.createdAt)).limit(50);
      return res.json({
        success: true,
        transcripts: list,
      });
    } catch (error) {
      console.error('List transcripts error:', error);
      return res.status(500).json({
        error: 'Failed to list transcripts',
      });
    }
  };

  app.post('/api/subconvert/fetch', handleTranscriptFetch);
  app.post('/api/fetch', handleTranscriptFetch);
  app.get('/api/subconvert/transcripts', handleListTranscripts);
  app.get('/api/transcripts', handleListTranscripts);
  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'linkerru-server' }));

  // --- Server-side caches for ultra-fast responses ---
  const SERVER_AI_CACHE = new Map<string, { content: string; ts: number; hits: number; model: string }>();
  const MAX_SERVER_CACHE = 500;
  const SERVER_CACHE_TTL_SMALL = 24 * 60 * 60 * 1000;
  const SERVER_CACHE_TTL_LARGE = 60 * 60 * 1000;
  const GEOIP_CACHE = new Map<string, { data: any; ts: number }>();
  const SEARCH_CACHE = new Map<string, { data: any; ts: number }>();

  function computeServerCacheKey(messages: any[]): string {
    try {
      const last = messages[messages.length - 1];
      const content = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content || '');
      const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
      let hash = 0;
      for (let i = 0; i < normalized.length; i++) {
        hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
      }
      return `ai_${hash}_${normalized.length}`;
    } catch {
      return `ai_${Date.now()}`;
    }
  }

  function getServerCache(key: string): { content: string; model: string } | null {
    const entry = SERVER_AI_CACHE.get(key);
    if (!entry) return null;
    const ttl = entry.content.length < 500 ? SERVER_CACHE_TTL_SMALL : SERVER_CACHE_TTL_LARGE;
    if (Date.now() - entry.ts > ttl) {
      SERVER_AI_CACHE.delete(key);
      return null;
    }
    entry.hits++;
    return { content: entry.content, model: entry.model };
  }

  function setServerCache(key: string, content: string, model: string) {
    if (SERVER_AI_CACHE.size >= MAX_SERVER_CACHE) {
      let oldestKey: string | undefined;
      let minScore = Infinity;
      for (const [k, v] of SERVER_AI_CACHE) {
        const score = v.hits * 100000 - v.ts;
        if (score < minScore) {
          minScore = score;
          oldestKey = k;
        }
      }
      if (oldestKey) SERVER_AI_CACHE.delete(oldestKey);
    }
    SERVER_AI_CACHE.set(key, { content, ts: Date.now(), hits: 1, model });
  }

  app.get('/api/geoip', async (req, res) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
      const cacheKey = clientIp || 'local';
      const cached = GEOIP_CACHE.get(cacheKey);
      if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
        return res.json(cached.data);
      }

      const isLocal = !clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');
      const url = isLocal ? 'https://freeipapi.com/api/json' : `https://freeipapi.com/api/json/${clientIp}`;
      const geoRes = await fetchWithTimeout(url, {}, 2500);
      if (geoRes.ok) {
        const data = await geoRes.json();
        if (data && data.cityName && data.latitude) {
          const result = {
            city: data.cityName,
            country: data.countryName || '',
            latitude: data.latitude,
            longitude: data.longitude,
            ip: data.ipAddress || clientIp,
          };
          GEOIP_CACHE.set(cacheKey, { data: result, ts: Date.now() });
          return res.json(result);
        }
      }
      const whoRes = await fetchWithTimeout(isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${clientIp}`, {}, 2500);
      if (whoRes.ok) {
        const data = await whoRes.json();
        if (data && data.success && data.city) {
          const result = {
            city: data.city,
            country: data.country || '',
            latitude: data.latitude,
            longitude: data.longitude,
            ip: data.ip || clientIp,
          };
          GEOIP_CACHE.set(cacheKey, { data: result, ts: Date.now() });
          return res.json(result);
        }
      }
      const fallback = {
        city: 'Москва',
        country: 'Россия',
        latitude: 55.7558,
        longitude: 37.6173,
        ip: clientIp || '127.0.0.1',
      };
      GEOIP_CACHE.set(cacheKey, { data: fallback, ts: Date.now() });
      return res.json(fallback);
    } catch (e) {
      return res.json({
        city: 'Москва',
        country: 'Россия',
        latitude: 55.7558,
        longitude: 37.6173,
        ip: '127.0.0.1',
      });
    }
  });

  app.get('/api/ai/search', async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      if (!query) {
        return res.status(400).json({ error: 'Query parameter q is required' });
      }

      const cacheKey = query.toLowerCase().slice(0, 80);
      const cached = SEARCH_CACHE.get(cacheKey);
      if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
        return res.json(cached.data);
      }
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const searchRes = await fetchWithTimeout(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ru,en;q=0.9',
        },
      }, 7000);
      const results: { title: string; url: string; snippet: string; domain: string }[] = [];
      if (searchRes.ok) {
        const html = await searchRes.text();
        const resultRegex = /<a class="result__url" href="([^"]+)"[\s\S]*?<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
        const titleRegex = /<a class="result__a" href="[^"]*">([\s\S]*?)<\/a>/gi;
        const rawTitles: string[] = [];
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
          const snippet = match[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').trim();
          const title = rawTitles[idx] || domain;
          if (rawUrl.startsWith('http') && snippet.length > 10) {
            results.push({ title, url: rawUrl, snippet, domain });
          }
          idx++;
        }
      }
      if (results.length === 0) {
        try {
          const ddgJson = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {}, 4000);
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
                  try { dom = new URL(topic.FirstURL).hostname.replace(/^www\./, ''); } catch {}
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
      return res.json(responseData);
    } catch (e: any) {
      console.warn('Search error:', e);
      return res.json({ query: req.query.q, count: 0, results: [] });
    }
  });

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
  const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';

  // Netlify AI Gateway — zero-config inference (env vars auto-injected at runtime).
  // The gateway key is a short-lived per-request JWT, so resolve credentials lazily.
  const envTrim = (name: string) => (process.env[name] || '').trim();
  const getGatewayCreds = (): { url: string; key: string } | null => {
    const openaiBase = envTrim('OPENAI_BASE_URL');
    const openaiKey = envTrim('OPENAI_API_KEY');
    const explicitBase = envTrim('NETLIFY_AI_GATEWAY_URL') || envTrim('NETLIFY_AI_GATEWAY_BASE_URL');
    const explicitKey = envTrim('NETLIFY_AI_GATEWAY_KEY');
    let base = explicitBase || (openaiKey ? openaiBase : '');
    const key = explicitKey || (openaiBase ? openaiKey : '');
    if (!base || !key) return null;
    base = base.replace(/\/+$/, '');
    const url = /\/v1$/.test(base) ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
    return { url, key };
  };
  const getOpenRouterUrl = () => {
    const base = envTrim('OPENROUTER_BASE_URL').replace(/\/+$/, '');
    if (!base) return 'https://openrouter.ai/api/v1/chat/completions';
    return /\/v1$/.test(base) ? `${base}/chat/completions` : `${base}/chat/completions`;
  };

  const GATEWAY_MODELS = [
    'gpt-5.5',
    'claude-sonnet-5',
    'gemini-3.8-flash',
    'gpt-5.4',
    'claude-opus-4-8',
    'deepseek/deepseek-v3.2',
  ];
  const GATEWAY_FAST_MODELS = ['gpt-5.4-nano', 'gpt-5.4-mini', 'gemini-3.8-flash', 'gemini-flash-lite-latest'];
  const GATEWAY_VISION_MODELS = ['gpt-5.4-mini', 'gemini-3.8-flash', 'qwen/qwen3-vl-235b-a22b-instruct', 'meta-llama/llama-4-scout'];
  // Live-web-search models (Perplexity Sonar via the gateway) for current-info queries.
  const GATEWAY_SEARCH_MODELS = ['perplexity/sonar-pro-search', 'perplexity/sonar', 'perplexity/sonar-pro'];

  app.get('/api/ai/warmup', async (req, res) => {
    const verifiedModels: string[] = [];
    const checkMessage = [{ role: 'user', content: 'Reply YES if you can hear me' }];
    try {
      const gw = getGatewayCreds();
      const gwProbe = gw
        ? fetchWithTimeout(gw.url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${gw.key}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ model: 'gpt-5.4-nano', messages: checkMessage, max_tokens: 10 }),
          }, 5000).then(async (r) => {
            if (r.ok) verifiedModels.push(...GATEWAY_MODELS);
          }).catch(() => {})
        : Promise.resolve();

      const cbProbe = CEREBRAS_API_KEY
        ? fetchWithTimeout('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: 'llama3.1-8b', messages: checkMessage, max_tokens: 10 }),
          }, 4000).then(async (r) => {
            if (r.ok) verifiedModels.push('llama3.1-8b', 'llama-3.3-70b');
          }).catch(() => {})
        : Promise.resolve();

      const orProbe = OPENROUTER_API_KEY
        ? fetchWithTimeout(getOpenRouterUrl(), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: 'openrouter/free', messages: checkMessage, max_tokens: 10 }),
          }, 5000).then(async (r) => {
            if (r.ok) verifiedModels.push('openrouter/free', 'meta-llama/llama-3.3-70b-instruct:free');
          }).catch(() => {})
        : Promise.resolve();

      const nvProbe = NVIDIA_API_KEY
        ? fetchWithTimeout('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NVIDIA_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: 'meta/llama-3.3-70b-instruct', messages: checkMessage, max_tokens: 10 }),
          }, 4500).then(async (r) => {
            if (r.ok) verifiedModels.push('meta/llama-3.3-70b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct');
          }).catch(() => {})
        : Promise.resolve();

      const groqProbe = GROQ_API_KEY
        ? fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: 'groq/compound-mini', messages: checkMessage, max_tokens: 10 }),
          }, 4000).then(async (r) => {
            if (r.ok) verifiedModels.push('groq/compound-mini', 'groq/compound', 'llama-3.3-70b-versatile');
          }).catch(() => {})
        : Promise.resolve();

      await Promise.allSettled([gwProbe, cbProbe, orProbe, nvProbe, groqProbe]);
      return res.json({ ok: true, verifiedModels, primaryEngine: 'Lroutev1 + AI Gateway' });
    } catch {
      return res.json({ ok: true, verifiedModels: ['groq/compound-mini', 'openrouter/free'], primaryEngine: 'Lroutev1' });
    }
  });

  const OPENROUTER_MODELS = [
    'openrouter/free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'inclusionai/ling-3.0-flash-vl:free',
    'deepseek/deepseek-r1:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'nvidia/nemotron-3-embed-1b:free',
  ];

  const CEREBRAS_MODELS = ['llama-3.3-70b', 'llama3.1-8b'];

  const GROQ_COMPOUND_MODELS = [
    'groq/compound-mini',
    'groq/compound',
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
  ];

  const NVIDIA_MODELS = [
    'meta/llama-3.3-70b-instruct',
    'deepseek-ai/deepseek-r1',
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'mistralai/mistral-large-2-instruct',
    'meta/llama-3.1-8b-instruct',
  ];

  const GROQ_MODELS = [
    'groq/compound-mini',
    'groq/compound',
    'llama-3.3-70b-versatile',
    'deepseek-r1-distill-llama-70b',
    'llama-3.1-8b-instant',
    'qwen-2.5-32b',
  ];

  function isSmallQuestion(messages: any[]): boolean {
    try {
      const last = messages[messages.length - 1];
      const content = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content || '');
      const clean = content.trim();
      return clean.length <= 200 && clean.split(/\s+/).length <= 28;
    } catch {
      return false;
    }
  }

  function isTinyQuestion(messages: any[]): boolean {
    try {
      const last = messages[messages.length - 1];
      const content = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content || '');
      const clean = content.trim();
      return clean.length <= 80 && clean.split(/\s+/).length <= 10;
    } catch {
      return false;
    }
  }

  const CURRENT_INFO_RE =
    /сейчас|на\s+данный\s+момент|на\s+сегодняшний\s+(день|момент)|сегодня|актуальн|свеж(и|е|ая|ие|ий)|новости|\bnews\b|\bcurrently\b|\bright\s+now\b|\bat\s+the\s+moment\b|\bas\s+of\s+now\b|\blatest\s+news\b|up[\s-]?to[\s-]?date/i;

  /** True when the last non-assistant/system message hints at CURRENT info (needs web search). */
  function hintsCurrentInfo(messages: any[]): boolean {
    try {
      const last = messages[messages.length - 1];
      if (!last || last.role === 'assistant' || last.role === 'system') return false;
      const content = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content || '');
      return CURRENT_INFO_RE.test(content);
    } catch {
      return false;
    }
  }

  function cleanModelOutput(text: string): string {
    if (!text) return '';
    let cleaned = text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .replace(/\[\/?THINKING\]/gi, '')
      .replace(/<tool_calls>[\s\S]*?<\/tool_calls>/gi, '')
      .replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, '');
    if (/^(?:we need to answer|the user wants|the user is asking|i should answer|i will provide|let's think about this):/i.test(cleaned.trim())) {
      const paragraphs = cleaned.split(/\n\s*\n/);
      if (paragraphs.length > 1) {
        const first = paragraphs[0];
        if (/we need to answer|the user|let's analyze|also mention/i.test(first)) {
          cleaned = paragraphs.slice(1).join('\n\n').trim();
        }
      }
    }
    return cleaned.trim();
  }

  app.post('/api/ai/chat', async (req, res) => {
    const start = Date.now();
    try {
      const { messages, model, temperature = 0.6, max_tokens = 4096 } = req.body || {};
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const hasImage = messages.some((m: any) =>
        Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url' || c.image_url)
      );

      const smallQuestion = isSmallQuestion(messages);
      const tinyQuestion = isTinyQuestion(messages);
      const currentInfo = hintsCurrentInfo(messages);
      const isCompoundRequested = model && typeof model === 'string' && model.includes('compound');
      const useCompoundTier = smallQuestion || currentInfo || isCompoundRequested;

      // --- Server-side cache check for instant response ---
      if (!hasImage) {
        const cacheKey = computeServerCacheKey(messages);
        const cached = getServerCache(cacheKey);
        if (cached) {
          console.log(`[AI Cache HIT] key=${cacheKey} hits=${SERVER_AI_CACHE.get(cacheKey)?.hits} in ${Date.now() - start}ms`);
          return res.json({
            success: true,
            provider: 'server-cache',
            model: cached.model,
            tier: -1,
            content: cached.content,
            cached: true,
            latencyMs: Date.now() - start,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // TIER -1: Netlify AI Gateway ⚙️ — zero-config primary engine (auto-injected creds)
      // ─────────────────────────────────────────────────────────────────────────────
      const gw = getGatewayCreds();
      // When the user hints at CURRENT information, prefer the Groq Compound tier
      // (built-in web search) over the plain gateway models; gateway stays as last resort.
      const gatewayDeferred = Boolean(gw && GROQ_API_KEY && !hasImage && currentInfo);
      const tryGateway = async (): Promise<{ content: string; model: string; usage: any } | null> => {
        if (!gw) return null;
        const gatewayModels = hasImage
          ? GATEWAY_VISION_MODELS
          : currentInfo
            ? GATEWAY_SEARCH_MODELS
            : smallQuestion || isCompoundRequested
              ? GATEWAY_FAST_MODELS
              : GATEWAY_MODELS;

        for (const gm of gatewayModels) {
          try {
            const gwRes = await fetchWithTimeout(gw.url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${gw.key}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                model: gm,
                messages,
                temperature: smallQuestion || currentInfo ? Math.min(temperature, 0.35) : temperature,
                max_tokens: Math.min(max_tokens, tinyQuestion ? 512 : smallQuestion ? 1024 : max_tokens),
              }),
            }, smallQuestion ? 10000 : 18000);
            if (!gwRes.ok) {
              const errText = (await gwRes.text().catch(() => '')).slice(0, 300);
              console.warn(`[Tier -1: AI Gateway] ${gm} -> HTTP ${gwRes.status} ${errText}`);
            }
            if (gwRes.ok) {
              const data = await gwRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                setServerCache(computeServerCacheKey(messages), text, gm);
                return { content: text, model: gm, usage: data?.usage };
              }
            }
          } catch (gwErr) {
            console.warn(`[Tier -1: AI Gateway] Model ${gm} failed, failing over:`, gwErr);
          }
        }
        return null;
      };
      if (gw && !gatewayDeferred) {
        const gwHit = await tryGateway();
        if (gwHit) {
          return res.json({
            success: true,
            provider: 'ai-gateway',
            model: gwHit.model,
            tier: -1,
            content: gwHit.content,
            usage: gwHit.usage,
            latencyMs: Date.now() - start,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // TIER 0: Groq Compound Mini ⚡ — For small questions (100-300 tokens, built-in search)
      // Optimized: racing + server cache save + ultra-fast timeout
      // ─────────────────────────────────────────────────────────────────────────────
      if (GROQ_API_KEY && !hasImage && useCompoundTier && (smallQuestion || currentInfo || isCompoundRequested)) {
        const compoundModels = isCompoundRequested
          ? [model, ...GROQ_COMPOUND_MODELS.filter(m => m !== model)]
          : GROQ_COMPOUND_MODELS;

        // For tiny questions, race first 2 models in parallel for speed
        if (tinyQuestion && compoundModels.length >= 2) {
          const racePromises = compoundModels.slice(0, 2).map(async (cm) => {
            const groqRes = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: cm,
                messages: messages.map((msg: any) => ({
                  role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
                  content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                })),
                temperature: 0.3,
                max_tokens: Math.min(max_tokens, tinyQuestion ? 512 : 1024),
              }),
            }, 7000);
            if (groqRes.ok) {
              const data = await groqRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) return { text, model: cm, usage: data?.usage };
            }
            throw new Error('no content');
          });

          try {
            const winner: any = await Promise.any(racePromises);
            if (winner?.text) {
              const cacheKey = computeServerCacheKey(messages);
              setServerCache(cacheKey, winner.text, winner.model);
              return res.json({
                success: true,
                provider: 'groq-compound-race',
                model: winner.model,
                tier: 0,
                content: winner.text,
                usage: winner.usage,
                latencyMs: Date.now() - start,
              });
            }
          } catch {
            // fallback to sequential
          }
        }

        for (const cm of compoundModels) {
          try {
            const groqRes = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: cm,
                messages: messages.map((msg: any) => ({
                  role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
                  content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                })),
                temperature: Math.min(temperature, tinyQuestion ? 0.3 : 0.35),
                max_tokens: Math.min(max_tokens, tinyQuestion ? 512 : smallQuestion ? 1024 : 2048),
              }),
            }, tinyQuestion ? 7000 : 9000);

            if (groqRes.ok) {
              const data = await groqRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                const cacheKey = computeServerCacheKey(messages);
                setServerCache(cacheKey, text, cm);
                return res.json({
                  success: true,
                  provider: 'groq-compound',
                  model: cm,
                  tier: 0,
                  content: text,
                  usage: data?.usage,
                  latencyMs: Date.now() - start,
                });
              }
            }
          } catch (err) {
            console.warn(`[Tier 0: Groq Compound] Model ${cm} failed, failing over:`, err);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // TIER 1: Cerebras 🚀 (Primary Workhorse: 2000+ tps, 1,000,000 daily free tokens)
      // Optimized: faster timeout, server cache save
      // ─────────────────────────────────────────────────────────────────────────────
      if (CEREBRAS_API_KEY && !hasImage) {
        // For small questions, race cerebras models in parallel
        if (smallQuestion && CEREBRAS_MODELS.length >= 2) {
          const race = CEREBRAS_MODELS.map(async (cm) => {
            const r = await fetchWithTimeout('https://api.cerebras.ai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${CEREBRAS_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: cm,
                messages: messages.map((msg: any) => ({
                  role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
                  content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                })),
                temperature: Math.min(temperature, 0.5),
                max_tokens: Math.min(max_tokens, 2048),
              }),
            }, 8000);
            if (r.ok) {
              const data = await r.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) return { text, model: cm, usage: data?.usage };
            }
            throw new Error('no');
          });
          try {
            const winner: any = await Promise.any(race);
            if (winner?.text) {
              setServerCache(computeServerCacheKey(messages), winner.text, winner.model);
              return res.json({ success: true, provider: 'cerebras-race', model: winner.model, tier: 1, content: winner.text, usage: winner.usage, latencyMs: Date.now() - start });
            }
          } catch {}
        }

        for (const cm of CEREBRAS_MODELS) {
          try {
            const cerebrasRes = await fetchWithTimeout('https://api.cerebras.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: cm,
                messages: messages.map((msg: any) => ({
                  role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
                  content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                })),
                temperature,
                max_tokens,
              }),
            }, smallQuestion ? 8000 : 10000);
            if (cerebrasRes.ok) {
              const data = await cerebrasRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                setServerCache(computeServerCacheKey(messages), text, cm);
                return res.json({
                  success: true,
                  provider: 'cerebras',
                  model: cm,
                  tier: 1,
                  content: text,
                  usage: data?.usage,
                  latencyMs: Date.now() - start,
                });
              }
            }
          } catch (cbErr) {
            console.warn(`[Tier 1: Cerebras] Model ${cm} failed, failing over:`, cbErr);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // TIER 2: Groq ⚡ (Second-tier Speed Fallback: 500,000 daily free tokens)
      // Optimized: faster timeout, cache save
      // ─────────────────────────────────────────────────────────────────────────────
      if (GROQ_API_KEY && !hasImage) {
        for (const gm of GROQ_MODELS) {
          try {
            const groqRes = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: gm,
                messages: messages.map((msg: any) => ({
                  role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
                  content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                })),
                temperature,
                max_tokens,
              }),
            }, smallQuestion ? 9000 : 12000);
            if (groqRes.ok) {
              const data = await groqRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                setServerCache(computeServerCacheKey(messages), text, gm);
                return res.json({
                  success: true,
                  provider: 'groq',
                  model: gm,
                  tier: 2,
                  content: text,
                  usage: data?.usage,
                  latencyMs: Date.now() - start,
                });
              }
            }
          } catch (gErr) {
            console.warn(`[Tier 2: Groq] Model ${gm} failed, failing over:`, gErr);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // TIER 3: NVIDIA NIM 🛡️ (Strategic Non-Expiring Credit Reserve)
      // ─────────────────────────────────────────────────────────────────────────────
      if (NVIDIA_API_KEY) {
        for (const nm of NVIDIA_MODELS) {
          try {
            const nvRes = await fetchWithTimeout('https://integrate.api.nvidia.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: nm,
                messages: messages.map((msg: any) => ({
                  role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
                  content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                })),
                temperature,
                max_tokens,
              }),
            }, smallQuestion ? 12000 : 15000);
            if (nvRes.ok) {
              const data = await nvRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                setServerCache(computeServerCacheKey(messages), text, nm);
                return res.json({
                  success: true,
                  provider: 'nvidia',
                  model: nm,
                  tier: 3,
                  content: text,
                  usage: data?.usage,
                  latencyMs: Date.now() - start,
                });
              }
            }
          } catch (nvErr) {
            console.warn(`[Tier 3: NVIDIA NIM] Model ${nm} failed, failing over:`, nvErr);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // TIER 4: OpenRouter 🛑 (Doomsday / Last-Resort Fallback: 50 requests/day)
      // ─────────────────────────────────────────────────────────────────────────────
      if (OPENROUTER_API_KEY) {
        const openRouterModel = model && model.includes('/') ? model : 'openrouter/free';
        const modelsToTry = [
          openRouterModel,
          ...OPENROUTER_MODELS.filter((m) => m !== openRouterModel),
        ];
        for (const m of modelsToTry) {
          try {
            const orRes = await fetchWithTimeout(getOpenRouterUrl(), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://linkerru.local',
                'X-Title': 'LinkerRu Lisyan AI',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ model: m, messages, temperature, max_tokens }),
            }, smallQuestion ? 15000 : 20000);
            if (orRes.ok) {
              const data = await orRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                setServerCache(computeServerCacheKey(messages), text, m);
                return res.json({
                  success: true,
                  provider: 'openrouter',
                  model: m,
                  tier: 4,
                  content: text,
                  usage: data?.usage,
                  latencyMs: Date.now() - start,
                });
              }
            }
          } catch (orErr) {
            console.warn(`[Tier 4: OpenRouter] Model ${m} failed:`, orErr);
          }
        }
      }

      // Last resort: gateway was deferred for a current-info prompt but compound failed.
      if (gatewayDeferred) {
        const gwHit = await tryGateway();
        if (gwHit) {
          return res.json({
            success: true,
            provider: 'ai-gateway',
            model: gwHit.model,
            tier: -1,
            content: gwHit.content,
            usage: gwHit.usage,
            latencyMs: Date.now() - start,
          });
        }
      }

      const configured = [gw && 'ai-gateway', GROQ_API_KEY && 'groq', CEREBRAS_API_KEY && 'cerebras', NVIDIA_API_KEY && 'nvidia', OPENROUTER_API_KEY && 'openrouter'].filter(Boolean);
      const detail = configured.length
        ? `Providers tried: ${configured.join(', ')}`
        : 'No AI provider configured: set GROQ_API_KEY / CEREBRAS_API_KEY / NVIDIA_API_KEY / OPENROUTER_API_KEY (or deploy on Netlify with AI Gateway).';
      console.error('[ai-chat] all providers failed:', detail);
      return res.status(503).json({
        error: 'All AI providers and free models are temporarily unavailable. Please try again in a few seconds.',
        detail,
      });
    } catch (e: any) {
      console.error('AI chat endpoint fatal error:', e);
      return res.status(500).json({ error: e?.message || 'Internal AI service error' });
    }
  });

  const GITHUB_REPO = 'LisyanDEWS/LinkerLauncher';
  let cachedBuildInfo: { buildVersion: string; buildDate: string; sha: string } | null = null;
  let cachedCommits: any[] | null = null;
  let cacheTime = 0;
  const CACHE_TTL = 30 * 1000;

  async function fetchGitHubCommits(): Promise<any[]> {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=30`;
    const res = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'LinkerRu-Server',
      },
    }, 10000);
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    return await res.json() as any[];
  }

  function formatBuildDate(dateStr: string): string {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  async function getBuildInfo() {
    if (cachedBuildInfo && Date.now() - cacheTime < CACHE_TTL) return cachedBuildInfo;
    const commits = await fetchGitHubCommits();
    const latest = commits[0];
    const dateStr = latest?.commit?.author?.date || latest?.commit?.committer?.date || new Date().toISOString();
    cachedBuildInfo = {
      buildVersion: `v${formatBuildDate(dateStr)}`,
      buildDate: formatBuildDate(dateStr),
      sha: latest?.sha?.slice(0, 7) || 'unknown',
    };
    cacheTime = Date.now();
    cachedCommits = commits;
    return cachedBuildInfo;
  }

  app.get('/api/build-info', async (_req, res) => {
    try {
      const info = await getBuildInfo();
      res.json(info);
    } catch (err) {
      res.status(200).json({ buildVersion: 'v--', buildDate: '--', sha: 'unknown' });
    }
  });

  app.get('/api/changelog', async (_req, res) => {
    try {
      if (cachedCommits && Date.now() - cacheTime < CACHE_TTL) {
        res.json(cachedCommits);
        return;
      }
      const commits = await fetchGitHubCommits();
      cachedCommits = commits;
      cacheTime = Date.now();
      res.json(commits);
    } catch (err) {
      if (cachedCommits && cachedCommits.length > 0) {
        res.json(cachedCommits);
      } else {
        res.status(200).json([]);
      }
    }
  });

  const commitDetailCache = new Map<string, { data: any; time: number }>();
  app.get('/api/changelog/commit/:sha', async (req, res) => {
    try {
      const sha = req.params.sha;
      const cached = commitDetailCache.get(sha);
      if (cached && Date.now() - cached.time < 300000) {
        res.json(cached.data);
        return;
      }
      const url = `https://api.github.com/repos/${GITHUB_REPO}/commits/${sha}`;
      const apiRes = await fetchWithTimeout(url, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'LinkerRu-Server',
        },
      }, 10000);
      if (!apiRes.ok) throw new Error(`GitHub API returned ${apiRes.status}`);
      const data = await apiRes.json();
      commitDetailCache.set(sha, { data, time: Date.now() });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch commit detail' });
    }
  });

  const rooms = new Map<string, Set<WebSocket>>();
  wss.on("connection", (ws) => {
    let roomId: string | null = null;
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === "join") {
          roomId = data.roomId;
          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId)!.add(ws);
        }
        if (roomId) {
          const clients = rooms.get(roomId);
          if (clients) {
            for (const client of clients) {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
              }
            }
          }
        }
      } catch (e) {}
    });
    ws.on("close", () => {
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId)!.delete(ws);
        if (rooms.get(roomId)!.size === 0) rooms.delete(roomId);
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  console.log('Server starting on port:', PORT);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
