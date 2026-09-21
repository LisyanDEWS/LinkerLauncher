import type { Message, ModelId } from "../types";
import { getModel } from "../data/models";
import { Language } from "../../../types";
import { normalizeText, detectInstantRuleResponse } from "./optimizer/textCompressor";
import { buildOptimizedContext } from "./optimizer/contextManager";
import { routeRequest, calculateAdaptiveMaxTokens } from "./optimizer/smartRouter";
import { getCachedResponse, saveCachedResponse } from "./optimizer/cacheEngine";
import { recordOptimizationEvent } from "./optimizer/statsTracker";

const GROQ_API_KEY =
  ((import.meta as any).env?.VITE_GROQ_API_KEY || "").trim();
const GROQ_URL =
  ((import.meta as any).env?.VITE_GROQ_URL || "https://api.groq.com/openai/v1/chat/completions").trim();

const MAX_RETRY_WAIT_SEC = 65;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseRetryAfter(message: string, headerValue?: string | null): number | null {
  if (headerValue) {
    const n = parseFloat(headerValue);
    if (!Number.isNaN(n)) return n;
  }
  const m = message.match(/try again in\s+([\d.]+)\s*m?s?/i);
  if (m) {
    const raw = m[1];
    const isMinutes = /m(?!s)/i.test(message.slice(m.index ?? 0, (m.index ?? 0) + m[0].length + 2));
    const val = parseFloat(raw);
    return isMinutes ? val * 60 : val;
  }
  return null;
}

const SYSTEM_PROMPTS: Record<ModelId, Record<Language, string>> = {
  lnv1: {
    ru: "Вы — Lisyan AI (LNv1), быстрый и лаконичный персональный ассистент. Отвечайте четко, грамотно и по делу на русском языке.",
    uk: "Ви — Lisyan AI (LNv1), швидкий та лаконічний персональний асистент. Відповідайте чітко, грамотно та по суті українською мовою.",
    en: "You are Lisyan AI (LNv1), a smart and concise personal assistant. Provide accurate, helpful, and concise responses in English.",
  },
  lv1pro: {
    ru: "Вы — Lisyan AI Pro (Lv1 Pro), продвинутый интеллектуальный ассистент. Предоставляйте подробные, структурированные ответы, пишите качественный код с пояснениями.",
    uk: "Ви — Lisyan AI Pro (Lv1 Pro), просунутий інтелектуальний асистент. Надавайте детальні, структуровані відповіді, пишіть якісний код із поясненнями.",
    en: "You are Lisyan AI Pro (Lv1 Pro), an advanced intelligent assistant. Provide detailed, well-structured explanations and write clean, robust code when requested.",
  },
  lvision: {
    ru: "Вы — Lisyan AI Vision (Lv1 Vision), ассистент с компьютерным зрением. Внимательно анализируйте прикрепленные изображения, графику и текст на них.",
    uk: "Ви — Lisyan AI Vision (Lv1 Vision), асистент із комп'ютерним зором. Уважно аналізуйте прикріплені зображення, графіку та текст на них.",
    en: "You are Lisyan AI Vision (Lv1 Vision), an assistant with visual understanding. Carefully analyze attached images and visual details.",
  },
};

const FALLBACKS: Record<ModelId, string[]> = {
  lnv1: ["groq/compound-mini", "openai/gpt-oss-20b", "openai/gpt-oss-120b"],
  lv1pro: ["openai/gpt-oss-120b", "groq/compound", "groq/compound-mini"],
  lvision: ["qwen/qwen3.8-27b", "groq/compound-mini"],
};

function extractText(payload: any): string {
  const c = payload?.choices?.[0];
  const text =
    c?.message?.content ?? c?.delta?.content ?? (typeof payload === "string" ? payload : undefined);
  if (typeof text === "string" && text.trim()) return text;
  if (typeof c?.message?.reasoning === "string" && c.message.reasoning.trim()) {
    return c.message.reasoning;
  }
  if (payload?.error) throw new Error(payload.error.message || JSON.stringify(payload.error));
  throw new Error("Empty response from AI model");
}

async function callGroq(
  apiModel: string,
  apiMessages: any[],
  temperature: number,
  maxCompletionTokens: number,
  signal?: AbortSignal,
) {
  if (!GROQ_API_KEY) {
    throw new Error(
      "Missing VITE_GROQ_API_KEY environment variable. Please configure it in your Netlify or environment settings."
    );
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      model: apiModel,
      messages: apiMessages,
      temperature,
      max_completion_tokens: maxCompletionTokens,
    }),
  });

  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    /* not json */
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    raw,
    retryAfter: response.headers.get("retry-after"),
  };
}

export async function sendChatRequest(
  messages: Message[],
  modelId: ModelId,
  lang: Language = "ru",
  signal?: AbortSignal,
  onNotice?: (text: string) => void,
): Promise<string> {
  const startTime = Date.now();
  const latestMessage = messages[messages.length - 1];
  const latestPrompt = latestMessage?.content || "";
  const attachments = latestMessage?.attachments || [];
  const imageAttachment = attachments.find((a) => a.isImage && a.dataUrl);

  // 1. Check for Instant Non-LLM Handlers (courtesy, date/time, math, greetings)
  const instantResult = detectInstantRuleResponse(latestPrompt, lang);
  if (instantResult && !imageAttachment && attachments.length === 0) {
    const origTokens = Math.ceil(latestPrompt.length / 3.8) + 120;
    recordOptimizationEvent({
      originalTokens: origTokens,
      optimizedTokens: 0,
      tokensSaved: origTokens,
      isInstantRule: true,
      latencySavedMs: 1400,
    });
    return instantResult.content;
  }

  // 2. Check Smart Routing & Adaptive max_tokens
  const routing = routeRequest(latestPrompt, attachments, modelId);
  const activeModelId = routing.modelId;
  const info = getModel(activeModelId);
  const vision = Boolean(info.vision || activeModelId === "lvision");

  if (routing.isAutomaticRoute && onNotice) {
    onNotice(routing.reason);
  }

  // 3. Multi-Tier Cache Check (RAM -> LocalStorage -> Firebase Firestore -> Perceptual Image dHash)
  const cached = await getCachedResponse(
    latestPrompt,
    activeModelId,
    lang,
    imageAttachment?.dataUrl
  );

  if (cached && !signal?.aborted) {
    const elapsed = Date.now() - startTime;
    const origTokens = Math.ceil((latestPrompt.length + 300) / 3.8);
    recordOptimizationEvent({
      originalTokens: origTokens,
      optimizedTokens: 0,
      tokensSaved: origTokens,
      isCacheHit: true,
      latencySavedMs: Math.max(800, 1800 - elapsed),
    });
    return cached.entry.response;
  }

  // 4. Build Optimized Context (Prune junk, compress history into SUMMARY + RECENT, RAG chunk search)
  const systemPrompt =
    SYSTEM_PROMPTS[activeModelId]?.[lang] || SYSTEM_PROMPTS[activeModelId]?.en || "You are Lisyan AI.";

  const contextResult = buildOptimizedContext(
    messages,
    activeModelId,
    systemPrompt,
    lang,
    vision
  );

  const adaptiveMaxTokens = routing.maxCompletionTokens;

  // 5. Send optimized payload with fallback models
  const candidates = [info.apiModel, ...FALLBACKS[activeModelId].filter((m) => m !== info.apiModel)];
  let lastError = "Failed to fetch response";
  let waitedOnce = false;

  for (const candidate of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const { ok, status, data, raw, retryAfter } = await callGroq(
        candidate,
        contextResult.apiMessages,
        info.temperature,
        adaptiveMaxTokens,
        signal,
      );

      if (ok) {
        const responseText = extractText(data ?? raw).trim();

        // 6. Save to multi-layer cache (RAM, LocalStorage, Firestore)
        saveCachedResponse(
          latestPrompt,
          responseText,
          activeModelId,
          lang,
          contextResult.tokensSaved,
          imageAttachment?.dataUrl
        ).catch(() => {});

        // 7. Record optimization stats
        const latencySaved = Math.max(200, Math.round(contextResult.tokensSaved * 2.5));
        recordOptimizationEvent({
          originalTokens: contextResult.originalTokenEstimate,
          optimizedTokens: contextResult.optimizedTokenEstimate,
          tokensSaved: contextResult.tokensSaved,
          usedSummary: contextResult.usedSummary,
          usedRag: attachments.some((a) => a.textContent),
          latencySavedMs: latencySaved,
        });

        return responseText;
      }

      const msg = data?.error?.message || raw || `HTTP ${status}`;
      lastError = `${status}: ${msg}`;

      if (status === 429) {
        const wait = parseRetryAfter(msg, retryAfter);
        if (wait !== null && wait <= MAX_RETRY_WAIT_SEC && !waitedOnce && attempt === 0) {
          waitedOnce = true;
          const sec = Math.ceil(wait) + 1;
          const waitMsg =
            lang === "ru"
              ? `Лимит запросов. Ожидание ${sec} с...`
              : lang === "uk"
                ? `Ліміт запитів. Очікування ${sec} с...`
                : `Rate limit reached. Waiting ${sec}s...`;
          onNotice?.(waitMsg);
          await sleep(sec * 1000);
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
          continue;
        }
        break;
      }

      const recoverable =
        status === 404 ||
        status === 403 ||
        status === 400 ||
        /does not exist|do not have access|decommissioned|deprecated|image|vision/i.test(msg);
      if (!recoverable) throw new Error(lastError);
      break;
    }
  }

  throw new Error(lastError);
}
