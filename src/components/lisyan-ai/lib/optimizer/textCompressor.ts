import { Language } from "../../../../types";
import type { Message } from "../../types";

/**
 * Normalizes text by removing redundant whitespaces, excessive punctuation runs,
 * and zero-width characters while preserving markdown code blocks.
 */
export function normalizeText(text: string): string {
  if (!text) return "";

  // Split into code blocks and normal text to preserve code indentation
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);

  return parts
    .map((part) => {
      // Keep code blocks intact
      if (part.startsWith("```") || part.startsWith("`")) {
        return part;
      }

      return part
        // Remove zero-width characters
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // Normalize multiple exclamation or question marks (e.g. ???? -> ?, !!! -> !)
        .replace(/\?{2,}/g, "?")
        .replace(/!{2,}/g, "!")
        // Normalize dots (e.g. ...... -> ...)
        .replace(/\.{4,}/g, "...")
        // Normalize multiple spaces and tabs to single space
        .replace(/[ \t]{2,}/g, " ")
        // Normalize multiple newlines (3+ newlines -> 2 newlines)
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    })
    .join("")
    .trim();
}

/**
 * Checks if a message has low informational value (e.g., courtesy acknowledgements)
 * that would needlessly pollute the LLM context window.
 */
const LOW_VALUE_PATTERNS = [
  /^(ага|угу|ок|окей|ясно|понятно|понял|спасибо|пасиб|спс|благодарю|круто|класс|супер|отлично|кайф|норм|ладно|хорошо|да|нет|к|thx|thanks|thank you|ok|okay|cool|nice|got it|sure|fine|yep|yeah|k|alright|np|ty)$/i,
  /^(спасибо большое|огромное спасибо|дякую|дуже дякую|спасибки|понял принял)$/i,
];

export function isLowValueMessage(text: string): boolean {
  const clean = text.trim().toLowerCase().replace(/[.!?,:;)\-~]/g, "");
  if (!clean || clean.length > 30) return false;
  return LOW_VALUE_PATTERNS.some((pattern) => pattern.test(clean));
}

export interface InstantRuleResponse {
  handled: boolean;
  content: string;
  source: "courtesy" | "clock" | "math" | "greeting";
}

/**
 * Checks if a user prompt can be handled instantly without invoking an LLM.
 * Returns instant response for greetings, courtesy replies, time/date, or simple math.
 */
export function detectInstantRuleResponse(
  rawPrompt: string,
  lang: Language = "ru"
): InstantRuleResponse | null {
  const clean = rawPrompt.trim().toLowerCase().replace(/[.!?,;:]/g, "");

  // 1. Courtesy / Thank-you responses
  const thanksPatterns = [
    /^(спасибо|спс|благодарю|большое спасибо|огромное спасибо|спасибки)$/i,
    /^(дякую|дуже дякую|щиро дякую)$/i,
    /^(thanks|thank you|thx|thanks a lot|thank you so much|ty)$/i,
  ];
  if (thanksPatterns.some((p) => p.test(clean))) {
    const replies = {
      ru: "Всегда пожалуйста! Рад помочь. Если возникнут еще вопросы — обращайтесь!",
      uk: "Завжди будь ласка! Радий допомогти. Якщо з'являться ще запитання — звертайтеся!",
      en: "You are always welcome! Happy to help. Let me know if you need anything else!",
    };
    return { handled: true, content: replies[lang] || replies.ru, source: "courtesy" };
  }

  // 2. Simple greetings without further text
  const greetingPatterns = [
    /^(привет|хай|здравствуй|здравствуйте|добрый день|добрый вечер|доброе утро)$/i,
    /^(привіт|вітаю|добрий день|добрий вечір|доброго ранку)$/i,
    /^(hello|hi|hey|good morning|good afternoon|good evening)$/i,
  ];
  if (greetingPatterns.some((p) => p.test(clean))) {
    const replies = {
      ru: "Привет! Я Lisyan AI. Чем могу помочь вам сегодня?",
      uk: "Привіт! Я Lisyan AI. Чим можу допомогти вам сьогодні?",
      en: "Hello! I am Lisyan AI. How can I assist you today?",
    };
    return { handled: true, content: replies[lang] || replies.ru, source: "greeting" };
  }

  // 2b. How are you / Как дела
  const howAreYouPatterns = [
    /^(как дела|как ты|как поживаешь|как жизнь|че как|чё как|как успехи|как настроение|как сам|как оно)$/i,
    /^(як справи|як ти|як ся маєш|як життя|як настрій)$/i,
    /^(how are you|how's it going|how are you doing|how do you do|what's up|how is everything)$/i,
  ];
  if (howAreYouPatterns.some((p) => p.test(clean))) {
    const replies = {
      ru: "У меня всё отлично, системы работают на полную мощность! 🚀 Готов помочь вам с кодом, текстом, анализом видео или любыми вопросами. Как ваши дела?",
      uk: "У мене все чудово, системи працюють на повну потужність! 🚀 Готовий допомогти вам з кодом, текстом, аналізом відео чи будь-якими питаннями. Як ваші справи?",
      en: "I'm doing great, all systems operational! 🚀 Ready to assist you with code, writing, YouTube summaries, or any questions. How are you doing?",
    };
    return { handled: true, content: replies[lang] || replies.ru, source: "courtesy" };
  }

  // 2c. Who are you / Кто ты
  const whoAreYouPatterns = [
    /^(кто ты|расскажи о себе|ты кто|что ты такое)$/i,
    /^(хто ти|розкажи про себе|ти хто)$/i,
    /^(who are you|tell me about yourself|what are you)$/i,
  ];
  if (whoAreYouPatterns.some((p) => p.test(clean))) {
    const replies = {
      ru: "Я — **Lisyan AI**, ваш универсальный интеллектуальный ассистент в LinkerRu. Я умею анализировать YouTube-видео через SubConvert, подсказывать погоду, писать код, находить ошибки, генерировать идеи и отвечать на любые вопросы.",
      uk: "Я — **Lisyan AI**, ваш універсальний інтелектуальний асистент у LinkerRu. Я вмію аналізувати YouTube-відео через SubConvert, підказувати погоду, писати код, знаходити помилки, генерувати ідеї та відповідати на будь-які запитання.",
      en: "I am **Lisyan AI**, your intelligent personal assistant in LinkerRu. I can summarize YouTube videos via SubConvert, fetch live weather, write code, troubleshoot issues, generate ideas, and assist with any tasks.",
    };
    return { handled: true, content: replies[lang] || replies.ru, source: "courtesy" };
  }

  // 2d. What can you do / Что ты умеешь
  const whatCanYouDoPatterns = [
    /^(что ты умеешь|что умеешь|какие возможности|твои функции|покажи что умеешь)$/i,
    /^(що ти вмієш|що вмієш|які можливості|твої функції)$/i,
    /^(what can you do|what are your features|capabilities|how can you help)$/i,
  ];
  if (whatCanYouDoPatterns.some((p) => p.test(clean))) {
    const replies = {
      ru: "Вот основные вещи, с которыми я могу помочь:\n\n• 🎬 **Анализ YouTube-видео** — пришлите ссылку, и я подключусь к SubConvert и сделаю выжимку.\n• 🌤️ **Погода** — спросите «какая погода», и я подключусь к сервису погоды.\n• 💻 **Программирование** — написание кода, рефакторинг, исправление багов.\n• ✍️ **Тексты и переводы** — статьи, посты, переводы на любые языки.\n• 💡 **Идеи и планирование** — генерация концепций, расписаний и решений.\n• 🖼️ **Компьютерное зрение** — распознавание и анализ прикрепленных изображений.",
      uk: "Ось основні речі, з якими я можу допомогти:\n\n• 🎬 **Аналіз YouTube-відео** — надішліть посилання, і я підключуся до SubConvert та зроблю вижимку.\n• 🌤️ **Погода** — запитайте «яка погода», і я підключуся до сервісу погоди.\n• 💻 **Програмування** — написання коду, рефакторинг, виправлення багів.\n• ✍️ **Тексти та переклади** — статті, пости, переклади будь-якими мовами.\n• 💡 **Ідеї та планування** — генерація концепцій, розкладів та рішень.\n• 🖼️ **Комп'ютерний зір** — розпізнавання та аналіз доданих зображень.",
      en: "Here are some of the key things I can do for you:\n\n• 🎬 **YouTube Video Analysis** — send any YouTube URL, and I'll connect to SubConvert for a full summary.\n• 🌤️ **Live Weather** — ask 'what's the weather like' to get real-time forecasts.\n• 💻 **Coding & Debugging** — write clean code, troubleshoot bugs, and design architectures.\n• ✍️ **Writing & Translation** — articles, posts, and multi-language translations.\n• 💡 **Ideas & Planning** — brainstorming, workflows, and step-by-step guides.\n• 🖼️ **Vision AI** — describe and extract text from attached images.",
    };
    return { handled: true, content: replies[lang] || replies.ru, source: "courtesy" };
  }

  // 3. Current Time & Date requests
  const timeDatePatterns = [
    /^(сколько сейчас времени|который час|точное время|текущее время|time|what time is it|котра година)$/i,
    /^(какой сегодня день|какое сегодня число|какая сегодня дата|текущая дата|date|what day is today|яке сьогодні число)$/i,
  ];
  if (timeDatePatterns[0].test(clean)) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString(lang === "ru" ? "ru-RU" : lang === "uk" ? "uk-UA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const replies = {
      ru: `Текущее системное время: **${timeStr}**.`,
      uk: `Поточний системний час: **${timeStr}**.`,
      en: `Current system time is: **${timeStr}**.`,
    };
    return { handled: true, content: replies[lang] || replies.ru, source: "clock" };
  }
  if (timeDatePatterns[1].test(clean)) {
    const now = new Date();
    const dateStr = now.toLocaleDateString(lang === "ru" ? "ru-RU" : lang === "uk" ? "uk-UA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const replies = {
      ru: `Сегодня: **${dateStr}**.`,
      uk: `Сьогодні: **${dateStr}**.`,
      en: `Today is: **${dateStr}**.`,
    };
    return { handled: true, content: replies[lang] || replies.ru, source: "clock" };
  }

  // 4. Basic deterministic math (e.g., "2+2", "15 * 8", "100 / 4", "sqrt(144)", "15% of 200")
  const mathPercentMatch = rawPrompt.match(/^\s*(\d+(?:\.\d+)?)\s*%\s*(?:от|of|від)\s*(\d+(?:\.\d+)?)\s*$/i);
  if (mathPercentMatch) {
    const p = parseFloat(mathPercentMatch[1]);
    const total = parseFloat(mathPercentMatch[2]);
    const res = (p / 100) * total;
    return {
      handled: true,
      content: `${p}% от ${total} = **${res}**`,
      source: "math",
    };
  }

  const basicMathMatch = rawPrompt.trim().match(/^([0-9\s.+\-*/%()^]+)$/);
  if (basicMathMatch && /[+\-*/^%]/.test(basicMathMatch[1])) {
    const expr = basicMathMatch[1];
    // Safety check: ensure no dangerous tokens
    if (/^[0-9\s.+\-*/%()^]+$/.test(expr)) {
      try {
        const sanitized = expr.replace(/\^/g, "**");
        // Safe evaluation for basic arithmetic
        const fn = new Function(`return (${sanitized});`);
        const result = fn();
        if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
          return {
            handled: true,
            content: `${expr.trim()} = **${result}**`,
            source: "math",
          };
        }
      } catch {
        /* fallback to normal LLM */
      }
    }
  }

  return null;
}

/**
 * Extracts structured user facts (name, age, preferences, tech stack, goals)
 * from past messages to prevent repeating redundant data in each turn.
 */
export interface UserFactsProfile {
  name?: string;
  age?: number | string;
  language?: string;
  techStack?: string[];
  projectGoal?: string;
  preferences?: string[];
}

export function extractUserFacts(messages: Message[]): UserFactsProfile {
  const profile: UserFactsProfile = {};

  for (const msg of messages) {
    if (msg.role !== "user") continue;
    const text = msg.content;

    // Extract Name (e.g. "Меня зовут Даниил", "I am Daniil", "My name is...")
    const nameMatch = text.match(/(?:меня зовут|мое имя|моё имя|my name is|i am|я\s+)([A-ZА-ЯЁ][a-zа-яё]+)/i);
    if (nameMatch && nameMatch[1].length > 2 && !profile.name) {
      profile.name = nameMatch[1];
    }

    // Extract Age (e.g. "мне 16", "мне 16 лет", "i am 16 years old")
    const ageMatch = text.match(/(?:мне|i am|age:?)\s*(\d{1,2})\s*(?:лет|года|years old)?/i);
    if (ageMatch && !profile.age) {
      profile.age = parseInt(ageMatch[1], 10);
    }

    // Extract Key Projects/Tech mentions
    if (/minecraft|paper|spigot|forge|fabric/i.test(text)) {
      profile.techStack = Array.from(new Set([...(profile.techStack || []), "Minecraft Server"]));
    }
    if (/react|typescript|node|python|java|c\+\+|docker|vite|tailwind/i.test(text)) {
      const match = text.match(/\b(react|typescript|node\.?js|python|java|c\+\+|docker|vite|tailwind)\b/gi);
      if (match) {
        profile.techStack = Array.from(new Set([...(profile.techStack || []), ...match.map((m) => m.toLowerCase())]));
      }
    }
  }

  return profile;
}
