// Shared AI provider plumbing for the Netlify Functions version of the
// Lisyan AI backend (mirrors the /api/ai/* routes in server.ts).

const DEFAULT_TIMEOUT_MS = 12000;
const CHAT_DEADLINE_MS = 52000;

// In-memory LRU cache for Netlify functions (shared within warm instance)
const SERVER_CACHE = new Map();
const MAX_SERVER_CACHE = 300;
const SERVER_CACHE_TTL_SMALL = 24 * 60 * 60 * 1000;
const SERVER_CACHE_TTL_LARGE = 60 * 60 * 1000;

function computeCacheKey(messages) {
  try {
    const last = messages[messages.length - 1];
    const content = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content || '');
    const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
    return `ai_${hash}_${normalized.length}`;
  } catch { return `ai_${Date.now()}`; }
}

function getServerCache(key) {
  const entry = SERVER_CACHE.get(key);
  if (!entry) return null;
  const ttl = entry.content.length < 500 ? SERVER_CACHE_TTL_SMALL : SERVER_CACHE_TTL_LARGE;
  if (Date.now() - entry.ts > ttl) { SERVER_CACHE.delete(key); return null; }
  entry.hits++;
  return entry;
}

function setServerCache(key, content, model) {
  if (SERVER_CACHE.size >= MAX_SERVER_CACHE) {
    let oldestKey; let minScore = Infinity;
    for (const [k, v] of SERVER_CACHE) {
      const score = v.hits * 100000 - v.ts;
      if (score < minScore) { minScore = score; oldestKey = k; }
    }
    if (oldestKey) SERVER_CACHE.delete(oldestKey);
  }
  SERVER_CACHE.set(key, { content, ts: Date.now(), hits: 1, model });
}

export const OPENROUTER_MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'inclusionai/ling-3.0-flash-vl:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'nvidia/nemotron-3-embed-1b:free',
];

export const CEREBRAS_MODELS = ['llama-3.3-70b', 'llama3.1-8b'];

export const GROQ_COMPOUND_MODELS = [
  'groq/compound-mini',
  'groq/compound',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
];

export const GROQ_MODELS = [
  'groq/compound-mini',
  'groq/compound',
  'llama-3.3-70b-versatile',
  'deepseek-r1-distill-llama-70b',
  'llama-3.1-8b-instant',
  'qwen-2.5-32b',
];

export const NVIDIA_MODELS = [
  'meta/llama-3.3-70b-instruct',
  'deepseek-ai/deepseek-r1',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'mistralai/mistral-large-2-instruct',
  'meta/llama-3.1-8b-instruct',
];

// Netlify AI Gateway — zero-config inference (env vars auto-injected at runtime).
// NOTE: the gateway rejects requests without an explicit Accept header.
const GATEWAY_KEY = (process.env.NETLIFY_AI_GATEWAY_KEY || '').trim();
const GATEWAY_BASE = (process.env.NETLIFY_AI_GATEWAY_BASE_URL || '').trim().replace(/\/+$/, '');
export const AI_GATEWAY_URL = GATEWAY_BASE ? `${GATEWAY_BASE}/chat/completions` : '';

export const GATEWAY_MODELS = [
  'gpt-4.1-mini',
  'gemini-flash-latest',
  'gpt-4.1',
  'deepseek/deepseek-chat-v3.1',
  'gemini-2.5-flash',
  'openai/gpt-oss-120b',
];

export const GATEWAY_FAST_MODELS = [
  'gpt-4.1-nano',
  'gemini-2.5-flash-lite',
  'gpt-4.1-mini',
];

export const GATEWAY_VISION_MODELS = [
  'gpt-4.1-mini',
  'gemini-flash-latest',
  'meta-llama/llama-4-scout',
  'qwen/qwen2.5-vl-72b-instruct',
];

const GATEWAY_HEADERS = { Accept: 'application/json' };

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function cleanModelOutput(text) {
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

export function providerKeys() {
  return {
    gateway: AI_GATEWAY_URL && GATEWAY_KEY ? GATEWAY_KEY : '',
    cerebras: (process.env.CEREBRAS_API_KEY || '').trim(),
    groq: (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '').trim(),
    nvidia: (process.env.NVIDIA_API_KEY || '').trim(),
    openrouter: (process.env.OPENROUTER_API_KEY || '').trim(),
    gemini: (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim(),
  };
}

export function providerBases() {
  return {
    groq: process.env.GROQ_API_BASE || 'https://api.groq.com/openai/v1',
    openrouter: process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1',
    cerebras: process.env.CEREBRAS_API_BASE || 'https://api.cerebras.ai/v1',
    nvidia: process.env.NVIDIA_API_BASE || 'https://integrate.api.nvidia.com/v1',
    gemini: process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/openai',
  };
}

export function hasAnyProviderKey(keys = providerKeys()) {
  return Boolean(keys.cerebras || keys.groq || keys.nvidia || keys.openrouter || keys.gemini);
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...CORS_HEADERS,
    },
  });
}

export function preflightResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function flattenMessages(messages) {
  return messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
  }));
}

function hasImageContent(messages) {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c) => c.type === 'image_url' || c.image_url)
  );
}

function isSmallQuestion(messages) {
  try {
    const last = messages[messages.length - 1];
    const content = typeof last?.content === 'string' ? last.content : '';
    const clean = content.trim();
    return clean.length <= 200 && clean.split(/\s+/).length <= 28;
  } catch { return false; }
}

function isTinyQuestion(messages) {
  try {
    const last = messages[messages.length - 1];
    const content = typeof last?.content === 'string' ? last.content : '';
    const clean = content.trim();
    return clean.length <= 80 && clean.split(/\s+/).length <= 10;
  } catch { return false; }
}

const TIERS = [
  {
    name: 'ai-gateway',
    tier: 0,
    key: 'gateway',
    endpoint: AI_GATEWAY_URL,
    models: (requested, isSmall) => {
      if (requested && requested.includes('compound')) return GATEWAY_FAST_MODELS;
      if (isSmall) return GATEWAY_FAST_MODELS;
      return GATEWAY_MODELS;
    },
    timeout: 18000,
    skipOnImage: false,
    flatten: false,
    headers: GATEWAY_HEADERS,
  },
  {
    name: 'groq-compound',
    tier: 1,
    key: 'groq',
    endpoint: '',
    models: (requested, isSmall) => {
      if (requested && (requested.includes('compound') || isSmall)) {
        return [requested, ...GROQ_COMPOUND_MODELS.filter(m => m !== requested)];
      }
      return GROQ_COMPOUND_MODELS;
    },
    timeout: 8000,
    skipOnImage: true,
    flatten: true,
    onlyForSmall: true,
  },
  {
    name: 'cerebras',
    tier: 2,
    key: 'cerebras',
    endpoint: '',
    models: () => CEREBRAS_MODELS,
    timeout: 9000,
    skipOnImage: true,
    flatten: true,
  },
  {
    name: 'groq',
    tier: 3,
    key: 'groq',
    endpoint: '',
    models: () => GROQ_MODELS,
    timeout: 11000,
    skipOnImage: true,
    flatten: true,
  },
  {
    name: 'nvidia',
    tier: 4,
    key: 'nvidia',
    endpoint: '',
    models: () => NVIDIA_MODELS,
    timeout: 14000,
    skipOnImage: false,
    flatten: true,
  },
  {
    name: 'openrouter',
    tier: 5,
    key: 'openrouter',
    endpoint: '',
    timeout: 18000,
    skipOnImage: false,
    flatten: false,
    headers: { 'HTTP-Referer': 'https://linkerru.local', 'X-Title': 'LinkerRu Lisyan AI' },
    models: (requested) => {
      const preferred = requested && requested.includes('/') ? requested : 'openrouter/free';
      return [preferred, ...OPENROUTER_MODELS.filter((m) => m !== preferred)];
    },
  },
  {
    name: 'gemini',
    tier: 5,
    key: 'gemini',
    endpoint: '',
    models: () => ['gemini-2.0-flash', 'gemini-2.5-flash'],
    timeout: 12000,
    skipOnImage: false,
    flatten: false,
  },
];

export async function runChatCompletion({ messages, model, temperature = 0.6, maxTokens = 4096 }) {
  const keys = providerKeys();
  const startedAt = Date.now();
  const withImage = hasImageContent(messages);
  const small = isSmallQuestion(messages);
  const tiny = isTinyQuestion(messages);
  const isCompoundRequested = model && model.includes('compound');

  // Server-side cache check — instant
  if (!withImage) {
    const cacheKey = computeCacheKey(messages);
    const cached = getServerCache(cacheKey);
    if (cached) {
      return {
        provider: 'server-cache',
        model: cached.model,
        tier: -1,
        content: cached.content,
        usage: { cached: true, hits: cached.hits },
      };
    }
  }

  const bases = providerBases();

  for (const tier of TIERS) {
    const apiKey = keys[tier.key];
    if (!apiKey) continue;
    if (withImage && tier.skipOnImage) continue;
    if (tier.onlyForSmall && !small && !isCompoundRequested) continue;

    const endpoint = tier.name === 'gemini'
      ? `${bases.gemini}/chat/completions`
      : tier.endpoint || `${bases[tier.key]}/chat/completions`;
    const modelsList = tier.models(model, small);

    // For tiny questions, race first 2 models in parallel for speed
    if (tiny && modelsList.length >= 2 && tier.tier <= 1) {
      const racePromises = modelsList.slice(0, 2).map(async (modelName) => {
        const remaining = CHAT_DEADLINE_MS - (Date.now() - startedAt);
        if (remaining < 2500) throw new Error('deadline');
        const res = await fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              ...(tier.headers || {}),
            },
            body: JSON.stringify({
              model: modelName,
              messages: tier.flatten ? flattenMessages(messages) : messages,
              temperature: Math.min(temperature, 0.35),
              max_tokens: Math.min(maxTokens, tiny ? 512 : 1024),
            }),
          },
          Math.min(tier.timeout, remaining)
        );
        if (!res.ok) throw new Error('not ok');
        const data = await res.json();
        const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
        if (text) return { provider: tier.name + '-race', model: modelName, tier: tier.tier, content: text, usage: data?.usage };
        throw new Error('empty');
      });

      try {
        const winner = await Promise.any(racePromises);
        if (winner?.content) {
          setServerCache(computeCacheKey(messages), winner.content, winner.model);
          return winner;
        }
      } catch {}
    }

    for (const modelName of modelsList) {
      const remaining = CHAT_DEADLINE_MS - (Date.now() - startedAt);
      if (remaining < 2500) {
        console.warn(`[ai-chat] deadline reached before ${tier.name}/${modelName}`);
        return null;
      }

      try {
        const res = await fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              ...(tier.headers || {}),
            },
            body: JSON.stringify({
              model: modelName,
              messages: tier.flatten ? flattenMessages(messages) : messages,
              temperature: (small || modelName.includes('compound')) ? Math.min(temperature, 0.35) : temperature,
              max_tokens: tiny ? Math.min(maxTokens, 512) : small ? Math.min(maxTokens, 1024) : maxTokens,
            }),
          },
          Math.min(tier.timeout, remaining)
        );

        if (!res.ok) continue;

        const data = await res.json();
        const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
        if (text) {
          setServerCache(computeCacheKey(messages), text, modelName);
          return {
            provider: tier.name,
            model: modelName,
            tier: tier.tier,
            content: text,
            usage: data?.usage,
          };
        }
      } catch (err) {
        console.warn(`[Tier ${tier.tier}: ${tier.name}] ${modelName} failed, failing over:`, err?.message || err);
      }
    }
  }

  return null;
}

export async function probeProviders() {
  const keys = providerKeys();
  const verifiedModels = [];
  const checkMessage = [{ role: 'user', content: 'Reply YES if you can hear me' }];

  const probes = [
    keys.gateway &&
      fetchWithTimeout(
        AI_GATEWAY_URL,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.gateway}`, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ model: 'gpt-4.1-nano', messages: checkMessage, max_tokens: 10 }),
        },
        5000
      )
        .then((r) => { if (r.ok) verifiedModels.push(...GATEWAY_MODELS); })
        .catch(() => {}),
    keys.cerebras &&
      fetchWithTimeout(
        `${providerBases().cerebras}/chat/completions`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.cerebras}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama3.1-8b', messages: checkMessage, max_tokens: 10 }),
        },
        4000
      )
        .then((r) => { if (r.ok) verifiedModels.push('llama3.1-8b', 'llama-3.3-70b'); })
        .catch(() => {}),
    keys.openrouter &&
      fetchWithTimeout(
        `${providerBases().openrouter}/chat/completions`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.openrouter}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'openrouter/free', messages: checkMessage, max_tokens: 10 }),
        },
        5000
      )
        .then((r) => { if (r.ok) verifiedModels.push('openrouter/free', 'meta-llama/llama-3.3-70b-instruct:free'); })
        .catch(() => {}),
    keys.nvidia &&
      fetchWithTimeout(
        `${providerBases().nvidia}/chat/completions`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.nvidia}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'meta/llama-3.3-70b-instruct', messages: checkMessage, max_tokens: 10 }),
        },
        4500
      )
        .then((r) => { if (r.ok) verifiedModels.push('meta/llama-3.3-70b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct'); })
        .catch(() => {}),
    keys.groq &&
      fetchWithTimeout(
        `${providerBases().groq}/chat/completions`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.groq}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'groq/compound-mini', messages: checkMessage, max_tokens: 10 }),
        },
        3000
      )
        .then((r) => { if (r.ok) verifiedModels.push('groq/compound-mini', 'groq/compound', 'llama-3.3-70b-versatile'); })
        .catch(() => {}),
    keys.gemini &&
    fetchWithTimeout(
      `${providerBases().gemini}/chat/completions`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${keys.gemini}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.0-flash', messages: checkMessage, max_tokens: 10 }),
      },
      4000
    )
      .then((r) => { if (r.ok) verifiedModels.push('gemini-2.0-flash', 'gemini-2.5-flash'); })
      .catch(() => {}),
  ].filter(Boolean);

  await Promise.allSettled(probes);
  return verifiedModels;
}
