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
// IMPORTANT: the gateway key is a short-lived JWT (~60s) injected per request, so
// credentials MUST be resolved at request time — never cached at module scope.
// NOTE: the gateway rejects requests without an explicit Accept header.
function envTrim(name) {
  return (process.env[name] || '').trim();
}

function joinUrl(base, path) {
  return `${base.replace(/\/+$/, '')}${path}`;
}

/** OpenAI-compatible chat/completions endpoint on the Netlify AI Gateway (if available). */
export function gatewayCredentials() {
  const openaiBase = envTrim('OPENAI_BASE_URL');
  const openaiKey = envTrim('OPENAI_API_KEY');
  const explicitBase = envTrim('NETLIFY_AI_GATEWAY_URL') || envTrim('NETLIFY_AI_GATEWAY_BASE_URL');
  const explicitKey = envTrim('NETLIFY_AI_GATEWAY_KEY');

  let base = explicitBase || (openaiKey ? openaiBase : '');
  const key = explicitKey || (openaiBase ? openaiKey : '');
  if (!base || !key) return null;

  base = base.replace(/\/+$/, '');
  // The OpenAI-compatible route lives under /v1. Tolerate bases that already end in /v1.
  const url = /\/v1$/.test(base) ? `${base}/chat/completions` : joinUrl(base, '/v1/chat/completions');
  return { url, key };
}

/** OpenRouter endpoint: Netlify may inject a gateway-issued key + base URL; never send that key to openrouter.ai. */
export function openRouterCredentials() {
  const key = envTrim('OPENROUTER_API_KEY');
  if (!key) return null;
  const base = envTrim('OPENROUTER_BASE_URL');
  const url = base
    ? (/\/v1$/.test(base) ? `${base}/chat/completions` : joinUrl(base, '/chat/completions'))
    : 'https://openrouter.ai/api/v1/chat/completions';
  return { url, key, viaGateway: Boolean(base) };
}

// Kept for backwards compatibility with existing imports (resolved lazily).
export const AI_GATEWAY_URL = '';

export const GATEWAY_MODELS = [
  'gpt-5.5',
  'claude-sonnet-5',
  'gemini-3.8-flash',
  'gpt-5.4',
  'claude-opus-4-8',
  'deepseek/deepseek-v3.2',
];

export const GATEWAY_FAST_MODELS = [
  'gpt-5.4-nano',
  'gpt-5.4-mini',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
];

export const GATEWAY_VISION_MODELS = [
  'gpt-5.4-mini',
  'gemini-3.8-flash',
  'qwen/qwen3-vl-235b-a22b-instruct',
  'meta-llama/llama-4-scout',
];

// Live-web-search models (Perplexity Sonar via the gateway) for current-info queries.
export const GATEWAY_SEARCH_MODELS = [
  'perplexity/sonar-pro-search',
  'perplexity/sonar',
  'perplexity/sonar-pro',
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
  const gw = gatewayCredentials();
  const or = openRouterCredentials();
  return {
    gateway: gw ? gw.key : '',
    gatewayUrl: gw ? gw.url : '',
    cerebras: envTrim('CEREBRAS_API_KEY'),
    groq: envTrim('GROQ_API_KEY') || envTrim('VITE_GROQ_API_KEY'),
    nvidia: envTrim('NVIDIA_API_KEY'),
    openrouter: or ? or.key : '',
    openrouterUrl: or ? or.url : '',
  };
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

const CURRENT_INFO_RE = /сейчас|на\s+данный\s+момент|на\s+сегодняшний\s+(день|момент)|сегодня|актуальн|свеж(и|е|ая|ие|ий)|новости|\bnews\b|\bcurrently\b|\bright\s+now\b|\bat\s+the\s+moment\b|\bas\s+of\s+now\b|\blatest\s+news\b|up[\s-]?to[\s-]?date/i;

function hasImageContent(messages) {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c) => c.type === 'image_url' || c.image_url)
  );
}

/** True when the last user message hints at CURRENT information (needs web search). */
function hintsCurrentInfo(messages) {
  try {
    const last = messages[messages.length - 1];
    if (!last || last.role === 'assistant' || last.role === 'system') return false;
    const content = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content || '');
    return CURRENT_INFO_RE.test(content);
  } catch { return false; }
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
    endpoint: (keys) => keys.gatewayUrl,
    models: (requested, isSmall, withImage, currentInfo) => {
      if (withImage) return GATEWAY_VISION_MODELS;
      if (currentInfo) return GATEWAY_SEARCH_MODELS;
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
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: (requested) => {
      if (requested && requested.includes('compound')) {
        return [requested, ...GROQ_COMPOUND_MODELS.filter(m => m !== requested)];
      }
      return GROQ_COMPOUND_MODELS;
    },
    timeout: 8000,
    skipOnImage: true,
    flatten: true,
    onlyForSmall: true,
    alsoForCurrentInfo: true,
  },
  {
    name: 'cerebras',
    tier: 2,
    key: 'cerebras',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    models: () => CEREBRAS_MODELS,
    timeout: 9000,
    skipOnImage: true,
    flatten: true,
  },
  {
    name: 'groq',
    tier: 3,
    key: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: () => GROQ_MODELS,
    timeout: 11000,
    skipOnImage: true,
    flatten: true,
  },
  {
    name: 'nvidia',
    tier: 4,
    key: 'nvidia',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    models: () => NVIDIA_MODELS,
    timeout: 14000,
    skipOnImage: false,
    flatten: true,
  },
  {
    name: 'openrouter',
    tier: 5,
    key: 'openrouter',
    endpoint: (keys) => keys.openrouterUrl,
    timeout: 18000,
    skipOnImage: false,
    flatten: false,
    headers: { 'HTTP-Referer': 'https://linkerru.local', 'X-Title': 'LinkerRu Lisyan AI' },
    models: (requested) => {
      const preferred = requested && requested.includes('/') ? requested : 'openrouter/free';
      return [preferred, ...OPENROUTER_MODELS.filter((m) => m !== preferred)];
    },
  },
];

export async function runChatCompletion({ messages, model, temperature = 0.6, maxTokens = 4096 }) {
  const keys = providerKeys();
  const startedAt = Date.now();
  const withImage = hasImageContent(messages);
  const small = isSmallQuestion(messages);
  const tiny = isTinyQuestion(messages);
  const currentInfo = hintsCurrentInfo(messages);
  const isCompoundRequested = model && model.includes('compound');
  let lastError = '';
  let triedAny = false;

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

  // When the user hints at CURRENT information, prefer the Groq Compound tier
  // (built-in web search) over the plain gateway models.
  const tierOrder = currentInfo && keys.groq
    ? [TIERS.find((t) => t.name === 'groq-compound'), ...TIERS.filter((t) => t.name !== 'groq-compound')]
    : TIERS;

  for (const tier of tierOrder) {
    const apiKey = keys[tier.key];
    if (!apiKey) continue;
    if (withImage && tier.skipOnImage) continue;
    if (tier.onlyForSmall && !small && !isCompoundRequested && !(tier.alsoForCurrentInfo && currentInfo)) continue;
    const endpoint = typeof tier.endpoint === 'function' ? tier.endpoint(keys) : tier.endpoint;
    if (!endpoint) continue;

    const modelsList = tier.models(model, small, withImage, currentInfo);
    triedAny = true;

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

        if (!res.ok) {
          const errText = (await res.text().catch(() => '')).slice(0, 300);
          lastError = `${tier.name}/${modelName}: HTTP ${res.status} ${errText}`;
          console.warn(`[Tier ${tier.tier}: ${tier.name}] ${modelName} -> ${lastError}`);
          continue;
        }

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
        lastError = `${tier.name}/${modelName}: ${err?.message || err}`;
        console.warn(`[Tier ${tier.tier}: ${tier.name}] ${modelName} failed, failing over:`, err?.message || err);
      }
    }
  }

  if (!triedAny) {
    lastError = 'No AI provider configured: set NETLIFY AI Gateway (auto) or GROQ_API_KEY / CEREBRAS_API_KEY / NVIDIA_API_KEY / OPENROUTER_API_KEY.';
  }
  runChatCompletion.lastError = lastError;
  return null;
}

export async function probeProviders() {
  const keys = providerKeys();
  const verifiedModels = [];
  const checkMessage = [{ role: 'user', content: 'Reply YES if you can hear me' }];

  const probes = [
    keys.gateway &&
      fetchWithTimeout(
        keys.gatewayUrl,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.gateway}`, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ model: 'gpt-5.4-nano', messages: checkMessage, max_tokens: 10 }),
        },
        5000
      )
        .then((r) => { if (r.ok) verifiedModels.push(...GATEWAY_MODELS); })
        .catch(() => {}),
    keys.cerebras &&
      fetchWithTimeout(
        'https://api.cerebras.ai/v1/chat/completions',
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
        keys.openrouterUrl,
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
        'https://integrate.api.nvidia.com/v1/chat/completions',
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
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.groq}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'groq/compound-mini', messages: checkMessage, max_tokens: 10 }),
        },
        3000
      )
        .then((r) => { if (r.ok) verifiedModels.push('groq/compound-mini', 'groq/compound', 'llama-3.3-70b-versatile'); })
        .catch(() => {}),
  ].filter(Boolean);

  await Promise.allSettled(probes);
  return verifiedModels;
}
