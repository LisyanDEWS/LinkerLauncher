import { jsonResponse, preflightResponse, runChatCompletion, hasAnyProviderKey, providerKeys } from '../lib/aiProviders.mjs';

export const config = {
  path: '/api/ai/chat',
  method: ['POST', 'OPTIONS'],
};

export default async (req) => {
  if (req.method === 'OPTIONS') return preflightResponse();

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const { messages, model, temperature = 0.6, max_tokens: maxTokens = 4096 } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse(400, { error: 'Messages array is required' });
  }

  try {
    const result = await runChatCompletion({
      messages,
      model,
      temperature,
      maxTokens,
    });

    if (result) return jsonResponse(200, { success: true, ...result });

    if (!hasAnyProviderKey(providerKeys())) {
      return jsonResponse(503, {
        error: 'AI provider keys are not configured on the server. Set GEMINI_API_KEY, GROQ_API_KEY or OPENROUTER_API_KEY in your host environment (see .env.example).',
        code: 'no_provider_keys',
      });
    }

    return jsonResponse(503, {
      error: 'All AI providers and free models are temporarily unavailable. Please try again in a few seconds.',
      code: 'providers_unavailable',
    });
  } catch (err) {
    console.error('AI chat function fatal error:', err);
    return jsonResponse(500, { error: err?.message || 'Internal AI service error' });
  }
};
