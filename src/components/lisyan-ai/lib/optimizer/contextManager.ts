import type { Message, ModelId, AttachedFile } from "../../types";
import { getModel } from "../../data/models";
import { Language } from "../../../../types";
import { normalizeText, isLowValueMessage, extractUserFacts } from "./textCompressor";
import { isSmallQuestion, isTinyQuestion } from "./smartRouter";

export interface OptimizedContextResult {
  apiMessages: {
    role: "system" | "user" | "assistant";
    content: string | any[];
  }[];
  originalTokenEstimate: number;
  optimizedTokenEstimate: number;
  tokensSaved: number;
  savingsPercentage: number;
  usedSummary: boolean;
  filteredMessageCount: number;
  extractedFactsSummary?: string;
}

/**
 * Calculates approximate tokens from character count (typically ~3.8 chars per token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.8);
}

/**
 * RAG Document Chunk Relevance Search:
 * Breaks long attached text documents into semantic chunks and selects
 * the top most relevant chunks for the user's specific prompt.
 */
export function extractRelevantChunks(
  docText: string,
  query: string,
  maxChunks: number = 6,
  chunkSize: number = 3000
): string {
  const isSmall = query.trim().length <= 200;
  const effectiveMaxChunks = isSmall ? Math.min(maxChunks, 3) : maxChunks;
  const effectiveChunkSize = isSmall ? 2000 : chunkSize;

  const cap = 28000;
  if (!docText || docText.length <= cap) {
    return normalizeText(docText);
  }

  // Split into paragraphs / sections
  const rawParagraphs = docText.split(/\n\s*\n/);
  const chunks: string[] = [];

  let currentChunk = "";
  for (const para of rawParagraphs) {
    if ((currentChunk + "\n" + para).length > effectiveChunkSize && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  // Extract query keywords
  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTerms.length === 0) {
    return chunks.slice(0, effectiveMaxChunks).join("\n\n---\n\n");
  }

  const scoredChunks = chunks.map((chunk, index) => {
    const lower = chunk.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const occurrences = (lower.match(new RegExp(`\\b${term}`, "gi")) || []).length;
      score += occurrences * 2;
      if (lower.includes(term)) score += 1;
    }

    if (index === 0) score += 0.5;

    return { chunk, score, index };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, effectiveMaxChunks);
  topChunks.sort((a, b) => a.index - b.index);

  return topChunks.map((c) => c.chunk).join("\n\n[... фрагмент документа ...]\n\n");
}

/**
 * Compresses an array of older messages into a compact SUMMARY text block.
 */
function summarizeOlderMessages(olderMessages: Message[], lang: Language): string {
  const points: string[] = [];
  const userTopics: string[] = [];

  for (const msg of olderMessages) {
    if (isLowValueMessage(msg.content)) continue;
    const clean = normalizeText(msg.content);
    if (!clean) continue;

    if (msg.role === "user") {
      const maxLen = 120;
      const summaryLine = clean.length > maxLen ? clean.slice(0, maxLen - 3) + "..." : clean;
      userTopics.push(summaryLine);
    } else {
      const firstSentence = clean.split(/[.!?\n]/)[0]?.trim();
      if (firstSentence && firstSentence.length > 15) {
        const maxLen = 100;
        points.push(firstSentence.length > maxLen ? firstSentence.slice(0, maxLen - 3) + "..." : firstSentence);
      }
    }
  }

  const topicCount = userTopics.slice(-4);
  const summaryHeader =
    lang === "ru"
      ? "КРАТКАЯ СВОДКА ПРЕДЫДУЩЕГО ДИАЛОГА:"
      : lang === "uk"
      ? "КОРОТКИЙ ЗМІСТ ПОПЕРЕДНЬОГО ДІАЛОГУ:"
      : "SUMMARY OF PREVIOUS CONVERSATION:";

  const lines = topicCount.map((t) => `• ${t}`);
  return `${summaryHeader}\n${lines.join("\n")}`;
}

export function buildOptimizedContext(
  messages: Message[],
  modelId: ModelId,
  systemPrompt: string,
  lang: Language = "ru",
  vision: boolean = false
): OptimizedContextResult {
  const info = getModel(modelId);
  let originalChars = systemPrompt.length;
  for (const m of messages) {
    originalChars += m.content.length;
    for (const f of m.attachments || []) {
      originalChars += f.textContent?.length || 0;
    }
  }
  const originalTokenEstimate = estimateTokens(String(originalChars));

  const latestMsgRaw = messages[messages.length - 1];
  const latestQuery = latestMsgRaw?.content || "";
  const isTiny = isTinyQuestion(latestQuery);

  // 1. Filter out low-value messages
  let filteredCount = 0;
  const filteredMessages: Message[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLatest = i === messages.length - 1;
    if (!isLatest && isLowValueMessage(msg.content) && (!msg.attachments || msg.attachments.length === 0)) {
      filteredCount++;
      continue;
    }
    filteredMessages.push(msg);
  }

  // 2. Extract structured user profile facts
  let factsHeader = "";
  let factsStrings: string[] = [];
  if (!isTiny) {
    const facts = extractUserFacts(filteredMessages);
    if (facts.name) factsStrings.push(`User: ${facts.name}`);
    if (facts.age) factsStrings.push(`Age: ${facts.age}`);
    if (facts.techStack && facts.techStack.length > 0) factsStrings.push(`Tech: ${facts.techStack.join(", ")}`);
    factsHeader = factsStrings.length > 0 ? `\n[User Profile: { ${factsStrings.join(", ")} }]` : "";
  }

  // 3. Separate older messages from recent turns
  const RECENT_TURNS = isTiny ? 2 : 4;
  const totalCount = filteredMessages.length;
  let usedSummary = false;
  let historyToSend: Message[] = [];
  let summaryBlock = "";

  if (totalCount > RECENT_TURNS + 1) {
    usedSummary = true;
    const olderMessages = filteredMessages.slice(0, totalCount - RECENT_TURNS);
    historyToSend = filteredMessages.slice(totalCount - RECENT_TURNS);
    summaryBlock = summarizeOlderMessages(olderMessages, lang);
  } else {
    historyToSend = filteredMessages.slice(-info.historyDepth);
  }

  // 4. Assemble API messages
  const apiMessages: { role: "system" | "user" | "assistant"; content: any }[] = [];

  let fullSystemContent = systemPrompt + factsHeader;
  if (usedSummary && summaryBlock) {
    fullSystemContent += `\n\n${summaryBlock}`;
  }

  apiMessages.push({ role: "system", content: fullSystemContent });

  // Process history messages
  for (let idx = 0; idx < historyToSend.length; idx++) {
    const msg = historyToSend[idx];
    const isLatest = idx === historyToSend.length - 1;
    const files = msg.attachments || [];
    const textFiles = files.filter((f) => f.textContent);
    const otherFiles = files.filter((f) => !f.textContent && !f.isImage);
    const images = files.filter((f) => f.isImage && f.dataUrl);

    const textChunks: string[] = [];

    // File attachments & Word documents handling (supports docx, doc, rtf, pdf, text)
    for (const f of textFiles) {
      const ext = f.name.split(".").pop() || "";
      if (isLatest) {
        const rawContent = f.textContent || "";
        const maxLen = 32000;
        const documentBody = rawContent.length > maxLen
          ? rawContent.slice(0, maxLen) + `\n\n[...документ продолжается: показано ${maxLen} символов из ${rawContent.length}]`
          : rawContent;
        textChunks.push(`📄 Содержимое документа "${f.name}":\n\`\`\`${ext}\n${documentBody}\n\`\`\``);
      } else {
        textChunks.push(`[Документ: ${f.name}]`);
      }
    }

    for (const f of otherFiles) {
      textChunks.push(`[Вложение: ${f.name}, ${Math.round(f.size / 1024)} KB]`);
    }

    let normalizedBody = normalizeText(msg.content);
    if (!isLatest && normalizedBody.length > 300) {
      normalizedBody = normalizedBody.slice(0, 297) + "...";
    }

    if (normalizedBody) {
      textChunks.push(normalizedBody);
    } else if (isLatest && textFiles.length > 0) {
      textChunks.push(
        lang === "ru"
          ? "Пожалуйста, подробно проанализируй прикрепленный документ: выдели ключевые тезисы, важную информацию и выводы."
          : "Please carefully analyze the attached document: highlight key points, important information, and conclusions."
      );
    } else if (isLatest && images.length > 0) {
      textChunks.push(
        lang === "ru"
          ? "Пожалуйста, подробно проанализируй прикрепленное изображение: опиши, что на нем изображено, видимый текст и ключевые детали."
          : "Please analyze the attached image in detail: describe what is depicted, all visible text, and key details."
      );
    } else if (textChunks.length === 0 && images.length === 0) {
      textChunks.push("...");
    }

    let finalContent = textChunks.join("\n\n");

    // Vision images handling (supports webp, jpeg, png, gif, bmp, etc.)
    if (isLatest && msg.role === "user" && images.length > 0) {
      const parts: any[] = [{ type: "text", text: finalContent }];
      for (const img of images.slice(0, 5)) {
        parts.push({ type: "image_url", image_url: { url: img.dataUrl! } });
      }
      apiMessages.push({ role: "user", content: parts });
    } else {
      if (images.length > 0) {
        finalContent += `\n\n[Изображения: ${images.map((i) => i.name).join(", ")}]`;
      }
      apiMessages.push({ role: msg.role, content: finalContent });
    }
  }

  // Calculate optimized token consumption
  let optimizedChars = 0;
  for (const m of apiMessages) {
    if (typeof m.content === "string") optimizedChars += m.content.length;
    else if (Array.isArray(m.content)) {
      for (const p of m.content) {
        if (p.type === "text") optimizedChars += p.text?.length || 0;
      }
    }
  }

  const optimizedTokenEstimate = estimateTokens(String(optimizedChars));
  const tokensSaved = Math.max(0, originalTokenEstimate - optimizedTokenEstimate);
  const savingsPercentage =
    originalTokenEstimate > 0 ? Math.min(96, Math.round((tokensSaved / originalTokenEstimate) * 100)) : 0;

  return {
    apiMessages,
    originalTokenEstimate,
    optimizedTokenEstimate,
    tokensSaved,
    savingsPercentage,
    usedSummary,
    filteredMessageCount: filteredCount,
    extractedFactsSummary: factsStrings.join(", "),
    isCompoundOptimized: isCompoundQuery,
  };
}
