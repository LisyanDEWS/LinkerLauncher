import { jsonResponse, preflightResponse, runChatCompletion } from '../lib/aiProviders.mjs';

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

    const detail = runChatCompletion.lastError || '';
    console.error('[ai-chat] all providers failed:', detail);
    return jsonResponse(503, {
      error: 'All AI providers and free models are temporarily unavailable. Please try again in a few seconds.',
      detail,
    });
  } catch (err) {
    console.error('AI chat function fatal error:', err);
    return jsonResponse(500, { error: err?.message || 'Internal AI service error' });
  }
};
