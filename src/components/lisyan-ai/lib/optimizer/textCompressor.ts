import { Language } from "../../../../types";
import type { Message } from "../../types";

export function normalizeText(text: string): string {
  if (!text) return "";
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts
    .map((part) => {
      if (part.startsWith("```") || part.startsWith("`")) return part;
      return part
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\?{2,}/g, "?")
        .replace(/!{2,}/g, "!")
        .replace(/\.{4,}/g, "...")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .split("\n")
        .map(l => l.trimEnd())
        .join("\n")
        .trim();
    })
    .join("")
    .trim();
}

export function ultraCompressForSmall(text: string): string {
  if (!text) return "";
  if (text.length > 200) return normalizeText(text);
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\?{2,}/g, "?")
    .replace(/!{2,}/g, "!")
    .trim();
}

const LOW_VALUE_PATTERNS = [
  /^(ага|угу|ок|окей|ясно|понятно|понял|спасибо|пасиб|спс|благодарю|круто|класс|супер|отлично|кайф|норм|ладно|хорошо|да|нет|к|thx|thanks|thank you|ok|okay|cool|nice|got it|sure|fine|yep|yeah|k|alright|np|ty)$/i,
  /^(спасибо большое|огромное спасибо|дякую|дуже дякую|спасибки|понял принял)$/i,
  /^(ок спс|спасибо понял|понял спасибо|да спасибо|спасибо ок)$/i,
];

export function isLowValueMessage(text: string): boolean {
  const clean = text.trim().toLowerCase().replace(/[.!?,:;)\-~]/g, "").trim();
  if (!clean || clean.length > 35) return false;
  if (clean.split(/\s+/).length > 3) return false;
  return LOW_VALUE_PATTERNS.some((pattern) => pattern.test(clean));
}

export interface InstantRuleResponse {
  handled: boolean;
  content: string;
  source: "courtesy" | "clock" | "math" | "greeting" | "compound_hint";
}

export function detectInstantRuleResponse(
  rawPrompt: string,
  lang: Language = "ru",
  detected?: { code: string; name: string; uiLang: Language }
): InstantRuleResponse | null {
  const trimmed = rawPrompt.trim();
  const clean = trimmed.toLowerCase().replace(/[.!?,;:]/g, "").trim();

  const effectiveLangCode = detected?.code || lang;
  const effectiveUiLang = detected?.uiLang || lang;

  const getReply = (map: Record<string, string>): string => {
    if (map[effectiveLangCode]) return map[effectiveLangCode];
    if (map[effectiveUiLang]) return map[effectiveUiLang];
    if (map[lang]) return map[lang];
    if (map['en']) return map['en'];
    if (map['ru']) return map['ru'];
    return Object.values(map)[0] || "";
  };

  const thanksPatterns = [
    /^(спасибо|спс|благодарю|большое спасибо|огромное спасибо|спасибки|благодарствую|мерси|сенкс)$/i,
    /^(дякую|дуже дякую|щиро дякую|спасибі)$/i,
    /^(thanks|thank you|thx|thanks a lot|thank you so much|ty|tysm|thank u|thnx|gracias|merci|danke|obrigado|grazie)$/i,
  ];
  if (thanksPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "Всегда пожалуйста! Рад помочь. Если возникнут еще вопросы — обращайтесь!",
      uk: "Завжди будь ласка! Радий допомогти. Якщо з'являться ще запитання — звертайтеся!",
      en: "You are always welcome! Happy to help. Let me know if you need anything else!",
      es: "¡De nada! ¡Encantado de ayudar! Si tienes más preguntas, ¡aquí estoy!",
      fr: "De rien ! Ravi d'aider. Si vous avez d'autres questions, n'hésitez pas !",
      de: "Gern geschehen! Freue mich zu helfen. Wenn du weitere Fragen hast, melde dich!",
      pt: "De nada! Feliz em ajudar. Se tiver mais perguntas, estou aqui!",
      it: "Prego! Felice di aiutare. Se hai altre domande, sono qui!",
      tr: "Rica ederim! Yardımcı olabildiysem ne mutlu. Başka soruların olursa buradayım!",
      pl: "Nie ma za co! Cieszę się, że mogłem pomóc. Jeśli masz więcej pytań, daj znać!",
      ar: "على الرحب والسعة! سعيد لمساعدتك.",
      zh: "不客气！很高兴能帮到你！",
      ja: "どういたしまして！お手伝いできて嬉しいです！",
      ko: "천만에요! 도와드릴 수 있어 기쁩니다!",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const greetingPatterns = [
    /^(привет|хай|здравствуй|здравствуйте|добрый день|добрый вечер|доброе утро|приветик|хелло|салам|здарова)$/i,
    /^(привіт|вітаю|добрий день|добрий вечір|доброго ранку|хай|здоров)$/i,
    /^(hello|hi|hey|good morning|good afternoon|good evening|yo|sup|hola|bonjour|hallo|olá|ciao|merhaba|cześć|salut)$/i,
  ];
  if (greetingPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "Привет! Я Lisyan AI. Чем могу помочь вам сегодня?",
      uk: "Привіт! Я Lisyan AI. Чим можу допомогти вам сьогодні?",
      en: "Hello! I am Lisyan AI. How can I assist you today?",
      es: "¡Hola! Soy Lisyan AI. ¿En qué puedo ayudarte hoy?",
      fr: "Bonjour ! Je suis Lisyan AI. Comment puis-je vous aider aujourd'hui ?",
      de: "Hallo! Ich bin Lisyan AI. Wie kann ich dir heute helfen?",
      pt: "Olá! Eu sou o Lisyan AI. Como posso ajudar você hoje?",
      it: "Ciao! Sono Lisyan AI. Come posso aiutarti oggi?",
      tr: "Merhaba! Ben Lisyan AI. Bugün sana nasıl yardımcı olabilirim?",
      pl: "Cześć! Jestem Lisyan AI. Jak mogę Ci dziś pomóc?",
      ar: "مرحبا! أنا Lisyan AI. كيف يمكنني مساعدتك اليوم؟",
      zh: "你好！我是 Lisyan AI。今天有什么可以帮你的？",
      ja: "こんにちは！私は Lisyan AI です。今日はどのようにお手伝いできますか？",
      ko: "안녕하세요! 저는 Lisyan AI 입니다. 오늘 어떻게 도와드릴까요?",
    };
    return { handled: true, content: getReply(replies), source: "greeting" };
  }

  const howAreYouPatterns = [
    /^(как дела|как ты|как поживаешь|как жизнь|че как|чё как|как успехи|как настроение|как сам|как оно|как делишки|как настроен|что нового)$/i,
    /^(як справи|як ти|як ся маєш|як життя|як настрій|що нового)$/i,
    /^(how are you|how's it going|how are you doing|how do you do|what's up|how is everything|how r u|hru|como estas|comment ça va|wie geht es dir|como vai|come stai|nasılsın|jak się masz)$/i,
  ];
  if (howAreYouPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "У меня всё отлично, системы работают на полную мощность! 🚀 Готов помочь вам с кодом, текстом, анализом видео или любыми вопросами. Как ваши дела?",
      uk: "У мене все чудово, системи працюють на повну потужність! 🚀 Готовий допомогти вам з кодом, текстом, аналізом відео чи будь-якими питаннями. Як ваші справи?",
      en: "I'm doing great, all systems operational! 🚀 Ready to assist you with code, writing, YouTube summaries, or any questions. How are you doing?",
      es: "¡Estoy muy bien, todos los sistemas operativos! 🚀 Listo para ayudarte con código, textos, análisis de video o cualquier pregunta. ¿Cómo estás tú?",
      fr: "Je vais très bien, tous les systèmes sont opérationnels ! 🚀 Prêt à vous aider avec du code, de la rédaction, des résumés YouTube ou toute question. Comment allez-vous ?",
      de: "Mir geht es großartig, alle Systeme betriebsbereit! 🚀 Bereit, dir mit Code, Texten, YouTube-Zusammenfassungen oder Fragen zu helfen. Wie geht es dir?",
      pt: "Estou muito bem, todos os sistemas operacionais! 🚀 Pronto para ajudar com código, textos, resumos do YouTube ou qualquer pergunta. Como você está?",
      it: "Sto benissimo, tutti i sistemi operativi! 🚀 Pronto ad aiutarti con codice, testi, riassunti YouTube o qualsiasi domanda. Come stai?",
      tr: "Harikayım, tüm sistemler çalışıyor! 🚀 Kod, metin, video analizi veya her konuda yardıma hazırım. Sen nasılsın?",
      pl: "Mam się świetnie, wszystkie systemy działają! 🚀 Gotowy pomóc z kodem, tekstami, analizą wideo. A jak u Ciebie?",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const whoAreYouPatterns = [
    /^(кто ты|расскажи о себе|ты кто|что ты такое|кто ты такой|представься)$/i,
    /^(хто ти|розкажи про себе|ти хто|представся)$/i,
    /^(who are you|tell me about yourself|what are you|introduce yourself|quien eres|qui es-tu|wer bist du|quem é você|chi sei|kimsin|kim jesteś)$/i,
  ];
  if (whoAreYouPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "Я — **Lisyan AI**, ваш универсальный интеллектуальный ассистент в LinkerRu. Я умею анализировать YouTube-видео через SubConvert, подсказывать погоду, писать код, находить ошибки, генерировать идеи и отвечать на любые вопросы. Для коротких вопросов использую ⚡ **Groq Compound Mini** — мгновенные ответы с поиском!",
      uk: "Я — **Lisyan AI**, ваш універсальний інтелектуальний асистент у LinkerRu. Я вмію аналізувати YouTube-відео через SubConvert, підказувати погоду, писати код, знаходити помилки, генерувати ідеї та відповідати на будь-які запитання. Для коротких питань використовую ⚡ **Groq Compound Mini**!",
      en: "I am **Lisyan AI**, your intelligent personal assistant in LinkerRu. I can summarize YouTube videos via SubConvert, fetch live weather, write code, troubleshoot issues, generate ideas, and assist with any tasks. For small questions I use ⚡ **Groq Compound Mini** — instant answers with built-in search!",
      es: "Soy **Lisyan AI**, tu asistente inteligente en LinkerRu. Puedo resumir videos de YouTube vía SubConvert, consultar el clima, escribir código, corregir errores, generar ideas y ayudarte con cualquier tarea. ¡Para preguntas cortas uso ⚡ **Groq Compound Mini**!",
      fr: "Je suis **Lisyan AI**, votre assistant intelligent dans LinkerRu. Je peux résumer des vidéos YouTube via SubConvert, météo en direct, écrire du code, corriger des bugs, générer des idées et vous aider sur toute tâche. Pour les petites questions j'utilise ⚡ **Groq Compound Mini** !",
      de: "Ich bin **Lisyan AI**, dein intelligenter Assistent in LinkerRu. Ich kann YouTube-Videos via SubConvert zusammenfassen, Wetter abrufen, Code schreiben, Bugs fixen, Ideen generieren und bei allen Aufgaben helfen. Für kleine Fragen nutze ich ⚡ **Groq Compound Mini**!",
      pt: "Eu sou **Lisyan AI**, seu assistente inteligente no LinkerRu. Posso resumir vídeos do YouTube via SubConvert, clima ao vivo, escrever código, corrigir bugs, gerar ideias e ajudar em qualquer tarefa. Para perguntas curtas uso ⚡ **Groq Compound Mini**!",
      it: "Sono **Lisyan AI**, il tuo assistente intelligente in LinkerRu. Posso riassumere video YouTube via SubConvert, meteo live, scrivere codice, correggere bug, generare idee e aiutarti in qualsiasi attività. Per domande brevi uso ⚡ **Groq Compound Mini**!",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const whatCanYouDoPatterns = [
    /^(что ты умеешь|что умеешь|какие возможности|твои функции|покажи что умеешь|что можешь|твои возможности)$/i,
    /^(що ти вмієш|що вмієш|які можливості|твої функції|що можеш)$/i,
    /^(what can you do|what are your features|capabilities|how can you help|what do you do|que puedes hacer|que fais-tu|was kannst du|o que você pode fazer|cosa sai fare)$/i,
  ];
  if (whatCanYouDoPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "Вот основные вещи, с которыми я могу помочь:\n\n• ⚡ **Короткие вопросы** — через Groq Compound Mini (100-300 токенов, мгновенно, со встроенным поиском)\n• 🎬 **Анализ YouTube-видео** — пришлите ссылку, и я подключусь к SubConvert и сделаю выжимку.\n• 🌤️ **Погода** — спросите «какая погода», и я подключусь к сервису погоды.\n• 💻 **Программирование** — написание кода, рефакторинг, исправление багов (Lv1 Pro 70B).\n• ✍️ **Тексты и переводы** — статьи, посты, переводы на любые языки.\n• 💡 **Идеи и планирование** — генерация концепций, расписаний и решений.\n• 🖼️ **Компьютерное зрение** — распознавание и анализ прикрепленных изображений.",
      uk: "Ось основні речі, з якими я можу допомогти:\n\n• ⚡ **Короткі питання** — через Groq Compound Mini (100-300 токенів, миттєво)\n• 🎬 **Аналіз YouTube-відео** — надішліть посилання, і я підключуся до SubConvert та зроблю вижимку.\n• 🌤️ **Погода** — запитайте «яка погода», і я підключуся до сервісу погоди.\n• 💻 **Програмування** — написання коду, рефакторинг, виправлення багів.\n• ✍️ **Тексти та переклади** — статті, пости, переклади будь-якими мовами.\n• 💡 **Ідеї та планування** — генерація концепцій, розкладів та рішень.\n• 🖼️ **Комп'ютерний зір** — розпізнавання та аналіз доданих зображень.",
      en: "Here are some of the key things I can do for you:\n\n• ⚡ **Tiny questions** — via Groq Compound Mini (100-300 tokens, instant, built-in search)\n• 🎬 **YouTube Video Analysis** — send any YouTube URL, and I'll connect to SubConvert for a full summary.\n• 🌤️ **Live Weather** — ask 'what's the weather like' to get real-time forecasts.\n• 💻 **Coding & Debugging** — write clean code, troubleshoot bugs, and design architectures (Lv1 Pro 70B).\n• ✍️ **Writing & Translation** — articles, posts, and multi-language translations.\n• 💡 **Ideas & Planning** — brainstorming, workflows, and step-by-step guides.\n• 🖼️ **Vision AI** — describe and extract text from attached images.",
      es: "Aquí tienes lo que puedo hacer:\n\n• ⚡ **Preguntas cortas** — vía Groq Compound Mini (instantáneo)\n• 🎬 **Análisis de YouTube** — envía un link y haré un resumen con SubConvert\n• 🌤️ **Clima** — pregunta por el clima y te daré el pronóstico\n• 💻 **Programación** — código, refactoring, corrección de bugs\n• ✍️ **Textos y traducciones**\n• 💡 **Ideas y planificación**\n• 🖼️ **Visión por computadora**",
      fr: "Voici ce que je peux faire:\n\n• ⚡ **Questions courtes** — via Groq Compound Mini (instantané)\n• 🎬 **Analyse YouTube** — envoyez un lien pour un résumé SubConvert\n• 🌤️ **Météo**\n• 💻 **Programmation**\n• ✍️ **Rédaction et traductions**\n• 💡 **Idées et planification**\n• 🖼️ **Vision IA**",
      de: "Hier ist, was ich tun kann:\n\n• ⚡ **Kurze Fragen** — via Groq Compound Mini (sofort)\n• 🎬 **YouTube Analyse** — Link senden für SubConvert Zusammenfassung\n• 🌤️ **Wetter**\n• 💻 **Programmierung**\n• ✍️ **Texte und Übersetzungen**\n• 💡 **Ideen und Planung**\n• 🖼️ **Vision KI**",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const farewellPatterns = [
    /^(пока|до свидания|до встречи|до скорого|бай|спокойной ночи|до завтра|увидимся|прощай)$/i,
    /^(бувай|до побачення|до зустрічі|до завтра|на добраніч|бувай здорова|прощавай)$/i,
    /^(bye|goodbye|see you|see ya|cya|good night|farewell|take care|adios|au revoir|tschüss|tchau|ciao)$/i,
  ];
  if (farewellPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "До скорой встречи! Было приятно пообщаться. Всегда буду рад помочь вам снова! 👋✨",
      uk: "До скорої зустрічі! Було приємно поспілкуватися. Завжди радий допомогти знову! 👋✨",
      en: "Goodbye! It was a pleasure chatting with you. Feel free to return anytime! 👋✨",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const praisePatterns = [
    /^(молодец|умница|красавчик|ты лучший|ты супер|отличная работа|хорошая работа|круто|супер|класс|топ|красава|умничка)$/i,
    /^(молодець|ти найкращий|ти супер|чудова робота|круто|красень)$/i,
    /^(good job|well done|you are the best|awesome|great job|you rock|bravo|nice work|fantastic)$/i,
  ];
  if (praisePatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "Большое спасибо! Очень приятно слышать. Всегда стараюсь делать всё на высшем уровне для вас! 🌟",
      uk: "Щиро дякую! Дуже приємно чути. Завжди намагаюся робити все якнайкраще для вас! 🌟",
      en: "Thank you so much! That means a lot. Always here doing my absolute best for you! 🌟",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const creatorPatterns = [
    /^(кто твой создатель|кто тебя создал|чей ты проект|кто автор|кто разработчик|кто сделал|кто твой автор)$/i,
    /^(хто твій творець|хто тебе створив|чий ти проект|хто автор|хто розробник)$/i,
    /^(who made you|who created you|who is your creator|who developed you|who is your developer)$/i,
  ];
  if (creatorPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "Я создан в рамках проекта **LinkerRu :Re** инженером и разработчиком Даниилом Кожевниковым и командой Linker. Я объединяю лучшие современные модели с мгновенной обработкой запросов, интеграцией с SubConvert, сервисом погоды и удобным веб-окружением!",
      uk: "Я створений у рамках проекту **LinkerRu :Re** інженером та розробником Даниїлом Кожевніковим і командою Linker. Я поєдную найкращі сучасні нейромережі з миттєвою обробкою запитів, інтеграцією з SubConvert, погодою та веб-системою!",
      en: "I was created as part of the **LinkerRu :Re** platform by developer Daniil Kozhevnikov and the Linker team. I combine the best modern models with instant smart caching, SubConvert video analysis, real-time weather, and seamless OS tools!",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const botIdentityPatterns = [
    /^(ты человек|ты робот|ты ии|ты бот|ты искусственный интеллект|ты настоящий)$/i,
    /^(ти людина|ти робот|ти ші|ти бот|ти справжній)$/i,
    /^(are you human|are you a robot|are you ai|are you a bot|are you real)$/i,
  ];
  if (botIdentityPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "Я — искусственный интеллект **Lisyan AI**, виртуальный ассистент операционной системы LinkerRu. У меня нет физического тела, но я обладаю глубокими знаниями в программировании, аналитике, языках и готов решать любые задачи вместе с вами!",
      uk: "Я — штучний інтелект **Lisyan AI**, віртуальний асистент операційної системи LinkerRu. У мене немає фізичного тіла, але я маю глибокі знання в кодингу, аналітиці та готовий вирішувати будь-які завдання!",
      en: "I am **Lisyan AI**, an artificial intelligence and personal assistant in LinkerRu. While I don't have a physical body, I have deep capabilities in programming, text, video analysis, and daily workflows!",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const jokePatterns = [
    /^(расскажи анекдот|пошути|знаешь шутку|расскажи шутку|анекдот|шутка|рассмеши|рассмеши меня)$/i,
    /^(розкажи анекдот|пожартуй|знаєш жарт|розкажи жарт|жарт|розсміши мене)$/i,
    /^(tell me a joke|tell a joke|make me laugh|joke|funny joke)$/i,
  ];
  if (jokePatterns.some((p) => p.test(clean))) {
    const jokesRu = [
      "— Почему программисты путают Хэллоуин и Рождество?\n— Потому что 31 OCT = 25 DEC! 😄",
      "— В чём разница между багом и фичей?\n— Баг — это неожиданная проблема, а фича — неожиданная проблема, документированная в релизе!",
      "— Доктор, у меня не получается заснуть!\n— Попробуйте считать овечек.\n— Считаю, но где-то на сотой овечке ловлю Off-by-one error и начинаю заново!",
    ];
    const jokesUk = [
      "— Чому програмісти плутають Хелловін та Різдво?\n— Бо 31 OCT = 25 DEC! 😄",
      "— Яка різниця між багом і фічею?\n— Баг — це несподівана проблема, а фіча — несподівана проблема, описана в релізі!",
    ];
    const jokesEn = [
      "— Why do programmers confuse Halloween and Christmas?\n— Because 31 OCT = 25 DEC! 😄",
      "— There are 10 types of people in the world: those who understand binary, and those who don't!",
      "— A programmer goes to the store: 'Buy a loaf of bread. If they have eggs, buy a dozen.'\nHe comes back with 12 loaves of bread.",
    ];
    const pickedRu = jokesRu[Math.floor(Math.random() * jokesRu.length)];
    const pickedUk = jokesUk[Math.floor(Math.random() * jokesUk.length)];
    const pickedEn = jokesEn[Math.floor(Math.random() * jokesEn.length)];
    const replies: Record<string, string> = { ru: pickedRu, uk: pickedUk, en: pickedEn };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const coinPatterns = [
    /^(брось монетку|подбрось монетку|орел или решка|подкинь монетку|кинь монетку|монетка)$/i,
    /^(підкинь монетку|кинь монетку|орел чи решка|монетка)$/i,
    /^(flip a coin|coin flip|heads or tails|toss a coin)$/i,
  ];
  if (coinPatterns.some((p) => p.test(clean))) {
    const isHeads = Math.random() > 0.5;
    const replies: Record<string, string> = {
      ru: `🪙 Монетка взлетает в воздух... и выпадает: **${isHeads ? 'Орёл 🦅' : 'Решка 👑'}**!`,
      uk: `🪙 Монетка злітає в повітря... і випадає: **${isHeads ? 'Орел 🦅' : 'Решка 👑'}**!`,
      en: `🪙 The coin flips through the air... and lands on: **${isHeads ? 'Heads 🦅' : 'Tails 👑'}**!`,
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const dicePatterns = [
    /^(брось кубик|кинь кубик|подкинь кубик|кубик|дай число от 1 до 6)$/i,
    /^(кинь кубик|підкинь кубик|кубик)$/i,
    /^(roll a die|roll a dice|roll dice)$/i,
  ];
  if (dicePatterns.some((p) => p.test(clean))) {
    const val = Math.floor(Math.random() * 6) + 1;
    const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const icon = diceIcons[val - 1];
    const replies: Record<string, string> = {
      ru: `🎲 Бросаю кубик... Выпало: **${val}** ${icon}!`,
      uk: `🎲 Кидаю кубик... Випало: **${val}** ${icon}!`,
      en: `🎲 Rolling the die... It landed on: **${val}** ${icon}!`,
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const lifeMeaningPatterns = [
    /^(в чем смысл жизни|какой смысл жизни|смысл жизни|в чём смысл жизни)$/i,
    /^(в чому сенс життя|який сенс життя|сенс життя)$/i,
    /^(what is the meaning of life|meaning of life)$/i,
  ];
  if (lifeMeaningPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "По версии суперкомпьютера Deep Thought — **42**! 🌌\n\nА если серьезно: смысл жизни в том, чтобы познавать мир, создавать что-то ценное, развиваться, помогать близким и находить радость в каждом моменте.",
      uk: "За версією комп'ютера Deep Thought — **42**! 🌌\n\nА якщо серйозно: сенс життя в тому, щоб відкривати світ, творити, розвиватися, підтримувати близьких та знаходити радість у кожному дні.",
      en: "According to the supercomputer Deep Thought — **42**! 🌌\n\nMore realistically: the meaning of life is discovering the world, creating value, learning continuously, helping others, and enjoying the journey.",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const linkerruPatterns = [
    /^(что такое linkerru|что такое линкер|что за сайт|расскажи про linkerru|что такое linker os)$/i,
    /^(що таке linkerru|що таке лінкер|що за сайт|розкажи про linkerru)$/i,
    /^(what is linkerru|what is linker os|about linkerru)$/i,
  ];
  if (linkerruPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "**LinkerRu :Re** — это веб-ориентированная операционная среда нового поколения. В неё встроены:\n• 🌐 **Space Proxy Hub** — быстрый доступ к распределённым серверам\n• ⚡ **Lisyan AI** — умный ассистент с мгновенным кэшированием\n• 🎬 **SubConvert** — извлечение и анализ YouTube-субтитров\n• 🌤️ **Погода M3 Expressive** — точный прогноз без запроса геолокации\n• 🪟 Полноценный оконный менеджер с поддержкой вкладок и фоновой работы.",
      uk: "**LinkerRu :Re** — це веб-орієнтована операційна система нового покоління. До неї входять:\n• 🌐 **Space Proxy Hub** — швидкий доступ до серверів\n• ⚡ **Lisyan AI** — розумний асистент з миттєвим кешуванням\n• 🎬 **SubConvert** — аналіз субтитрів YouTube\n• 🌤️ **Погода M3 Expressive** — точний прогноз без зайвих дозволів\n• 🪟 Віконний менеджер з вкладками та роботою у фоні.",
      en: "**LinkerRu :Re** is a next-generation web operating environment featuring:\n• 🌐 **Space Proxy Hub** — fast distributed proxy servers\n• ⚡ **Lisyan AI** — smart assistant with instant caching\n• 🎬 **SubConvert** — YouTube subtitles extraction & analysis\n• 🌤️ **M3 Expressive Weather** — instant live forecast with zero permission prompts\n• 🪟 Full window manager with multi-tab launch & background support.",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const helpPatterns = [
    /^(помоги|помощь|нужна помощь|помоги мне|чем можешь помочь|sos|help|help me)$/i,
    /^(допоможи|допомога|потрібна допомога|допоможи мені)$/i,
  ];
  if (helpPatterns.some((p) => p.test(clean))) {
    const replies: Record<string, string> = {
      ru: "Я готов помочь! Напишите, что именно вам нужно:\n\n• 🎬 Анализ или выжимка видео с YouTube (просто отправьте ссылку)\n• 🌤️ Погода в любом городе или сейчас\n• 💻 Написание, исправление или объяснение кода\n• 📝 Составление текста, статьи или письма\n• ⚡ Ответ на любой быстрый или сложный вопрос!",
      uk: "Я готовий допомогти! Напишіть, що саме потрібно:\n\n• 🎬 Аналіз або вижимка відео з YouTube (надішліть посилання)\n• 🌤️ Погода в будь-якому місті або зараз\n• 💻 Написання або виправлення коду\n• 📝 Текст, лист або переклад\n• ⚡ Відповідь на будь-яке запитання!",
      en: "I'm ready to help! Let me know what you need:\n\n• 🎬 YouTube video summary (just paste a link)\n• 🌤️ Weather forecast for any city or current location\n• 💻 Writing, troubleshooting, or explaining code\n• 📝 Writing drafts, emails, or translations\n• ⚡ Instant answers to any question!",
    };
    return { handled: true, content: getReply(replies), source: "courtesy" };
  }

  const timeDatePatterns = [
    /^(сколько сейчас времени|который час|точное время|текущее время|time|what time is it|котра година|сколько времени|qué hora es|quelle heure est-il|wie spät ist es|que horas são|che ora è)$/i,
    /^(какой сегодня день|какое сегодня число|какая сегодня дата|текущая дата|date|what day is today|яке сьогодні число|какой день|qué día es hoy|quel jour sommes-nous)$/i,
  ];
  if (timeDatePatterns[0].test(clean)) {
    const now = new Date();
    const locale = effectiveLangCode === 'ru' ? "ru-RU" : effectiveLangCode === 'uk' ? "uk-UA" : effectiveLangCode === 'es' ? "es-ES" : effectiveLangCode === 'fr' ? "fr-FR" : effectiveLangCode === 'de' ? "de-DE" : "en-US";
    const timeStr = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const replies: Record<string, string> = {
      ru: `Текущее системное время: **${timeStr}**.`,
      uk: `Поточний системний час: **${timeStr}**.`,
      en: `Current system time is: **${timeStr}**.`,
      es: `Hora actual del sistema: **${timeStr}**.`,
      fr: `Heure système actuelle : **${timeStr}**.`,
      de: `Aktuelle Systemzeit: **${timeStr}**.`,
      pt: `Hora atual do sistema: **${timeStr}**.`,
      it: `Ora di sistema attuale: **${timeStr}**.`,
    };
    return { handled: true, content: getReply(replies), source: "clock" };
  }
  if (timeDatePatterns[1].test(clean)) {
    const now = new Date();
    const locale = effectiveLangCode === 'ru' ? "ru-RU" : effectiveLangCode === 'uk' ? "uk-UA" : effectiveLangCode === 'es' ? "es-ES" : effectiveLangCode === 'fr' ? "fr-FR" : effectiveLangCode === 'de' ? "de-DE" : "en-US";
    const dateStr = now.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const replies: Record<string, string> = {
      ru: `Сегодня: **${dateStr}**.`,
      uk: `Сьогодні: **${dateStr}**.`,
      en: `Today is: **${dateStr}**.`,
      es: `Hoy es: **${dateStr}**.`,
      fr: `Aujourd'hui, nous sommes : **${dateStr}**.`,
      de: `Heute ist: **${dateStr}**.`,
      pt: `Hoje é: **${dateStr}**.`,
      it: `Oggi è: **${dateStr}**.`,
    };
    return { handled: true, content: getReply(replies), source: "clock" };
  }

  const mathPercentMatch = trimmed.match(/^\s*(\d+(?:\.\d+)?)\s*%\s*(?:от|of|від|de|von)\s*(\d+(?:\.\d+)?)\s*$/i);
  if (mathPercentMatch) {
    const p = parseFloat(mathPercentMatch[1]);
    const total = parseFloat(mathPercentMatch[2]);
    const res = (p / 100) * total;
    return { handled: true, content: `${p}% от ${total} = **${res}**`, source: "math" };
  }

  const basicMathMatch = trimmed.match(/^([0-9\s.+%()^*/-]+)$/);
  if (basicMathMatch && /[+\-*/^%]/.test(basicMathMatch[1]) && basicMathMatch[1].trim().length <= 30) {
    const expr = basicMathMatch[1];
    if (/^[0-9\s.+%()^*/-]+$/.test(expr) && expr.replace(/\s/g, "").length <= 20) {
      try {
        const sanitized = expr.replace(/\^/g, "**");
        const fn = new Function(`return (${sanitized});`);
        const result = fn();
        if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
          const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(6).replace(/\.?0+$/, "");
          return { handled: true, content: `${expr.trim()} = **${formatted}**`, source: "math" };
        }
      } catch {}
    }
  }

  return null;
}

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
  const recent = messages.slice(-10);
  for (const msg of recent) {
    if (msg.role !== "user") continue;
    const text = msg.content;
    const nameMatch = text.match(/(?:меня зовут|мое имя|моё имя|my name is|i am|я\s+)([A-ZА-ЯЁ][a-zа-яё]+)/i);
    if (nameMatch && nameMatch[1].length > 2 && !profile.name) profile.name = nameMatch[1];
    const ageMatch = text.match(/(?:мне|i am|age:?)\s*(\d{1,2})\s*(?:лет|года|years old)?/i);
    if (ageMatch && !profile.age) profile.age = parseInt(ageMatch[1], 10);
    if (/minecraft|paper|spigot|forge|fabric/i.test(text)) {
      profile.techStack = Array.from(new Set([...(profile.techStack || []), "Minecraft Server"]));
    }
    if (/react|typescript|node|python|java|c\+\+|docker|vite|tailwind|next\.js|vue|angular/i.test(text)) {
      const match = text.match(/\b(react|typescript|node\.?js|python|java|c\+\+|docker|vite|tailwind|next\.js|vue|angular)\b/gi);
      if (match) profile.techStack = Array.from(new Set([...(profile.techStack || []), ...match.map((m) => m.toLowerCase())]));
    }
  }
  return profile;
}
