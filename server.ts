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
  // If it's already just an ID, return it
  if (!/[/?]/.test(trimmed)) {
    return trimmed;
  }

  // Extract from various YouTube URL formats
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
  } catch {
    // ignore
  }
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
    } catch {
      // Fall through to XML
    }
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

  // Fallback Strategy: Invidious
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
      } catch {
        // Try next mirror
      }
    }
  }

  // Fallback Strategy: youtube-caption-extractor
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
    } catch {
      // Proceed
    }
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

  // --- SUBCONVERT API ENDPOINTS ---
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

      // Check if we already have this transcript cached
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

  // --- IP GEOLOCATION ENDPOINT (No browser permission prompt) ---
  app.get('/api/geoip', async (req, res) => {
    try {
      // 1. Try free IP API
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
      const isLocal = !clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');

      const url = isLocal ? 'https://freeipapi.com/api/json' : `https://freeipapi.com/api/json/${clientIp}`;
      const geoRes = await fetchWithTimeout(url, {}, 4000);
      if (geoRes.ok) {
        const data = await geoRes.json();
        if (data && data.cityName && data.latitude) {
          return res.json({
            city: data.cityName,
            country: data.countryName || '',
            latitude: data.latitude,
            longitude: data.longitude,
            ip: data.ipAddress || clientIp,
          });
        }
      }

      // Fallback to ipwho.is
      const whoRes = await fetchWithTimeout(isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${clientIp}`, {}, 4000);
      if (whoRes.ok) {
        const data = await whoRes.json();
        if (data && data.success && data.city) {
          return res.json({
            city: data.city,
            country: data.country || '',
            latitude: data.latitude,
            longitude: data.longitude,
            ip: data.ip || clientIp,
          });
        }
      }

      // Default fallback if offline
      return res.json({
        city: 'Москва',
        country: 'Россия',
        latitude: 55.7558,
        longitude: 37.6173,
        ip: clientIp || '127.0.0.1',
      });
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

  // --- WEB / GOOGLE SEARCH PROXY (Live search with structured source pills) ---
  app.get('/api/ai/search', async (req, res) => {
    try {
      const query = (req.query.q as string || '').trim();
      if (!query) {
        return res.status(400).json({ error: 'Query parameter q is required' });
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
            results.push({
              title,
              url: rawUrl,
              snippet,
              domain,
            });
          }
          idx++;
        }
      }

      // Fallback: Instant Wikipedia / DuckDuckGo API if HTML scraping was light
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

      return res.json({
        query,
        count: results.length,
        results,
      });
    } catch (e: any) {
      console.warn('Search error:', e);
      return res.json({ query: req.query.q, count: 0, results: [] });
    }
  });

  // --- LISYAN AI SERVER-SIDE CHAT (OpenRouter + Cerebras + NVIDIA NIM + Groq from environment variables) ---
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
  const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';

  // --- LISYAN AI MODEL WARMUP & HEALTH CHECK (Silent first-run probe) ---
  app.get('/api/ai/warmup', async (req, res) => {
    const verifiedModels: string[] = [];
    const checkMessage = [{ role: 'user', content: 'Reply YES if you can hear me' }];

    try {
      // Fast probe Cerebras if key configured
      const cbProbe = CEREBRAS_API_KEY
        ? fetchWithTimeout('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama3.1-8b',
              messages: checkMessage,
              max_tokens: 10,
            }),
          }, 4000).then(async (r) => {
            if (r.ok) verifiedModels.push('llama3.1-8b', 'llama-3.3-70b');
          }).catch(() => {})
        : Promise.resolve();

      // Fast probe OpenRouter if key configured
      const orProbe = OPENROUTER_API_KEY
        ? fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openrouter/free',
              messages: checkMessage,
              max_tokens: 10,
            }),
          }, 5000).then(async (r) => {
            if (r.ok) verifiedModels.push('openrouter/free', 'meta-llama/llama-3.3-70b-instruct:free');
          }).catch(() => {})
        : Promise.resolve();

      // Fast probe NVIDIA NIM if key configured
      const nvProbe = NVIDIA_API_KEY
        ? fetchWithTimeout('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NVIDIA_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'meta/llama-3.3-70b-instruct',
              messages: checkMessage,
              max_tokens: 10,
            }),
          }, 4500).then(async (r) => {
            if (r.ok) verifiedModels.push('meta/llama-3.3-70b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct');
          }).catch(() => {})
        : Promise.resolve();

      await Promise.allSettled([cbProbe, orProbe, nvProbe]);

      return res.json({
        ok: true,
        verifiedModels,
        primaryEngine: 'Lroutev1',
      });
    } catch {
      return res.json({ ok: true, verifiedModels: ['openrouter/free'], primaryEngine: 'Lroutev1' });
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

  const CEREBRAS_MODELS = [
    'llama-3.3-70b',
    'llama3.1-8b',
  ];

  const NVIDIA_MODELS = [
    'meta/llama-3.3-70b-instruct',
    'deepseek-ai/deepseek-r1',
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'mistralai/mistral-large-2-instruct',
    'meta/llama-3.1-8b-instruct',
  ];

  const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'deepseek-r1-distill-llama-70b',
    'qwen-2.5-32b',
  ];

  function cleanModelOutput(text: string): string {
    if (!text) return '';
    let cleaned = text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .replace(/\[\/?THINKING\]/gi, '');

    // Strip meta-reasoning ramblings (e.g., "We need to answer: ... The user wants ...")
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
    try {
      const { messages, model, temperature = 0.6, max_tokens = 4096, stream = false } = req.body || {};
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      // Check if request contains image attachments for Vision handling
      const hasImage = messages.some((m: any) =>
        Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url' || c.image_url)
      );

      // ─────────────────────────────────────────────────────────────────────────────
      // TIER 1: Cerebras 🚀 (Primary Workhorse: 2000+ tps, 1,000,000 daily free tokens)
      // ─────────────────────────────────────────────────────────────────────────────
      if (CEREBRAS_API_KEY && !hasImage) {
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
            }, 12000);

            if (cerebrasRes.ok) {
              const data = await cerebrasRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                return res.json({
                  success: true,
                  provider: 'cerebras',
                  model: cm,
                  tier: 1,
                  content: text,
                  usage: data?.usage,
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
            }, 14000);

            if (groqRes.ok) {
              const data = await groqRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                return res.json({
                  success: true,
                  provider: 'groq',
                  model: gm,
                  tier: 2,
                  content: text,
                  usage: data?.usage,
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
            }, 18000);

            if (nvRes.ok) {
              const data = await nvRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                return res.json({
                  success: true,
                  provider: 'nvidia',
                  model: nm,
                  tier: 3,
                  content: text,
                  usage: data?.usage,
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
            const orRes = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://linkerru.local',
                'X-Title': 'LinkerRu Lisyan AI',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: m,
                messages,
                temperature,
                max_tokens,
              }),
            }, 25000);

            if (orRes.ok) {
              const data = await orRes.json();
              const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
              if (text) {
                return res.json({
                  success: true,
                  provider: 'openrouter',
                  model: m,
                  tier: 4,
                  content: text,
                  usage: data?.usage,
                });
              }
            }
          } catch (orErr) {
            console.warn(`[Tier 4: OpenRouter] Model ${m} failed:`, orErr);
          }
        }
      }

      return res.status(503).json({
        error: 'All AI providers and free models are temporarily unavailable. Please try again in a few seconds.',
      });
    } catch (e: any) {
      console.error('AI chat endpoint fatal error:', e);
      return res.status(500).json({ error: e?.message || 'Internal AI service error' });
    }
  });

  // --- BUILD INFO & CHANGELOG (GitHub commits) ---
  const GITHUB_REPO = 'LisyanDEWS/LinkerLauncher';
  let cachedBuildInfo: { buildVersion: string; buildDate: string; sha: string } | null = null;
  let cachedCommits: any[] | null = null;
  let cacheTime = 0;
  const CACHE_TTL = 30 * 1000; // 30 seconds

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

  // Build info endpoint (fast — cached, fetched at first request)
  app.get('/api/build-info', async (_req, res) => {
    try {
      const info = await getBuildInfo();
      res.json(info);
    } catch (err) {
      res.status(200).json({ buildVersion: 'v--', buildDate: '--', sha: 'unknown' });
    }
  });

  // Changelog endpoint — returns formatted commits
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

  // Single commit detail endpoint
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

  // --- LISYAN CONNECT WEB SOCKET SIGNALING ---
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

  // --- VITE DEV MIDDLEWARE (React) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
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

