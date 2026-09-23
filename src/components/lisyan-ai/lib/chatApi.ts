import type { Message, ModelId } from "../types";
import { getModel } from "../data/models";
import { Language } from "../../../types";
import { normalizeText, detectInstantRuleResponse, ultraCompressForSmall } from "./optimizer/textCompressor";
import { buildOptimizedContext } from "./optimizer/contextManager";
import { routeRequest, isSmallQuestion, isTinyQuestion } from "./optimizer/smartRouter";
import { getCachedResponse, saveCachedResponse, getRamCacheSync } from "./optimizer/cacheEngine";
import { recordOptimizationEvent } from "./optimizer/statsTracker";
import { detectInputLanguage, buildLanguageInstruction, type DetectedLanguage } from "./languageDetector";

const GROQ_API_KEY =
  ((import.meta as any).env?.VITE_GROQ_API_KEY || "").trim();
const GROQ_URL =
  ((import.meta as any).env?.VITE_GROQ_URL || "https://api.groq.com/openai/v1/chat/completions").trim();

// --- Performance caches (in-memory, super fast) ---
const searchCache = new Map<string, { data: any; ts: number }>();
const weatherCache = new Map<string, { data: string; ts: number }>();
const subConvertCache = new Map<string, { data: string; ts: number }>();
const ongoingRequests = new Map<string, Promise<string>>();

const SEARCH_CACHE_TTL = 5 * 60 * 1000;
const WEATHER_CACHE_TTL = 10 * 60 * 1000;
const SUBCONVERT_CACHE_TTL = 30 * 60 * 1000;

function getCachedIntegration(cache: Map<string, any>, key: string, ttl: number): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

const SYSTEM_PROMPTS: Record<ModelId, Record<Language, string>> = {
  lnv1: {
    ru: `Вы — Lisyan AI, умный, четкий и полезный персональный ассистент LinkerRu.
ПРАВИЛА:
1. Давайте прямой, содержательный ответ без лишней «воды», без внутренних рассуждений и без шаблонных вводных фраз.
2. КРИТИЧНО: Всегда отвечайте на том же языке, на котором написал пользователь в ПОСЛЕДНЕМ сообщении. Если пользователь пишет по-английски — отвечайте по-английски. Если по-испански — по-испански. Язык ответа = язык последнего вопроса.
3. При запросе таблиц всегда используйте валидные Markdown-таблицы (| A | B | с |---|---|).
4. Для крошечных вопросов отвечайте максимально коротко (1-2 предложения если достаточно).`,
    uk: `Ви — Lisyan AI, розумний, чіткий і корисний персональний асистент LinkerRu.
ПРАВИЛА:
1. Давайте пряму, змістовну відповідь без зайвої «води».
2. КРИТИЧНО: Завжди відповідайте тією ж мовою, якою написав користувач в ОСТАННЬОМУ повідомленні. Мова відповіді = мова останнього запитання.
3. Для крихітних запитань відповідайте максимально коротко.`,
    en: `You are Lisyan AI, a direct, highly capable personal assistant in LinkerRu.
RULES:
1. Provide a direct, crystal-clear answer with zero fluff.
2. CRITICAL: Always reply in the EXACT language used by the user in their LAST message. If user writes in Spanish, answer in Spanish. If Russian, answer in Russian. Answer language = language of last user message.
3. For tiny questions, answer as concisely as possible (1-2 sentences if sufficient).`,
  },
  lv1pro: {
    ru: `Вы — Lisyan AI Pro, флагманский ассистент LinkerRu. Глубокие, точные, структурированные ответы без воды. Код — чистый, современный. КРИТИЧНО: Отвечайте на языке последнего сообщения пользователя.`,
    uk: `Ви — Lisyan AI Pro, флагманський асистент LinkerRu. Глибокі, точні відповіді. КРИТИЧНО: Відповідайте мовою останнього повідомлення користувача.`,
    en: `You are Lisyan AI Pro, flagship assistant. Deep, accurate, structured, zero fluff. Clean modern code. CRITICAL: Answer in language of user's last message.`,
  },
  lvision: {
    ru: `Вы — Lisyan AI Vision. Анализируйте изображения четко, на языке последнего сообщения пользователя.`,
    uk: `Ви — Lisyan AI Vision. Аналізуйте зображення чітко, мовою останнього повідомлення користувача.`,
    en: `You are Lisyan AI Vision. Analyze images concisely in language of user's last message.`,
  },
};

// Ultra minimal system prompt for compound tiny questions — now includes language detection
const ULTRA_MINIMAL_PROMPTS: Record<Language, string> = {
  ru: "Ты — Lisyan AI. Отвечай кратко, точно, по существу. ЯЗЫК ОТВЕТА = ЯЗЫК ПОСЛЕДНЕГО СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ. 1-3 предложения достаточно.",
  uk: "Ти — Lisyan AI. Відповідай коротко, точно. МОВА ВІДПОВІДІ = МОВА ОСТАННЬОГО ПОВІДОМЛЕННЯ КОРИСТУВАЧА.",
  en: "You are Lisyan AI. Answer concisely, accurately. ANSWER LANGUAGE = LANGUAGE OF USER'S LAST MESSAGE. 1-3 sentences is enough.",
};

const FALLBACKS: Record<ModelId, string[]> = {
  lnv1: [
    "groq/compound-mini",
    "groq/compound",
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "llama-3.3-70b",
    "meta/llama-3.3-70b-instruct",
    "openrouter/free",
  ],
  lv1pro: [
    "llama-3.3-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "groq/compound",
    "meta/llama-3.3-70b-instruct",
    "deepseek-ai/deepseek-r1",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter/free",
  ],
  lvision: [
    "inclusionai/ling-3.0-flash-vl:free",
    "meta/llama-3.2-11b-vision-instruct",
    "google/gemini-2.0-flash-exp:free",
    "openrouter/free",
  ],
};

const COMPOUND_FALLBACKS = [
  "groq/compound-mini",
  "groq/compound",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
];

export async function initLrouteWarmup(): Promise<void> {
  try {
    const warmed = sessionStorage.getItem('linkerru_lroute_warmed_v3');
    if (warmed) return;

    fetch('/api/ai/warmup', { priority: 'high' as any } as any)
      .then((r) => r.json())
      .then((data) => {
        if (data?.verifiedModels) {
          sessionStorage.setItem('linkerru_lroute_warmed_v3', 'true');
          sessionStorage.setItem('linkerru_verified_models', JSON.stringify(data.verifiedModels));
        }
      })
      .catch(() => {});

    if (GROQ_API_KEY) {
      fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'groq/compound-mini',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5,
        }),
      }).catch(() => {});
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') initLrouteWarmup();
  else window.addEventListener('load', initLrouteWarmup, { once: true });
  setTimeout(initLrouteWarmup, 500);
}

export async function fetchWebSearch(query: string): Promise<{
  context: string;
  sources: { title: string; url: string; domain: string; snippet?: string }[];
}> {
  const cacheKey = query.toLowerCase().trim().slice(0, 100);
  const cached = getCachedIntegration(searchCache, cacheKey, SEARCH_CACHE_TTL);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`/api/ai/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const sources = data.results;
        const snippets = sources
          .map((s: any, i: number) => `[${i + 1}] "${s.title}" (${s.domain}): ${s.snippet}`)
          .join("\n\n");
        const result = {
          context: `[Web search]:\n${snippets}`,
          sources,
        };
        searchCache.set(cacheKey, { data: result, ts: Date.now() });
        if (searchCache.size > 50) {
          const first = searchCache.keys().next().value;
          if (first) searchCache.delete(first);
        }
        return result;
      }
    }
  } catch (e) {
    console.warn("Web search failed:", e);
  }
  return { context: "", sources: [] };
}

async function fetchSubConvertContext(prompt: string, lang: Language): Promise<string | null> {
  const ytMatch = prompt.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  const isYoutubeMention = /(?:youtube|ютуб|ютубе|видео)/i.test(prompt);

  if (!ytMatch && !isYoutubeMention) return null;

  if (ytMatch) {
    const videoId = ytMatch[1];
    const cacheKey = `${videoId}_${lang}`;
    const cached = getCachedIntegration(subConvertCache, cacheKey, SUBCONVERT_CACHE_TTL);
    if (cached) return cached;

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);
      const res = await fetch('/api/subconvert/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, language: lang }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && data.transcript) {
          const text = typeof data.transcript === 'string'
            ? data.transcript
            : Array.isArray(data.transcript)
              ? data.transcript.map((t: any) => t.text || '').join(' ')
              : '';
          const result = `[Интеграция SubConvert LinkerRu]: Видео "${data.title || videoId}" (URL: ${url}).\nСубтитры и транскрипт:\n${text.slice(0, 6000)}\n(Используйте эти данные SubConvert для подробного анализа видео, таймкодов и ключевых выводов).`;
          subConvertCache.set(cacheKey, { data: result, ts: Date.now() });
          return result;
        }
      }
    } catch (e) {
      console.warn('SubConvert fetch failed:', e);
    }
    return `[Интеграция SubConvert LinkerRu]: Обнаружено YouTube-видео ${url}. Сервис SubConvert подключен и готов к анализу.`;
  }

  return null;
}

function getWeatherConditionText(code: number, lang: Language): string {
  if (code === 0) return lang === 'ru' ? 'Ясно и солнечно' : lang === 'uk' ? 'Ясно та сонячно' : 'Clear sky';
  if (code >= 1 && code <= 3) return lang === 'ru' ? 'Переменная облачность' : lang === 'uk' ? 'Мінлива хмарність' : 'Partly cloudy';
  if (code >= 45 && code <= 48) return lang === 'ru' ? 'Туман' : lang === 'uk' ? 'Туман' : 'Foggy';
  if (code >= 51 && code <= 67) return lang === 'ru' ? 'Дождь' : lang === 'uk' ? 'Дощ' : 'Rain';
  if (code >= 71 && code <= 77) return lang === 'ru' ? 'Снегопад' : lang === 'uk' ? 'Снігопад' : 'Snowfall';
  if (code >= 80 && code <= 82) return lang === 'ru' ? 'Ливневый дождь' : lang === 'uk' ? 'Злива' : 'Heavy rain showers';
  if (code >= 85 && code <= 86) return lang === 'ru' ? 'Снежные ливни' : lang === 'uk' ? 'Снігова злива' : 'Snow showers';
  if (code >= 95 && code <= 99) return lang === 'ru' ? 'Гроза' : lang === 'uk' ? 'Гроза' : 'Thunderstorm';
  return lang === 'ru' ? 'Умеренная облачность' : lang === 'uk' ? 'Помірна хмарність' : 'Overcast';
}

async function fetchWeatherContext(prompt: string, lang: Language): Promise<string | null> {
  const isWeatherQuery = /погода|температура|forecast|weather|градус|дождь|снег|влажн|ветер|холодно|жарко/i.test(prompt);
  if (!isWeatherQuery) return null;

  const cacheKey = `weather_${lang}_${(prompt.slice(0, 50))}`;
  const cached = getCachedIntegration(weatherCache, cacheKey, WEATHER_CACHE_TTL);
  if (cached) return cached;

  try {
    let lat = 55.7558;
    let lon = 37.6173;
    let cityName = lang === 'ru' ? 'Москва' : lang === 'uk' ? 'Київ' : 'Moscow';

    // 1. Check if user specified a city in the prompt (e.g. "погода в париже", "weather in london")
    const cityInPromptMatch = prompt.match(/(?:погода|температура|weather|forecast)\s+(?:в|во|in)\s+([a-zA-Zа-яА-ЯёЁ\s-]+?)(?:\?|\.|\,|$|\s+на|\s+сегодня)/i);
    let explicitCity = cityInPromptMatch ? cityInPromptMatch[1].trim() : null;

    if (explicitCity && explicitCity.length >= 2) {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(explicitCity)}&count=1`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData?.results?.[0]) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            cityName = geoData.results[0].name || explicitCity;
          }
        }
      } catch {}
    } else {
      // 2. Check custom city in settings or silent IP GeoIP
      const customCity = localStorage.getItem('linkerru_weather_custom_city');
      if (customCity) {
        cityName = customCity;
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 2500);
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(customCity)}&count=1`, { signal: controller.signal });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData?.results?.[0]) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
            }
          }
        } catch {}
      } else {
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 2000);
          const ipRes = await fetch('/api/geoip', { signal: controller.signal });
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData?.latitude) {
              lat = ipData.latitude;
              lon = ipData.longitude;
              cityName = ipData.city || cityName;
            }
          }
        } catch {}
      }
    }

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3500);
    const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`, { signal: controller.signal });
    if (wRes.ok) {
      const wData = await wRes.json();
      const curr = wData?.current;
      const daily = wData?.daily;
      if (curr) {
        const condition = getWeatherConditionText(curr.weather_code ?? 0, lang);
        const temp = Math.round(curr.temperature_2m);
        const feels = Math.round(curr.apparent_temperature);
        const wind = Math.round(curr.wind_speed_10m);
        const humidity = curr.relative_humidity_2m;
        const max = daily?.temperature_2m_max?.[0] !== undefined ? Math.round(daily.temperature_2m_max[0]) : '--';
        const min = daily?.temperature_2m_min?.[0] !== undefined ? Math.round(daily.temperature_2m_min[0]) : '--';

        const result = `[Данные из встроенного сервиса Погода LinkerRu]:\nГород: ${cityName}\nТекущая температура: ${temp}°C (ощущается как ${feels}°C)\nСостояние: ${condition}\nВлажность: ${humidity}%\nВетер: ${wind} км/ч\nДневной максимум: ${max}°C, ночной минимум: ${min}°C.\n(Обязательно сообщите пользователю точные данные из сервиса Погода LinkerRu).`;
        weatherCache.set(cacheKey, { data: result, ts: Date.now() });
        return result;
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

const DIRECT_GROQ_MODELS_COMPOUND = [
  "groq/compound-mini",
  "groq/compound",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
];

const DIRECT_GROQ_MODELS_DEFAULT = [
  "groq/compound-mini",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.3-70b",
];

async function callGroqDirect(
  apiMessages: any[],
  temperature: number,
  maxCompletionTokens: number,
  signal?: AbortSignal,
  useCompound: boolean = false,
): Promise<string | null> {
  if (!GROQ_API_KEY) return null;

  const flatMessages = apiMessages.map((msg: any) => ({
    role: msg.role === "assistant" ? "assistant" : msg.role === "system" ? "system" : "user",
    content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
  }));

  const modelsToTry = useCompound ? DIRECT_GROQ_MODELS_COMPOUND : DIRECT_GROQ_MODELS_DEFAULT;

  if (useCompound && modelsToTry.length >= 2) {
    const racePromises = modelsToTry.slice(0, 2).map(async (model) => {
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
            temperature: Math.min(temperature, 0.35),
            max_tokens: maxCompletionTokens,
          }),
        });
        if (!res.ok) throw new Error("not ok");
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && String(text).trim()) return String(text).trim();
        throw new Error("empty");
      } catch (e) {
        if (signal?.aborted) throw e;
        return null;
      }
    });

    try {
      const winner = await Promise.any(racePromises.map(p => p.then(v => v ? Promise.resolve(v) : Promise.reject())));
      if (winner) return winner;
    } catch {}
  }

  for (const model of modelsToTry) {
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
          temperature: useCompound ? Math.min(temperature, 0.35) : temperature,
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

// Ultra-fast path for tiny questions — now includes detected language instruction
function buildUltraFastContext(
  prompt: string,
  uiLang: Language,
  detected: DetectedLanguage,
  systemPromptBase?: string
): { role: string; content: string }[] {
  const base = systemPromptBase || ULTRA_MINIMAL_PROMPTS[uiLang] || ULTRA_MINIMAL_PROMPTS.en;
  const langInstruction = buildLanguageInstruction(detected, uiLang);
  const sys = `${base}${langInstruction}`;
  return [
    { role: "system", content: sys },
    { role: "user", content: ultraCompressForSmall(prompt) },
  ];
}

export async function sendChatRequest(
  messages: Message[],
  modelId: ModelId,
  lang: Language = "ru",
  signal?: AbortSignal,
  onNotice?: (text: string) => void,
  onSourcesFound?: (sources: { title: string; url: string; domain: string; snippet?: string }[]) => void,
): Promise<string> {
  const startTime = performance.now();
  const latestMessage = messages[messages.length - 1];
  const latestPrompt = latestMessage?.content || "";
  const attachments = latestMessage?.attachments || [];
  const imageAttachment = attachments.find((a) => a.isImage && a.dataUrl);

  // --- NEW: Detect language of the typed question ---
  const detected: DetectedLanguage = detectInputLanguage(latestPrompt, lang);
  const answerLangCode = detected.code; // e.g., 'es','en','ru' — used for cache key
  const answerLangInstruction = buildLanguageInstruction(detected, lang);

  // Deduplication key — now includes detected language for correctness
  const dedupKey = `${latestPrompt.slice(0, 200)}_${modelId}_${answerLangCode}_${attachments.length}`;
  if (ongoingRequests.has(dedupKey)) {
    return ongoingRequests.get(dedupKey)!;
  }

  const exec = async (): Promise<string> => {
    // 1. Check Instant Non-LLM Handlers — now language-aware
    const instantResult = detectInstantRuleResponse(latestPrompt, lang, detected);
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

    // 2. Check Smart Routing & Adaptive max_tokens (Lroutev1 + Compound)
    const routing = routeRequest(latestPrompt, attachments, modelId);
    const activeModelId = routing.modelId;
    const info = getModel(activeModelId);
    const vision = Boolean(info.vision || activeModelId === "lvision");
    const isYoutubeQuery =
      /(?:youtube\.com|youtu\.be)/i.test(latestPrompt) ||
      /\b(проанализируй видео|посмотри видео|субтитры youtube|краткое содержание видео|выжимка видео|видео на ютуб|видео в ютуб|youtube video)\b/i.test(latestPrompt);
    const isWeatherQuery =
      /погода|температура|forecast|weather|градус|дождь|снег|влажн|ветер|холодно|жарко/i.test(latestPrompt);

    const useCompound = Boolean(
      (routing.useGroqCompound || routing.category === "compound" || (routing.category === "fact" && isSmallQuestion(latestPrompt))) &&
      !isYoutubeQuery &&
      !isWeatherQuery
    );
    const tiny = isTinyQuestion(latestPrompt) && !vision && attachments.length === 0 && !isYoutubeQuery && !isWeatherQuery;

    if (isYoutubeQuery && onNotice) {
      onNotice(lang === "ru" ? "🔌 Подключаюсь к SubConvert..." : lang === "uk" ? "🔌 Підключаюся до SubConvert..." : "🔌 Connecting to SubConvert...");
    } else if (isWeatherQuery && onNotice) {
      onNotice(lang === "ru" ? "🌤️ Подключаюсь к сервису Погода..." : lang === "uk" ? "🌤️ Підключаюся до сервісу Погода..." : "🌤️ Connecting to Weather service...");
    } else if (routing.isAutomaticRoute && onNotice) {
      onNotice(routing.reason);
    } else if (useCompound && onNotice) {
      onNotice(routing.reason);
    }

    // 3. Multi-Tier Cache Check — RAM sync first for <1ms hit, now with detected language
    const ramHit = getRamCacheSync(latestPrompt, activeModelId, answerLangCode);
    if (ramHit && !signal?.aborted) {
      const elapsed = performance.now() - startTime;
      recordOptimizationEvent({
        originalTokens: Math.ceil((latestPrompt.length + 300) / 3.8),
        optimizedTokens: 0,
        tokensSaved: Math.ceil((latestPrompt.length + 300) / 3.8),
        isCacheHit: true,
        latencySavedMs: Math.max(800, 1800 - elapsed),
      });
      return ramHit.response;
    }

    const cached = await getCachedResponse(
      latestPrompt,
      activeModelId,
      answerLangCode,
      imageAttachment?.dataUrl
    );

    if (cached && !signal?.aborted) {
      const elapsed = performance.now() - startTime;
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

    // 4. Ultra-fast path for tiny questions — skip all integrations, minimal context + language instruction
    let apiMessages: any[];
    let adaptiveMaxTokens = routing.maxCompletionTokens;
    let systemPromptBase = "";

    if (tiny) {
      systemPromptBase = ULTRA_MINIMAL_PROMPTS[lang] || ULTRA_MINIMAL_PROMPTS.en;
      // Append critical language instruction for tiny path
      systemPromptBase += answerLangInstruction;
      apiMessages = buildUltraFastContext(latestPrompt, lang, detected, systemPromptBase);
      adaptiveMaxTokens = Math.min(adaptiveMaxTokens, 512);
    } else {
      const shouldDoExternalSearch = !useCompound && !imageAttachment &&
        /найди в интернете|поищи|google|гугл|новости|кто такой|что такое|курс|актуальн|wiki|вики/i.test(latestPrompt);

      const integrationPromises: Promise<any>[] = [];

      if (shouldDoExternalSearch) {
        if (onNotice) onNotice(lang === "ru" ? "🌐 Ищу информацию в интернете..." : "🌐 Searching the web...");
        integrationPromises.push(fetchWebSearch(latestPrompt).then(data => ({ type: 'search', data })));
      } else {
        integrationPromises.push(Promise.resolve({ type: 'search', data: { context: "", sources: [] } }));
      }

      integrationPromises.push(fetchSubConvertContext(latestPrompt, lang).then(data => ({ type: 'subconvert', data })));
      integrationPromises.push(fetchWeatherContext(latestPrompt, lang).then(data => ({ type: 'weather', data })));

      const integrationResults = await Promise.all(integrationPromises);

      let webSearchData = { context: "", sources: [] as any[] };
      let subConvertContext: string | null = null;
      let weatherContext: string | null = null;

      for (const res of integrationResults) {
        if (res.type === 'search') webSearchData = res.data;
        if (res.type === 'subconvert') subConvertContext = res.data;
        if (res.type === 'weather') weatherContext = res.data;
      }

      if (webSearchData.sources.length > 0 && onSourcesFound) {
        onSourcesFound(webSearchData.sources);
      }

      systemPromptBase =
        SYSTEM_PROMPTS[activeModelId]?.[lang] || SYSTEM_PROMPTS[activeModelId]?.en || "You are Lisyan AI.";

      // Inject critical language rule
      systemPromptBase += answerLangInstruction;

      if (useCompound) {
        systemPromptBase += lang === "ru"
          ? "\n[Короткий вопрос — отвечай максимально кратко, 1-3 предложения.]"
          : "\n[Short question — answer concisely, 1-3 sentences.]";
      }

      if (webSearchData.context) {
        systemPromptBase += `\n\n${webSearchData.context}`;
      }
      if (subConvertContext) {
        systemPromptBase += `\n\n${subConvertContext}`;
      }
      if (weatherContext) {
        systemPromptBase += `\n\n${weatherContext}`;
      }

      const contextResult = buildOptimizedContext(
        messages,
        activeModelId,
        systemPromptBase,
        lang,
        vision
      );
      apiMessages = contextResult.apiMessages;

      const originalEstTokens = Math.ceil(
        messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) / 3.8 + 800
      );
      const actualEstTokens = Math.ceil(
        apiMessages.reduce(
          (acc, m) =>
            acc + (typeof m.content === "string" ? m.content.length : 100),
          0
        ) / 3.8 + 250
      );

      (apiMessages as any)._origTokens = originalEstTokens;
      (apiMessages as any)._actualTokens = actualEstTokens;
    }

    let proxyMissing = false;
    let lastServerError = "";
    let lastServerCode = "";
    const fastTimeoutMs = tiny ? 8000 : useCompound ? 10000 : 15000;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), fastTimeoutMs);

    const combinedSignal = signal
      ? (() => {
          const ctrl = new AbortController();
          const onAbort = () => ctrl.abort();
          signal.addEventListener('abort', onAbort, { once: true });
          timeoutController.signal.addEventListener('abort', onAbort, { once: true });
          return ctrl.signal;
        })()
      : timeoutController.signal;

    const rememberServerError = (result?: { status?: number; data?: any }) => {
      if (!result) return;
      const msg = typeof result.data?.error === "string" ? result.data.error.trim() : "";
      if (msg) lastServerError = msg;
      if (typeof result.data?.code === "string") lastServerCode = result.data.code;
    };

    try {
      const requestedModel = useCompound ? "groq/compound-mini" : "openrouter/free";
      const serverResult = await callServerAiProxy(
        apiMessages,
        requestedModel,
        useCompound ? Math.min(info.temperature, 0.35) : info.temperature,
        adaptiveMaxTokens,
        combinedSignal
      );
      clearTimeout(timeoutId);

      if (serverResult.ok && serverResult.data?.content) {
        const responseText = serverResult.data.content.trim();

        saveCachedResponse(
          latestPrompt,
          responseText,
          activeModelId,
          answerLangCode,
          0,
          imageAttachment?.dataUrl
        );

        const elapsed = performance.now() - startTime;
        const originalEstTokens = (apiMessages as any)._origTokens || Math.ceil((latestPrompt.length + 800) / 3.8);
        const actualEstTokens = (apiMessages as any)._actualTokens || Math.ceil((apiMessages as any[]).reduce((acc, m) => acc + (typeof m.content === "string" ? m.content.length : 100), 0) / 3.8 + 250);

        const tokensSaved = Math.max(0, originalEstTokens - actualEstTokens);
        const compoundBonus = useCompound ? Math.round(adaptiveMaxTokens * 0.7) : 0;

        recordOptimizationEvent({
          originalTokens: Math.max(originalEstTokens, actualEstTokens) + compoundBonus,
          optimizedTokens: actualEstTokens,
          tokensSaved: tokensSaved + compoundBonus,
          latencySavedMs: Math.max(200, 1200 - elapsed),
          usedCompound: useCompound,
          isSmallQuestion: useCompound,
        } as any);

        return responseText;
      }

      rememberServerError(serverResult);
      proxyMissing = serverResult.status === 404 || serverResult.status === 405;
      if (proxyMissing) {
        console.warn("Server AI proxy unavailable, switching to direct.");
      } else if (!serverResult.ok) {
        console.warn("Server AI proxy error:", serverResult.status, lastServerError || serverResult.raw);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (signal?.aborted || err?.name === 'AbortError') {
        if (signal?.aborted) throw err;
        console.warn("Server proxy timed out, trying fallback");
        lastServerError = lastServerError || "timeout";
      } else {
        proxyMissing = true;
        console.warn("Server proxy failed, trying fallback", err);
      }
    }

    const withTimeoutSignal = (timeoutMs: number): AbortSignal | undefined => {
      if (!signal) {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), timeoutMs);
        ctrl.signal.addEventListener('abort', () => clearTimeout(tid), { once: true });
        return ctrl.signal;
      }
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), timeoutMs);
      const onParentAbort = () => ctrl.abort();
      signal.addEventListener('abort', onParentAbort, { once: true });
      ctrl.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(tid);
          signal.removeEventListener('abort', onParentAbort);
        },
        { once: true }
      );
      return ctrl.signal;
    };

    if (!proxyMissing || true) {
      const fallbacks = useCompound
        ? COMPOUND_FALLBACKS
        : FALLBACKS[activeModelId] || ["openrouter/free", "llama-3.3-70b"];

      if (tiny && fallbacks.length >= 2) {
        const raceResults = await Promise.allSettled(
          fallbacks.slice(0, 2).map(async (fbModel) => {
            try {
              const fbResult = await callServerAiProxy(
                apiMessages,
                fbModel,
                0.3,
                adaptiveMaxTokens,
                withTimeoutSignal(7000)
              );
              if (fbResult.ok && fbResult.data?.content) return fbResult.data.content.trim();
              rememberServerError(fbResult);
              throw new Error("no content");
            } catch (e) {
              throw e;
            }
          })
        );
        for (const r of raceResults) {
          if (r.status === 'fulfilled' && r.value) return r.value;
        }
      }

      for (const fallbackModel of fallbacks) {
        try {
          const fbResult = await callServerAiProxy(
            apiMessages,
            fallbackModel,
            useCompound ? 0.3 : info.temperature,
            adaptiveMaxTokens,
            withTimeoutSignal(12000)
          );
          rememberServerError(fbResult);
          if (fbResult.ok && fbResult.data?.content) {
            const txt = fbResult.data.content.trim();
            saveCachedResponse(latestPrompt, txt, activeModelId, answerLangCode, 0, imageAttachment?.dataUrl);
            return txt;
          }
        } catch (err: any) {
          if (signal?.aborted) throw err;
        }
      }
    }

    if (!imageAttachment) {
      try {
        const direct = await callGroqDirect(
          apiMessages,
          info.temperature,
          adaptiveMaxTokens,
          signal,
          useCompound
        );
        if (direct) {
          saveCachedResponse(latestPrompt, direct, activeModelId, answerLangCode, 0);
          return direct;
        }
      } catch (err: any) {
        if (signal?.aborted) throw err;
      }
    }

    const noKeysHint =
      lang === "ru"
        ? "На сервере не настроены ключи AI-провайдеров. Добавьте GEMINI_API_KEY или GROQ_API_KEY в .env (см. .env.example) и перезапустите сервер."
        : lang === "uk"
          ? "На сервері не налаштовані ключі AI-провайдерів. Додайте GEMINI_API_KEY або GROQ_API_KEY у .env (див. .env.example) і перезапустіть сервер."
          : "AI provider keys are not configured on the server. Add GEMINI_API_KEY or GROQ_API_KEY to .env (see .env.example) and restart the server.";
    const fallbackMsg =
      lang === "ru"
        ? "Не удалось получить ответ от моделей. Пожалуйста, попробуйте еще раз."
        : lang === "uk"
          ? "Не вдалося отримати відповідь від моделей. Будь ласка, спробуйте ще раз."
          : "Failed to receive a response from AI models. Please try again.";

    if (lastServerCode === "no_provider_keys") {
      throw new Error(noKeysHint);
    }
    if (lastServerError && lastServerError !== "timeout") {
      throw new Error(`${fallbackMsg}\n${lastServerError}`);
    }
    throw new Error(fallbackMsg);
  };

  const promise = exec().finally(() => {
    ongoingRequests.delete(dedupKey);
  });

  ongoingRequests.set(dedupKey, promise);
  return promise;
}
