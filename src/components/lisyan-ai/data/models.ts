import type { ModelInfo } from "../types";

export const MODELS: ModelInfo[] = [
  {
    id: "lnv1",
    name: "LNv1",
    tagline: "Short answers",
    description: "Быстрая экономичная модель для коротких определений, фактов и переводов (100–180 токенов).",
    apiModel: "groq/compound-mini",
    badge: "economy",
    limits: { rpd: "1K req/day", tpd: "200K tokens", tpm: "8K/min" },
    historyDepth: 6,
    maxTokens: 500,
    temperature: 0.4,
  },
  {
    id: "lv1pro",
    name: "Lv1 Pro",
    tagline: "Detailed answers & Code",
    description: "Мощная модель для сложного кода, архитектуры, рефакторинга и алгоритмов (1200–1800 токенов).",
    apiModel: "openai/gpt-oss-120b",
    badge: "unlimited",
    limits: { rpd: "250 req/day", tpd: "unlimited", tpm: "70K/min" },
    historyDepth: 10,
    maxTokens: 1800,
    temperature: 0.7,
  },
  {
    id: "lvision",
    name: "Lv1 Vision",
    tagline: "Sees images",
    description: "Компьютерное зрение: анализ скриншотов, схем и изображений (500–800 токенов).",
    apiModel: "qwen/qwen3.8-27b",
    badge: "vision",
    vision: true,
    limits: { rpd: "1K req/day", tpd: "200K tokens", tpm: "7K/min" },
    historyDepth: 6,
    maxTokens: 800,
    temperature: 0.6,
  },
];

export function getModel(id: string): ModelInfo {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
