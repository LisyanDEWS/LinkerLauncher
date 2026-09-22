import type { Language } from "../../../types";

export interface DetectedLanguage {
  code: string;          // full detected code: 'ru','uk','en','es','fr','de','pt','it','ar','zh','ja', etc
  name: string;          // English name for prompting: "Russian", "English", "Spanish"
  uiLang: Language;      // mapped to closest UI lang for system prompts fallback: ru|uk|en
  confidence: number;    // 0-1
}

/**
 * Detects language of user input.
 * - Cyrillic → ru/uk
 * - Arabic, Chinese, Japanese, Korean, etc → specific
 * - Latin → heuristic scoring for major European languages
 * 
 * Always returns a valid detection; falls back to English for pure latin
 * and to UI language mapping for cache compatibility.
 */
export function detectInputLanguage(text: string, fallbackUiLang: Language = 'en'): DetectedLanguage {
  const trimmed = text.trim();
  if (!trimmed) {
    return { code: fallbackUiLang, name: langName(fallbackUiLang), uiLang: fallbackUiLang, confidence: 0 };
  }

  const lower = trimmed.toLowerCase();

  // --- Script-based detection (high confidence) ---
  if (/[\u0400-\u04FF]/.test(trimmed)) {
    // Cyrillic present — check Ukrainian specific letters
    if (/[іїєґ]/i.test(trimmed)) {
      return { code: 'uk', name: 'Ukrainian', uiLang: 'uk', confidence: 0.95 };
    }
    // If contains Ukrainian-only patterns like "'я", "ї" already handled
    // Default Cyrillic = Russian
    return { code: 'ru', name: 'Russian', uiLang: 'ru', confidence: 0.95 };
  }

  if (/[\u0600-\u06FF\u0750-\u077F]/.test(trimmed)) {
    return { code: 'ar', name: 'Arabic', uiLang: 'en', confidence: 0.95 };
  }
  if (/[\u4E00-\u9FFF]/.test(trimmed)) {
    // Could be Chinese, but also Japanese Kanji — check kana presence first below
    // If contains hiragana/katakana, it's Japanese
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
      return { code: 'ja', name: 'Japanese', uiLang: 'en', confidence: 0.95 };
    }
    return { code: 'zh', name: 'Chinese', uiLang: 'en', confidence: 0.9 };
  }
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
    return { code: 'ja', name: 'Japanese', uiLang: 'en', confidence: 0.95 };
  }
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(trimmed)) {
    return { code: 'ko', name: 'Korean', uiLang: 'en', confidence: 0.95 };
  }
  if (/[\u0590-\u05FF]/.test(trimmed)) {
    return { code: 'he', name: 'Hebrew', uiLang: 'en', confidence: 0.95 };
  }
  if (/[\u0E00-\u0E7F]/.test(trimmed)) {
    return { code: 'th', name: 'Thai', uiLang: 'en', confidence: 0.95 };
  }
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return { code: 'hi', name: 'Hindi', uiLang: 'en', confidence: 0.9 };
  }
  if (/[\u0370-\u03FF]/.test(trimmed)) {
    return { code: 'el', name: 'Greek', uiLang: 'en', confidence: 0.9 };
  }

  // --- Latin-based heuristic ---
  // Quick markers
  if (/[¿¡]/.test(trimmed) || /\b(qué|por qué|cómo|dónde|hola|gracias|por favor|buenos días)\b/i.test(lower)) {
    return { code: 'es', name: 'Spanish', uiLang: 'en', confidence: 0.85 };
  }
  if (/\b(bonjour|merci|comment|ça|voilà|au revoir|s'il vous plaît|pourquoi|parce que)\b/i.test(lower) || /[àâêîôûëïüçœæ]/i.test(trimmed) && /\b(le|la|de|et|est)\b/i.test(lower)) {
    // French has many accents, but check stronger
    if (scoreFrench(lower) >= 2) return { code: 'fr', name: 'French', uiLang: 'en', confidence: 0.8 };
  }
  if (/\b(hallo|wie geht|danke|bitte|tschüss|warum|weil|ich|du|guten morgen)\b/i.test(lower)) {
    if (scoreGerman(lower) >= 2) return { code: 'de', name: 'German', uiLang: 'en', confidence: 0.8 };
  }
  if (/\b(olá|obrigado|por favor|como vai|bom dia|você|por que|porque)\b/i.test(lower)) {
    return { code: 'pt', name: 'Portuguese', uiLang: 'en', confidence: 0.8 };
  }
  if (/\b(ciao|come stai|grazie|per favore|buongiorno|perché|perchè)\b/i.test(lower)) {
    return { code: 'it', name: 'Italian', uiLang: 'en', confidence: 0.8 };
  }
  if (/\b(halo|dzień dobry|dziękuję|proszę|jak się masz|dlaczego)\b/i.test(lower)) {
    return { code: 'pl', name: 'Polish', uiLang: 'en', confidence: 0.8 };
  }
  if (/\b(merhaba|teşekkür|nasılsın|lütfen|günaydın|neden|çünkü)\b/i.test(lower)) {
    return { code: 'tr', name: 'Turkish', uiLang: 'en', confidence: 0.8 };
  }
  if (/\b(привіт|дякую|будь ласка|як справи|чому|тому що)\b/i.test(lower)) {
    return { code: 'uk', name: 'Ukrainian', uiLang: 'uk', confidence: 0.9 };
  }
  if (/\b(привет|спасибо|пожалуйста|как дела|почему|потому что|здравствуйте)\b/i.test(lower)) {
    return { code: 'ru', name: 'Russian', uiLang: 'ru', confidence: 0.9 };
  }

  // Scoring fallback for latin
  const scores: Record<string, number> = {
    es: scoreSpanish(lower),
    fr: scoreFrench(lower),
    de: scoreGerman(lower),
    pt: scorePortuguese(lower),
    it: scoreItalian(lower),
    en: scoreEnglish(lower),
  };

  let bestCode = 'en';
  let bestScore = scores.en;
  for (const [code, sc] of Object.entries(scores)) {
    if (sc > bestScore) {
      bestScore = sc;
      bestCode = code;
    }
  }

  // If no clear winner and text is very short (<15 chars) — treat as same as fallback UI if latin
  // But requirement: answer in typed language, so for short generic latin like "hi", default English is fine
  if (bestScore === 0) {
    // Pure latin short — assume English unless UI is ru/uk and text is english-looking
    // If text contains only ascii and no strong markers, default to English
    return { code: 'en', name: 'English', uiLang: 'en', confidence: 0.5 };
  }

  return {
    code: bestCode,
    name: langName(bestCode as any),
    uiLang: bestCode === 'ru' ? 'ru' : bestCode === 'uk' ? 'uk' : 'en',
    confidence: Math.min(0.85, 0.4 + bestScore * 0.15),
  };
}

function langName(code: string): string {
  const map: Record<string, string> = {
    ru: 'Russian',
    uk: 'Ukrainian',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    it: 'Italian',
    pl: 'Polish',
    tr: 'Turkish',
    ar: 'Arabic',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    he: 'Hebrew',
    th: 'Thai',
    hi: 'Hindi',
    el: 'Greek',
  };
  return map[code] || code.charAt(0).toUpperCase() + code.slice(1);
}

function countMatches(text: string, words: string[]): number {
  let count = 0;
  for (const w of words) {
    const re = new RegExp(`\\b${escapeReg(w)}\\b`, 'i');
    if (re.test(text)) count++;
  }
  return count;
}
function escapeReg(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function scoreSpanish(t: string): number {
  return countMatches(t, ['el','la','de','que','y','en','un','es','por','con','para','como','hola','gracias','si','no','muy','pero','mi','tu','usted','que','porque','cuando','donde']);
}
function scoreFrench(t: string): number {
  return countMatches(t, ['le','la','de','et','est','un','une','pour','avec','je','tu','vous','il','elle','bonjour','merci','oui','non','mais','tres','comment','pourquoi','parce']);
}
function scoreGerman(t: string): number {
  return countMatches(t, ['der','die','das','und','ist','ein','eine','für','mit','ich','du','er','sie','hallo','danke','bitte','ja','nein','aber','sehr','wie','warum','weil']);
}
function scorePortuguese(t: string): number {
  return countMatches(t, ['o','a','de','que','e','para','com','como','ola','obrigado','sim','nao','muito','mas','meu','seu','porque','quando','onde']);
}
function scoreItalian(t: string): number {
  return countMatches(t, ['il','la','di','che','e','per','con','come','ciao','grazie','si','no','molto','ma','mio','tuo','perche','quando','dove']);
}
function scoreEnglish(t: string): number {
  return countMatches(t, ['the','and','is','are','what','how','hello','hi','please','thank','you','i','am','are','why','because','when','where','my','your','this','that','it','in','on','for']);
}

/**
 * Builds a critical language instruction to inject into system prompt.
 * This forces model to answer in detected language, not UI language.
 */
export function buildLanguageInstruction(detected: DetectedLanguage, uiLang: Language): string {
  // Strong, explicit instruction — works even with minimal prompts
  if (detected.code === uiLang) {
    // Same as UI, simple
    return `\n[Language: User wrote in ${detected.name}. Answer in ${detected.name}.]`;
  }
  // Different from UI — must override UI language bias
  return `\n[CRITICAL LANGUAGE RULE: The user's last message is written in ${detected.name} (code: ${detected.code}). You MUST answer in ${detected.name} ONLY. UI language is ${uiLang} but you must IGNORE it for the answer. Your entire response must be in ${detected.name}. If user wrote in ${detected.name}, answer in ${detected.name}. No mixing languages.]`;
}
