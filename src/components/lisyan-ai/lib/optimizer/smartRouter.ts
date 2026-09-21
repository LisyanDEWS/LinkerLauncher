import type { ModelId, AttachedFile } from "../../types";

export interface RouteDecision {
  modelId: ModelId;
  reason: string;
  maxCompletionTokens: number;
  isAutomaticRoute: boolean;
  category: "fact" | "chat" | "code" | "vision";
}

/**
 * Keywords and syntactic markers for complex programming, algorithms, architecture, and debugging.
 */
const COMPLEX_CODE_PATTERNS = [
  /\b(напиши код|напиши скрипт|напиши функцию|разработай|архитектур|алгоритм|рефакторинг|sql|баз[аы] данных|микросервис|docker|kubernetes|typescript|javascript|python|c\+\+|c#|rust|golang|react|vue|node\.js|express|api endpoint|unit test|debug|исправь ошибку|исправь баг|оптимизируй код|рекурси|структур[аы] данных|паттерн|ооп|бэкенд|фронтенд|компонент|хук|json схема|rest api|graphql)\b/i,
  /\b(write code|implement|refactor|optimize algorithm|database schema|design architecture|complex code|full script|unit tests|debug error|fix bug|regex|typescript|python|react hook|dockerfile)\b/i,
  /```|\bfunction\s*\(|\bconst\s+\w+\s*=|\bclass\s+\w+|\bimport\s+.*from|\bdef\s+\w+\(|\bSELECT\s+.*FROM\b|\bCREATE\s+TABLE\b/i,
];

/**
 * Keywords and patterns identifying short factual lookups, translations, and definitions.
 */
const SHORT_FACT_PATTERNS = [
  /\b(размер sim|sim-карт|сим карт|nano-sim|micro-sim|что такое|кто такой|кто автор|в каком году|столиц[аеы]|переведи|перевод слов|синоним к|антоним к|размер|сколько|когда был|кто президент|в чем разница|как расшифровывается|определение|что значит|кто открыл|формула|дата рождения|температура кипения|расстояние от|скорость света)\b/i,
  /\b(who is|what is|capital of|translate|size of|definition of|meaning of|when was|how many|who invented|formula of)\b/i,
  /\b(в двух словах|кратко|одним предложением|in one sentence|briefly|short answer|1 слово|одним словом)\b/i,
];

/**
 * Calculates adaptive max_completion_tokens matching the exact user specification:
 * - Short facts / definitions / translations: 100–180 tokens
 * - Standard conversations / general Q&A: 400–600 tokens
 * - Complex code / architecture / algorithms: 1200–1800 tokens
 * - Screenshots / images (vision): 500–800 tokens
 */
export function calculateAdaptiveMaxTokens(
  prompt: string,
  modelId: ModelId,
  category?: "fact" | "chat" | "code" | "vision"
): number {
  const clean = prompt.trim();

  // 1. Vision (Images & screenshots)
  if (category === "vision" || modelId === "lvision") {
    if (clean.length < 80) return 550;
    return 750; // 500–800 tokens
  }

  // 2. Complex Coding, Architecture, Algorithms
  if (
    category === "code" ||
    COMPLEX_CODE_PATTERNS.some((p) => p.test(clean)) ||
    clean.includes("```") ||
    clean.length > 600
  ) {
    if (clean.length > 400) return 1800; // Deep code / architecture
    return 1400; // 1200–1800 tokens
  }

  // 3. Short definitions, facts, translations («Какой размер SIM?», «Что такое DNS?»)
  const isShortFact =
    SHORT_FACT_PATTERNS.some((p) => p.test(clean)) ||
    (clean.length < 80 && !clean.includes("\n") && (clean.endsWith("?") || clean.startsWith("что") || clean.startsWith("кто")));

  if (isShortFact && !COMPLEX_CODE_PATTERNS.some((p) => p.test(clean))) {
    if (clean.length < 40) return 120; // 100–180 tokens
    return 160; // 100–180 tokens
  }

  // 4. Standard conversations / explanations / advice
  if (clean.length < 150) return 450; // 400–600 tokens
  return 550; // 400–600 tokens
}

/**
 * Intelligently routes the user's prompt to the optimal Groq model
 * and dynamically assigns the adaptive max_completion_tokens limit.
 */
export function routeRequest(
  prompt: string,
  attachments: AttachedFile[] = [],
  userSelectedModel: ModelId = "lnv1"
): RouteDecision {
  const hasImages = attachments.some((a) => a.isImage && Boolean(a.dataUrl));
  const clean = prompt.trim();

  // 1. Vision Route (Photos, Screenshots) -> Lv1 Vision (qwen/qwen3.8-27b)
  if (hasImages) {
    const tokens = calculateAdaptiveMaxTokens(clean, "lvision", "vision");
    return {
      modelId: "lvision",
      reason: "Скриншот или изображение обнаружено — подключен Lv1 Vision (qwen/qwen3.8-27b)",
      maxCompletionTokens: tokens,
      isAutomaticRoute: userSelectedModel !== "lvision",
      category: "vision",
    };
  }

  // 2. Code & Architecture Route -> Lv1 Pro (openai/gpt-oss-120b)
  const isCodeOrArchitecture =
    COMPLEX_CODE_PATTERNS.some((p) => p.test(clean)) ||
    clean.includes("```") ||
    (attachments.length > 0 && attachments.some((a) => (a.textContent?.length || 0) > 1500));

  if (isCodeOrArchitecture) {
    const tokens = calculateAdaptiveMaxTokens(clean, "lv1pro", "code");
    return {
      modelId: "lv1pro",
      reason: "Сложный код, архитектура или алгоритмы — подключен Lv1 Pro (openai/gpt-oss-120b)",
      maxCompletionTokens: tokens,
      isAutomaticRoute: userSelectedModel !== "lv1pro",
      category: "code",
    };
  }

  // 3. Short Fact / Definition / Translation Route -> LNv1 (groq/compound-mini)
  const isShortFact =
    SHORT_FACT_PATTERNS.some((p) => p.test(clean)) ||
    (clean.length < 80 && (clean.endsWith("?") || clean.startsWith("что ") || clean.startsWith("кто ") || clean.startsWith("переведи ")));

  if (isShortFact && userSelectedModel === "lnv1") {
    const tokens = calculateAdaptiveMaxTokens(clean, "lnv1", "fact");
    return {
      modelId: "lnv1",
      reason: "Короткий факт / определение / перевод — экономичный LNv1 (groq/compound-mini)",
      maxCompletionTokens: tokens,
      isAutomaticRoute: false,
      category: "fact",
    };
  }

  // 4. If user explicitly picked Lv1 Pro for general chat
  if (userSelectedModel === "lv1pro") {
    const tokens = calculateAdaptiveMaxTokens(clean, "lv1pro", "chat");
    return {
      modelId: "lv1pro",
      reason: "Выбран режим Lv1 Pro — подробный ответ",
      maxCompletionTokens: tokens,
      isAutomaticRoute: false,
      category: "chat",
    };
  }

  // 5. Standard Conversational Default -> LNv1
  const tokens = calculateAdaptiveMaxTokens(clean, "lnv1", "chat");
  return {
    modelId: "lnv1",
    reason: "Стандартный диалог — LNv1 (groq/compound-mini)",
    maxCompletionTokens: tokens,
    isAutomaticRoute: false,
    category: "chat",
  };
}
