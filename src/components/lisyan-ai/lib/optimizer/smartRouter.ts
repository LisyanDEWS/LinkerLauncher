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
  /\b(напиши код|напиши скрипт|напиши функцию|разработай|архитектур|алгоритм|рефакторинг|sql|баз[аы] данных|микросервис|docker|kubernetes|typescript|javascript|python|c\+\+|c#|rust|golang|react|vue|node\.js|express|api endpoint|unit test|debug|исправь ошибку|исправь баг|оптимизируй код|рекурси|структур[аы] данных|паттерн|ооп|бэкенд|фронтенд|компонент|хук|json схема|rest api|graphql|таблиц[ауеы]|создай таблицу|сделай таблицу|сравни в таблице)\b/i,
  /\b(write code|implement|refactor|optimize algorithm|database schema|design architecture|complex code|full script|unit tests|debug error|fix bug|regex|typescript|python|react hook|dockerfile|markdown table|create table|comparison table)\b/i,
  /```|\bfunction\s*\(|\bconst\s+\w+\s*=|\bclass\s+\w+|\bimport\s+.*from|\bdef\s+\w+\(|\bSELECT\s+.*FROM\b|\bCREATE\s+TABLE\b/i,
];

/**
 * Calculates adaptive max_completion_tokens:
 * Ensures responses are never truncated and long texts have full generation room.
 */
export function calculateAdaptiveMaxTokens(
  prompt: string,
  modelId: ModelId,
  category?: "fact" | "chat" | "code" | "vision"
): number {
  const clean = prompt.trim();

  // 1. Vision (Images & screenshots)
  if (category === "vision" || modelId === "lvision") {
    return 4096;
  }

  // 2. Complex Coding, Architecture, Tables, Large text analysis
  if (
    category === "code" ||
    COMPLEX_CODE_PATTERNS.some((p) => p.test(clean)) ||
    clean.includes("```") ||
    clean.length > 500
  ) {
    return 8192;
  }

  // 3. Standard queries and conversations (no artificial clipping)
  return 4096;
}

/**
 * Intelligently routes the user's prompt to the optimal model
 * and dynamically assigns the completion limit.
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
    };
  }

  // 4. Fast Conversational Default -> LNv1
  const tokens = calculateAdaptiveMaxTokens(clean, "lnv1", "chat");
  return {
    modelId: "lnv1",
    reason: "Быстрый ответ — LNv1 Fast",
    maxCompletionTokens: tokens,
    isAutomaticRoute: false,
    category: "chat",
  };
}
