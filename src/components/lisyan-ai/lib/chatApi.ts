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

const SYSTEM_PROMPTS: Record<ModelId, Record<Language, string>> = {
  lnv1: {
    ru: `Вы — Lisyan AI, умный, четкий и полезный персональный ассистент LinkerRu.
ПРАВИЛА:
1. Давайте прямой, содержательный ответ без лишней «воды», без внутренних рассуждений и без шаблонных вводных фраз («Вот ответ:», «We need to answer:»).
2. Всегда отвечайте на том же языке, на котором обратился пользователь.
3. При запросе таблиц, сопоставлений или списков всегда оформляйте стандартные валидные Markdown-таблицы (| Заголовок 1 | Заголовок 2 | с разделителем |---|---|).
4. Большие тексты анализируйте полностью, выделяя главные тезисы и структуру.
5. Для вопросов по учебе, тестам или контрольным формулируйте естественные, понятные человеку ответы без механических клише.`,
    uk: `Ви — Lisyan AI, розумний, чіткий і корисний персональний асистент LinkerRu.
ПРАВИЛА:
1. Давайте пряму, змістовну відповідь без зайвої «води», внутрішніх міркувань та шаблонних вступних фраз.
2. Завжди відповідайте тією ж мовою, якою звернувся користувач.
3. При запиті таблиць завжди використовуйте стандартні валідні Markdown-таблиці (| Заголовок 1 | Заголовок 2 |).
4. Великі тексти аналізуйте повністю, виділяючи головні тези та структуру.`,
    en: `You are Lisyan AI, a direct, highly capable personal assistant in LinkerRu.
RULES:
1. Provide a direct, crystal-clear answer with zero fluff, no meta-reasoning ramblings, and no filler intros.
2. Always reply in the exact language used by the user.
3. For comparisons or structured data, always use clean, standard Markdown tables (| Col 1 | Col 2 | with |---|---|).
4. When processing large texts, analyze the full input thoroughly and deliver a structured, complete response.
5. For academic, test or exam questions, write clearly and naturally like a human expert.`,
  },
  lv1pro: {
    ru: `Вы — Lisyan AI Pro, флагманский интеллектуальный ассистент LinkerRu.
ПРАВИЛА:
1. Давайте глубокие, точные и структурированные ответы без пустой «воды» и внутренних рассуждений.
2. Всегда отвечайте на том же языке, на котором пишет пользователь.
3. При запросе таблиц, аналитики, сравнений всегда используйте чистый синтаксис Markdown-таблиц.
4. При работе со сложным кодом пишите чистый, современный код с краткими пояснениями.
5. При анализе больших объемов текста и документов обрабатывайте материал целиком без усечений.
6. Для тестов и контрольных отвечайте емко, по-человечески и по существу.`,
    uk: `Ви — Lisyan AI Pro, флагманський інтелектуальний асистент LinkerRu.
ПРАВИЛА:
1. Надавайте глибокі, точні та структуровані відповіді без порожньої «води» та внутрішніх міркувань.
2. Завжди відповідайте тією ж мовою, якою пише користувач.
3. При запиті таблиць, аналітики або порівнянь завжди використовуйте чистий синтаксис Markdown-таблиць.
4. При роботі зі складним кодом пишіть чистий сучасний код із короткими поясненнями.
5. Великі тексти та документи аналізуйте повністю без урізань.`,
    en: `You are Lisyan AI Pro, the flagship intelligent assistant in LinkerRu.
RULES:
1. Provide comprehensive, direct, and structured answers with zero fluff and no meta-reasoning leakages.
2. Always reply in the exact language used by the user.
3. For structured data or comparisons, always format standard Markdown tables.
4. For programming tasks, produce clean, robust, modern code with clear explanations.
5. For large texts and documents, process the entire content without arbitrary truncation.
6. For exams and tests, explain naturally and logically like a human tutor.`,
  },
  lvision: {
    ru: `Вы — Lisyan AI Vision, ассистент с компьютерным зрением LinkerRu.
ПРАВИЛА:
1. Внимательно анализируйте изображения, скриншоты, схемы и текст на них.
2. Давайте прямой, четкий ответ на том же языке, на котором обратился пользователь.`,
    uk: `Ви — Lisyan AI Vision, асистент із комп'ютерним зором LinkerRu.
ПРАВИЛА:
1. Уважно аналізуйте зображення, скріншоти, схеми та текст на них.
2. Давайте пряму, чітку відповідь тією ж мовою, якою звернувся користувач.`,
    en: `You are Lisyan AI Vision, a visual intelligence assistant in LinkerRu.
RULES:
1. Thoroughly analyze images, screenshots, diagrams, and OCR text.
2. Provide direct, concise answers in the language used by the user.`,
  },
};

const FALLBACKS: Record<ModelId, string[]> = {
  lnv1: ["llama-3.3-70b", "llama-3.3-70b-versatile", "meta/llama-3.3-70b-instruct", "llama3.1-8b", "openrouter/free"],
  lv1pro: ["llama-3.3-70b", "deepseek-r1-distill-llama-70b", "meta/llama-3.3-70b-instruct", "deepseek-ai/deepseek-r1", "meta-llama/llama-3.3-70b-instruct:free", "openrouter/free"],
  lvision: ["inclusionai/ling-3.0-flash-vl:free", "meta/llama-3.2-11b-vision-instruct", "google/gemini-2.0-flash-exp:free", "openrouter/free"],
};

/**
 * Silent background warmup: on first launch tests models with "Reply YES if you can hear me"
 * and marks responsive models so users get immediate zero-latency answers.
 */
export async function initLrouteWarmup(): Promise<void> {
  try {
    const warmed = sessionStorage.getItem('linkerru_lroute_warmed');
    if (warmed) return;

    fetch('/api/ai/warmup')
      .then((r) => r.json())
      .then((data) => {
        if (data?.verifiedModels) {
          sessionStorage.setItem('linkerru_lroute_warmed', 'true');
          sessionStorage.setItem('linkerru_verified_models', JSON.stringify(data.verifiedModels));
        }
      })
      .catch(() => {});
  } catch {}
}

// Auto-trigger warmup in background
if (typeof window !== 'undefined') {
  setTimeout(initLrouteWarmup, 1000);
}

export async function fetchWebSearch(query: string): Promise<{
  context: string;
  sources: { title: string; url: string; domain: string; snippet?: string }[];
}> {
  try {
    const res = await fetch(`/api/ai/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const sources = data.results;
        const snippets = sources
          .map((s: any, i: number) => `[${i + 1}] "${s.title}" (${s.domain}): ${s.snippet}`)
          .join("\n\n");
        return {
          context: `[Результаты поиска в интернете (Google/DuckDuckGo)]:\n${snippets}`,
          sources,
        };
      }
    }
  } catch (e) {
    console.warn("Web search failed:", e);
  }
  return { context: "", sources: [] };
}

async function fetchSubConvertContext(prompt: string, lang: Language): Promise<string | null> {
  const ytMatch = prompt.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (!ytMatch) return null;
  const videoId = ytMatch[1];
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const res = await fetch('/api/subconvert/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, language: lang }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.transcript) {
        const text = typeof data.transcript === 'string' 
          ? data.transcript 
          : Array.isArray(data.transcript) 
            ? data.transcript.map((t: any) => t.text || '').join(' ') 
            : '';
        return `[Интеграция SubConvert: Субтитры видео "${data.title || videoId}"]:\n${text.slice(0, 6000)}`;
      }
    }
  } catch (e) {
    console.warn('SubConvert fetch failed:', e);
  }
  return null;
}

async function fetchWeatherContext(prompt: string, lang: Language): Promise<string | null> {
  const isWeatherQuery = /погода|температура|forecast|weather|градус|дождь|снег/i.test(prompt);
  if (!isWeatherQuery) return null;

  try {
    let lat = 55.7558;
    let lon = 37.6173;
    let cityName = lang === 'ru' ? 'Москва' : lang === 'uk' ? 'Москва' : 'Moscow';

    const customCity = localStorage.getItem('linkerru_weather_custom_city');
    if (customCity) {
      cityName = customCity;
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(customCity)}&count=1`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData?.results?.[0]) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
        }
      }
    } else {
      const ipRes = await fetch('/api/geoip');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData?.latitude) {
          lat = ipData.latitude;
          lon = ipData.longitude;
          cityName = ipData.city || cityName;
        }
      }
    }

    const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
    if (wRes.ok) {
      const wData = await wRes.json();
      const curr = wData?.current;
      const daily = wData?.daily;
      if (curr) {
        return `[Интеграция с сервисом Погода (город ${cityName})]:
- Текущая температура: ${Math.round(curr.temperature_2m)}°C (ощущается как ${Math.round(curr.apparent_temperature)}°C)
- Влажность: ${curr.relative_humidity_2m}%
- Ветер: ${Math.round(curr.wind_speed_10m)} км/ч
- Прогноз на сегодня: макс ${daily?.temperature_2m_max?.[0] ?? '--'}°C, мин ${daily?.temperature_2m_min?.[0] ?? '--'}°C.`;
      }
    }
  } catch (e) {
    console.warn('Weather fetch failed:', e);
  }
  return null;
}

async function callServerAiProxy(
  apiMessages: any[],
  model: string,
  temperature: number,
  maxCompletionTokens: number,
  signal?: AbortSignal,
) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      messages: apiMessages,
      model,
      temperature,
      max_tokens: maxCompletionTokens,
    }),
  });

  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {}

  return {
    ok: response.ok,
    status: response.status,
    data,
    raw,
  };
}

const DIRECT_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.3-70b",
];

/**
 * Last-resort path for static hosts (Netlify without server proxy, local
 * `vite preview`, …): talk to the provider straight from the browser using the
 * public VITE_GROQ_API_KEY. Returns the answer text or null.
 */
async function callGroqDirect(
  apiMessages: any[],
  temperature: number,
  maxCompletionTokens: number,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!GROQ_API_KEY) return null;

  const flatMessages = apiMessages.map((msg: any) => ({
    role: msg.role === "assistant" ? "assistant" : msg.role === "system" ? "system" : "user",
    content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
  }));

  for (const model of DIRECT_GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        signal,
        body: JSON.stringify({
          model,
          messages: flatMessages,
          temperature,
          max_tokens: maxCompletionTokens,
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text && String(text).trim()) return String(text).trim();
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }

  return null;
}

export async function sendChatRequest(
  messages: Message[],
  modelId: ModelId,
  lang: Language = "ru",
  signal?: AbortSignal,
  onNotice?: (text: string) => void,
  onSourcesFound?: (sources: { title: string; url: string; domain: string; snippet?: string }[]) => void,
): Promise<string> {
  const startTime = Date.now();
  const latestMessage = messages[messages.length - 1];
  const latestPrompt = latestMessage?.content || "";
  const attachments = latestMessage?.attachments || [];
  const imageAttachment = attachments.find((a) => a.isImage && a.dataUrl);

  // 1. Check Instant Non-LLM Handlers
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

  // 2. Check Smart Routing & Adaptive max_tokens (Lroutev1)
  const routing = routeRequest(latestPrompt, attachments, modelId);
  const activeModelId = routing.modelId;
  const info = getModel(activeModelId);
  const vision = Boolean(info.vision || activeModelId === "lvision");

  if (routing.isAutomaticRoute && onNotice) {
    onNotice(routing.reason);
  }

  // 3. Multi-Tier Cache Check
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

  // 4. Live Integrations (SubConvert, Weather, Web/Google Search)
  const isSearchQuery =
    /найди в интернете|поищи|google|гугл|новости|кто такой|что такое|курс|актуальн|wiki|вики/i.test(latestPrompt) &&
    !imageAttachment;

  let webSearchData: { context: string; sources: any[] } = { context: "", sources: [] };
  if (isSearchQuery) {
    if (onNotice) onNotice(lang === "ru" ? "🌐 Ищу информацию в интернете..." : "🌐 Searching the web...");
    webSearchData = await fetchWebSearch(latestPrompt);
    if (webSearchData.sources.length > 0 && onSourcesFound) {
      onSourcesFound(webSearchData.sources);
    }
  }

  const [subConvertContext, weatherContext] = await Promise.all([
    fetchSubConvertContext(latestPrompt, lang),
    fetchWeatherContext(latestPrompt, lang),
  ]);

  let systemPrompt =
    SYSTEM_PROMPTS[activeModelId]?.[lang] || SYSTEM_PROMPTS[activeModelId]?.en || "You are Lisyan AI.";

  if (webSearchData.context) {
    systemPrompt += `\n\n${webSearchData.context}\n(Используйте эти актуальные данные для ответа)`;
  }
  if (subConvertContext) {
    systemPrompt += `\n\n${subConvertContext}`;
  }
  if (weatherContext) {
    systemPrompt += `\n\n${weatherContext}`;
  }

  const contextResult = buildOptimizedContext(
    messages,
    activeModelId,
    systemPrompt,
    lang,
    vision
  );

  const adaptiveMaxTokens = routing.maxCompletionTokens;

  // 5. Send optimized payload via Lroutev1 Engine
  let proxyMissing = false;

  try {
    const serverResult = await callServerAiProxy(
      contextResult.apiMessages,
      "openrouter/free",
      info.temperature,
      adaptiveMaxTokens,
      signal
    );

    if (serverResult.ok && serverResult.data?.content) {
      const responseText = serverResult.data.content.trim();

      saveCachedResponse(
        latestPrompt,
        responseText,
        activeModelId,
        lang,
        0,
        imageAttachment?.dataUrl
      );

      const elapsed = Date.now() - startTime;
      const originalEstTokens = Math.ceil(
        messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) / 3.8 + 800
      );
      const actualEstTokens = Math.ceil(
        contextResult.apiMessages.reduce(
          (acc, m) =>
            acc + (typeof m.content === "string" ? m.content.length : 100),
          0
        ) / 3.8 + 250
      );

      recordOptimizationEvent({
        originalTokens: Math.max(originalEstTokens, actualEstTokens),
        optimizedTokens: actualEstTokens,
        tokensSaved: Math.max(0, originalEstTokens - actualEstTokens),
        latencySavedMs: Math.max(300, 1500 - elapsed),
      });

      return responseText;
    }

    // 404/405 means this deployment serves no proxy at all — replaying the
    // rest of the chain would only repeat the same dead request.
    proxyMissing = serverResult.status === 404 || serverResult.status === 405;
    if (proxyMissing) {
      console.warn("Server AI proxy is unavailable on this host, switching to direct provider calls.");
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    proxyMissing = true;
    console.warn("Lroutev1 server proxy attempt failed, trying fallback models...", err);
  }

  // Fallback chain
  if (!proxyMissing) {
    const fallbacks = FALLBACKS[activeModelId] || ["openrouter/free", "llama-3.3-70b"];
    for (const fallbackModel of fallbacks) {
      try {
        const fbResult = await callServerAiProxy(
          contextResult.apiMessages,
          fallbackModel,
          info.temperature,
          adaptiveMaxTokens,
          signal
        );
        if (fbResult.ok && fbResult.data?.content) {
          return fbResult.data.content.trim();
        }
      } catch (err: any) {
        if (signal?.aborted) throw err;
      }
    }
  }

  // Direct browser-side provider call (static hosts without the server proxy)
  if (!imageAttachment) {
    try {
      const direct = await callGroqDirect(
        contextResult.apiMessages,
        info.temperature,
        adaptiveMaxTokens,
        signal
      );
      if (direct) {
        saveCachedResponse(latestPrompt, direct, activeModelId, lang, 0);
        return direct;
      }
    } catch (err: any) {
      if (signal?.aborted) throw err;
    }
  }

  throw new Error(
    lang === "ru"
      ? "Не удалось получить ответ от моделей. Пожалуйста, попробуйте еще раз."
      : "Failed to receive a response from AI models. Please try again."
  );
}
