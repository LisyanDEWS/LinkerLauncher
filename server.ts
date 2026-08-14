import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { createServer as createViteServer } from 'vite';

const DEFAULT_LANGUAGES = ['ru', 'en'];
const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const INNERTUBE_PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player';
const ANDROID_CLIENT_VERSION = '20.40.39';
const USER_AGENT = 'com.google.android.youtube/' + ANDROID_CLIENT_VERSION + ' (Linux; U; Android 14) gzip';
const REQUEST_TIMEOUT_MS = 15000;

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

function extractVideoId(input: string) {
  const value = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return value;
}

async function fetchPlayerData(videoId: string) {
  const response = await fetchWithTimeout(
    INNERTUBE_PLAYER_URL + '?key=' + INNERTUBE_API_KEY + '&prettyPrint=false',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'X-YouTube-Client-Name': '3',
        'X-YouTube-Client-Version': ANDROID_CLIENT_VERSION,
        'Origin': 'https://www.youtube.com',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: ANDROID_CLIENT_VERSION,
            androidSdkVersion: 34,
            hl: 'en',
          },
        },
        videoId: videoId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('YouTube refused the request (HTTP ' + response.status + ').');
  }
  return response.json();
}

function getTrackName(track: any) {
  if (!track || !track.name) return 'Unknown';
  if (typeof track.name === 'string') return track.name;
  if (track.name.simpleText) return track.name.simpleText;
  if (track.name.runs && track.name.runs.length && track.name.runs[0].text) {
    return track.name.runs[0].text;
  }
  return 'Unknown';
}

function pickTrack(tracks: any[], preferredLanguages: string[]) {
  const manual = tracks.filter((t) => t.kind !== 'asr');
  const pool = manual.length > 0 ? manual : tracks;

  const matches = (track: any, lang: string) => {
    const code = (track.languageCode || '').toLowerCase();
    return code === lang || code.indexOf(lang + '-') === 0;
  };

  for (const lang of preferredLanguages) {
    const found = pool.find((t: any) => matches(t, lang));
    if (found) return found;
  }
  return pool[0];
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
            start: (event.tStartMs || 0) / 1000,
            duration: (event.dDurationMs || 0) / 1000,
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
    if (text) snippets.push({ start, duration, text });
  }

  return snippets;
}

async function getTranscript(videoId: string, preferredLanguages?: string | string[]) {
  const playerData = await fetchPlayerData(videoId);

  const playability = playerData.playabilityStatus;
  if (playability && playability.status && playability.status !== 'OK') {
    throw new Error('This video is unavailable: ' + (playability.reason || playability.status));
  }

  const captions = playerData.captions && playerData.captions.playerCaptionsTracklistRenderer;
  const tracks = (captions && captions.captionTracks) || [];
  if (tracks.length === 0) {
    throw new Error(
      'No subtitles are available for this video. They may be disabled, or the video could be age/region restricted.'
    );
  }

  const track = pickTrack(tracks, normalizeLanguages(preferredLanguages));

  const captionResponse = await fetchWithTimeout(track.baseUrl + '&fmt=json3', {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8' },
  });

  if (!captionResponse.ok) {
    throw new Error('Could not download the subtitle data (HTTP ' + captionResponse.status + ').');
  }
  const raw = await captionResponse.text();

  const snippets = parseCaptionData(raw);
  if (snippets.length === 0) {
    throw new Error('The subtitle file was empty or could not be parsed.');
  }

  return {
    videoId,
    title: (playerData.videoDetails && playerData.videoDetails.title) || null,
    author: (playerData.videoDetails && playerData.videoDetails.author) || null,
    channelId: (playerData.videoDetails && playerData.videoDetails.channelId) || null,
    lengthSeconds: (playerData.videoDetails && playerData.videoDetails.lengthSeconds) || null,
    viewCount: (playerData.videoDetails && playerData.videoDetails.viewCount) || null,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    language: getTrackName(track),
    languageCode: track.languageCode || 'unknown',
    isGenerated: track.kind === 'asr',
    snippetCount: snippets.length,
    text: snippets.map((s) => s.text).join(' '),
    snippets,
    availableLanguages: tracks.map((t: any) => ({
      code: t.languageCode || '',
      name: getTrackName(t),
      generated: t.kind === 'asr',
    })),
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
      const videoUrl = req.body?.videoUrl;
      if (!videoUrl || !String(videoUrl).trim()) {
        return res.status(400).json({ success: false, error: 'Please provide a "videoUrl".' });
      }

      const videoId = extractVideoId(videoUrl);
      if (!videoId || videoId.length < 5) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL or Video ID.' });
      }

      const transcript = await getTranscript(videoId, req.body?.languages);
      return res.json({ success: true, data: transcript });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error?.message || 'Failed to fetch the transcript.',
      });
    }
  };

  app.post('/api/subconvert/fetch', handleTranscriptFetch);
  app.post('/api/fetch', handleTranscriptFetch);
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

