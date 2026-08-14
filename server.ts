import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
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
  const wss = new WebSocketServer({ server });
  
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
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

