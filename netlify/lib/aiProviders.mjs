// Shared AI provider plumbing for the Netlify Functions version of the
// Lisyan AI backend (mirrors the /api/ai/* routes in server.ts).

const DEFAULT_TIMEOUT_MS = 12000;

// Netlify kills synchronous functions at 60s — stay under that hard cap so the
// caller always gets a JSON answer instead of a platform timeout page.
const CHAT_DEADLINE_MS = 52000;

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

export const NVIDIA_MODELS = [
  'meta/llama-3.3-70b-instruct',
  'deepseek-ai/deepseek-r1',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'mistralai/mistral-large-2-instruct',
  'meta/llama-3.1-8b-instruct',
];

export const GROQ_MODELS = ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b', 'qwen-2.5-32b'];

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

export function providerKeys() {
  return {
    cerebras: (process.env.CEREBRAS_API_KEY || '').trim(),
    groq: (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '').trim(),
    nvidia: (process.env.NVIDIA_API_KEY || '').trim(),
    openrouter: (process.env.OPENROUTER_API_KEY || '').trim(),
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

function hasImageContent(messages) {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c) => c.type === 'image_url' || c.image_url)
  );
}

const TIERS = [
  {
    name: 'cerebras',
    tier: 1,
    key: 'cerebras',
    endpoint: 'https://api.cerebras.ai/v1/chat/completions',
    models: () => CEREBRAS_MODELS,
    timeout: 12000,
    skipOnImage: true,
    flatten: true,
  },
  {
    name: 'groq',
    tier: 2,
    key: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: () => GROQ_MODELS,
    timeout: 14000,
    skipOnImage: true,
    flatten: true,
  },
  {
    name: 'nvidia',
    tier: 3,
    key: 'nvidia',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    models: () => NVIDIA_MODELS,
    timeout: 18000,
    skipOnImage: false,
    flatten: true,
  },
  {
    name: 'openrouter',
    tier: 4,
    key: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    timeout: 25000,
    skipOnImage: false,
    flatten: false,
    headers: { 'HTTP-Referer': 'https://linkerru.local', 'X-Title': 'LinkerRu Lisyan AI' },
    models: (requested) => {
      const preferred = requested && requested.includes('/') ? requested : 'openrouter/free';
      return [preferred, ...OPENROUTER_MODELS.filter((m) => m !== preferred)];
    },
  },
];

/**
 * Runs the same tiered failover chain as the Express server:
 * Cerebras -> Groq -> NVIDIA NIM -> OpenRouter.
 * Resolves to `{ provider, model, tier, content, usage }` or `null`.
 */
export async function runChatCompletion({ messages, model, temperature = 0.6, maxTokens = 4096 }) {
  const keys = providerKeys();
  const startedAt = Date.now();
  const withImage = hasImageContent(messages);

  for (const tier of TIERS) {
    const apiKey = keys[tier.key];
    if (!apiKey) continue;
    if (withImage && tier.skipOnImage) continue;

    for (const modelName of tier.models(model)) {
      const remaining = CHAT_DEADLINE_MS - (Date.now() - startedAt);
      if (remaining < 2500) {
        console.warn(`[ai-chat] deadline reached before ${tier.name}/${modelName}`);
        return null;
      }

      try {
        const res = await fetchWithTimeout(
          tier.endpoint,
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
              temperature,
              max_tokens: maxTokens,
            }),
          },
          Math.min(tier.timeout, remaining)
        );

        if (!res.ok) continue;

        const data = await res.json();
        const text = cleanModelOutput(data?.choices?.[0]?.message?.content || '');
        if (text) {
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

/**
 * Lightweight liveness probe used by the first-run warmup.
 */
export async function probeProviders() {
  const keys = providerKeys();
  const verifiedModels = [];
  const checkMessage = [{ role: 'user', content: 'Reply YES if you can hear me' }];

  const probes = [
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
        .then((r) => {
          if (r.ok) verifiedModels.push('llama3.1-8b', 'llama-3.3-70b');
        })
        .catch(() => {}),
    keys.openrouter &&
      fetchWithTimeout(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.openrouter}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'openrouter/free', messages: checkMessage, max_tokens: 10 }),
        },
        5000
      )
        .then((r) => {
          if (r.ok) verifiedModels.push('openrouter/free', 'meta-llama/llama-3.3-70b-instruct:free');
        })
        .catch(() => {}),
    keys.nvidia &&
      fetchWithTimeout(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.nvidia}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'meta/llama-3.3-70b-instruct',
            messages: checkMessage,
            max_tokens: 10,
          }),
        },
        4500
      )
        .then((r) => {
          if (r.ok) verifiedModels.push('meta/llama-3.3-70b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct');
        })
        .catch(() => {}),
    keys.groq &&
      fetchWithTimeout(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.groq}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama3.1-8b-instant', messages: checkMessage, max_tokens: 10 }),
        },
        4000
      )
        .then((r) => {
          if (r.ok) verifiedModels.push('llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b');
        })
        .catch(() => {}),
  ].filter(Boolean);

  await Promise.allSettled(probes);
  return verifiedModels;
}
