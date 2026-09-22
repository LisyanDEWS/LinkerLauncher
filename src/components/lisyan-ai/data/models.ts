import type { ModelInfo } from "../types";

export const MODELS: ModelInfo[] = [
  {
    id: "lnv1",
    name: "LNv1 Fast",
    tagline: "Short & Fast answers",
    description: "Быстрая высокопроизводительная модель для точных ответов, фактов и переводов.",
    apiModel: "openrouter/free",
    badge: "fast",
    limits: { rpd: "Unlimited", tpd: "Unlimited", tpm: "100K/min" },
    historyDepth: 10,
    maxTokens: 4096,
    temperature: 0.5,
  },
  {
    id: "lv1pro",
    name: "Lv1 Pro Smart",
    tagline: "Detailed answers, Code & Tables",
    description: "Мощная 70B+ модель для сложного анализа, длинных текстов, кода и форматированных таблиц.",
    apiModel: "meta-llama/llama-3.3-70b-instruct:free",
    badge: "pro 70b",
    limits: { rpd: "Unlimited", tpd: "Unlimited", tpm: "128K/min" },
    historyDepth: 16,
    maxTokens: 8192,
    temperature: 0.6,
  },
  {
    id: "lvision",
    name: "Lv1 Vision",
    tagline: "Visual reasoning & Images",
    description: "Компьютерное зрение: анализ скриншотов, схем, документов и изображений.",
    apiModel: "inclusionai/ling-3.0-flash-vl:free",
    badge: "vision",
    vision: true,
    limits: { rpd: "Unlimited", tpd: "Unlimited", tpm: "64K/min" },
    historyDepth: 10,
    maxTokens: 4096,
    temperature: 0.5,
  },
];

export function getModel(id: string): ModelInfo {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
