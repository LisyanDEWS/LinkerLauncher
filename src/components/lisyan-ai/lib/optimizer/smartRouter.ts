import type { ModelId, AttachedFile } from "../../types";

export interface RouteDecision {
  modelId: ModelId;
  reason: string;
  maxCompletionTokens: number;
  isAutomaticRoute: boolean;
  category: "fact" | "chat" | "code" | "vision" | "compound";
  useGroqCompound?: boolean;
}

/**
 * Keywords and syntactic markers for complex programming, algorithms, architecture, and debugging.
 */
const COMPLEX_CODE_PATTERNS = [
  /\b(напиши код|напиши скрипт|напиши функцию|разработай|архитектур|алгоритм|рефакторинг|sql|баз[аы] данных|микросервис|docker|kubernetes|typescript|javascript|python|c\+\+|c#|rust|golang|react|vue|node\.js|express|api endpoint|unit test|debug|исправь ошибку|исправь баг|оптимизируй код|рекурси|структур[аы] данных|паттерн|ооп|бэкенд|фронтенд|компонент|хук|json схема|rest api|graphql|таблиц[ауеы]|создай таблицу|сделай таблицу|сравни в таблице)\b/i,
  /\b(write code|implement|refactor|optimize algorithm|database schema|design architecture|complex code|full script|unit tests|debug error|fix bug|regex|typescript|python|react hook|dockerfile|markdown table|create table|comparison table)\b/i,
  /```|\bfunction\s*\(|\bconst\s+\w+\s*=|\bclass\s+\w+|\bimport\s+.*from|\bdef\s+\w+\(|\\bSELECT\s+.*FROM\b|\bCREATE\s+TABLE\b/i,
];

/**
 * Small factual question patterns — perfect for Groq Compound (built-in search + tools)
 * These are short, direct questions that benefit from compound's speed and grounding.
 */
const SMALL_QUESTION_INDICATORS = [
  /^(кто|что|где|когда|почему|зачем|как|сколько|чей|какой|какая)\b/i,
  /^(who|what|where|when|why|how|how many|which|whose)\b/i,
  /\b(что такое|кто такой|где находится|как работает|переведи|translate|capital of|who is|what is)\b/i,
  /\b(погода|курс|цена|сколько стоит|определение|значение слова)\b/i,
];

const SMALL_QUESTION_MAX_LEN = 200;
const TINY_QUESTION_MAX_LEN = 80;

/**
 * Determines if a prompt qualifies as a small question that should use Groq Compound.
 * Criteria:
 * - Short length (<=200 chars, <=25 words)
 * - No code patterns
 * - No vision
 * - Simple factual nature
 */
export function isSmallQuestion(prompt: string): boolean {
  const clean = prompt.trim();
  if (!clean) return false;
  if (clean.length > SMALL_QUESTION_MAX_LEN) return false;
  if (COMPLEX_CODE_PATTERNS.some((p) => p.test(clean))) return false;
  if (clean.includes("```")) return false;
  if (clean.length > 500) return false;

  const wordCount = clean.split(/\s+/).length;
  if (wordCount > 28) return false;

  // Very tiny questions are always compound candidates
  if (clean.length <= TINY_QUESTION_MAX_LEN && wordCount <= 12) return true;

  // Check for factual question indicators
  if (SMALL_QUESTION_INDICATORS.some((p) => p.test(clean))) return true;

  // Short questions with question mark
  if (clean.length <= 120 && (clean.includes("?") || clean.length <= 60)) return true;

  // Single sentence, short
  if (wordCount <= 15 && clean.length <= SMALL_QUESTION_MAX_LEN) return true;

  return false;
}

export function isTinyQuestion(prompt: string): boolean {
  const clean = prompt.trim();
  return clean.length <= TINY_QUESTION_MAX_LEN && clean.split(/\s+/).length <= 10;
}

/**
 * Calculates adaptive max_completion_tokens:
 * Ensures responses are never truncated and long texts have full generation room.
 * Optimized for token savings: small questions get minimal tokens.
 */
export function calculateAdaptiveMaxTokens(
  prompt: string,
  modelId: ModelId,
  category?: "fact" | "chat" | "code" | "vision" | "compound"
): number {
  const clean = prompt.trim();
  const len = clean.length;

  // 0. Groq Compound path — ultra optimized token budgets
  if (category === "compound" || category === "fact") {
    if (len <= 20) return 256; // e.g. "hi", "2+2", "capital of france"
    if (len <= 40) return 512;
    if (len <= 80) return 768;
    if (len <= 150) return 1024;
    if (len <= 250) return 1536;
    return 2048; // still small vs default 4096
  }

  // 1. Vision (Images & screenshots)
  if (category === "vision" || modelId === "lvision") {
    // Vision needs more for description but cap at 3k if question is small
    if (len <= 60) return 1024;
    if (len <= 150) return 2048;
    return 4096;
  }

  // 2. Complex Coding, Architecture, Tables, Large text analysis
  if (
    category === "code" ||
    COMPLEX_CODE_PATTERNS.some((p) => p.test(clean)) ||
    clean.includes("```") ||
    clean.length > 500
  ) {
    if (len <= 200) return 2048;
    if (len <= 800) return 4096;
    return 8192;
  }

  // 3. Standard queries — adaptive based on length (was fixed 4096)
  if (len <= 50) return 1024;
  if (len <= 150) return 1536;
  if (len <= 300) return 2048;
  if (len <= 600) return 3072;
  return 4096;
}

/**
 * Intelligently routes the user's prompt to the optimal model
 * and dynamically assigns the completion limit.
 * NEW: Small questions -> Groq Compound Mini for speed + built-in search
 */
export function routeRequest(
  prompt: string,
  attachments: AttachedFile[] = [],
  userSelectedModel: ModelId = "lnv1"
): RouteDecision {
  const hasImages = attachments.some((a) => a.isImage && Boolean(a.dataUrl));
  const clean = prompt.trim();

  // 1. Vision Route (Photos, Screenshots) -> Lv1 Vision
  if (hasImages) {
    const tokens = calculateAdaptiveMaxTokens(clean, "lvision", "vision");
    return {
      modelId: "lvision",
      reason: "Скриншот или изображение обнаружено — подключен Lv1 Vision",
      maxCompletionTokens: tokens,
      isAutomaticRoute: userSelectedModel !== "lvision",
      category: "vision",
      useGroqCompound: false,
    };
  }

  // 2. Code, Tables & Long Text Route -> Lv1 Pro
  const isLargeOrCode =
    COMPLEX_CODE_PATTERNS.some((p) => p.test(clean)) ||
    clean.includes("```") ||
    clean.length > 800 ||
    (attachments.length > 0 && attachments.some((a) => (a.textContent?.length || 0) > 800));

  if (isLargeOrCode) {
    const tokens = calculateAdaptiveMaxTokens(clean, "lv1pro", "code");
    return {
      modelId: "lv1pro",
      reason: "Сложный анализ, длинный текст, код или таблицы — подключен Lv1 Pro 70B",
      maxCompletionTokens: tokens,
      isAutomaticRoute: userSelectedModel !== "lv1pro",
      category: "code",
      useGroqCompound: false,
    };
  }

  // 2.5 NEW: Small Question -> Groq Compound Mini (fastest, built-in tools)
  // If question is tiny (<80 chars) or small factual (<=200 chars), use compound
  if (isSmallQuestion(clean) && userSelectedModel !== "lv1pro" && userSelectedModel !== "lvision") {
    const tokens = calculateAdaptiveMaxTokens(clean, "lnv1", "compound");
    const isTiny = isTinyQuestion(clean);
    return {
      modelId: "lnv1",
      reason: isTiny
        ? "⚡ Крошечный вопрос — Groq Compound Mini (100-300 токенов, мгновенно)"
        : "⚡ Короткий вопрос — Groq Compound Mini с поиском (быстро + точно)",
      maxCompletionTokens: tokens,
      isAutomaticRoute: false,
      category: "compound",
      useGroqCompound: true,
    };
  }

  // 3. User explicitly picked Lv1 Pro
  if (userSelectedModel === "lv1pro") {
    const tokens = calculateAdaptiveMaxTokens(clean, "lv1pro", "chat");
    return {
      modelId: "lv1pro",
      reason: "Выбран режим Lv1 Pro — глубокий анализ",
      maxCompletionTokens: tokens,
      isAutomaticRoute: false,
      category: "chat",
      useGroqCompound: false,
    };
  }

  // 4. Fast Conversational Default -> LNv1
  // But still use adaptive tokens (was fixed 4096, now dynamic)
  const tokens = calculateAdaptiveMaxTokens(clean, "lnv1", "chat");
  const isSmallish = clean.length <= 200;
  return {
    modelId: "lnv1",
    reason: isSmallish ? "Быстрый ответ — LNv1 Fast (оптимизировано)" : "Быстрый ответ — LNv1 Fast",
    maxCompletionTokens: tokens,
    isAutomaticRoute: false,
    category: isSmallish ? "fact" : "chat",
    useGroqCompound: isSmallish,
  };
}
