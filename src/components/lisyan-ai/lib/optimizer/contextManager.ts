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
  isCompoundOptimized?: boolean;
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
 * Optimized: for small questions, return even fewer chunks.
 */
export function extractRelevantChunks(
  docText: string,
  query: string,
  maxChunks: number = 6,
  chunkSize: number = 3000
): string {
  // For tiny queries, we can be more aggressive in chunk reduction
  const isSmall = query.trim().length <= 200;
  const effectiveMaxChunks = isSmall ? Math.min(maxChunks, 2) : maxChunks;
  const effectiveChunkSize = isSmall ? 1500 : chunkSize;

  // Allow long texts (up to 24,000 characters) to pass through completely without discarding
  // But for small queries, cap at 8k to save tokens
  const cap = isSmall ? 8000 : 24000;
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

  // Score each chunk by term frequency and keyword matching
  const scoredChunks = chunks.map((chunk, index) => {
    const lower = chunk.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const occurrences = (lower.match(new RegExp(`\\b${term}`, "gi")) || []).length;
      score += occurrences * 2;
      if (lower.includes(term)) score += 1;
    }

    // Give slight recency bias to early intro or matching headings
    if (index === 0) score += 0.5;

    return { chunk, score, index };
  });

  // Sort by score descending and pick top N
  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, effectiveMaxChunks);

  // Restore original document order
  topChunks.sort((a, b) => a.index - b.index);

  return topChunks.map((c) => c.chunk).join("\n\n[... фрагмент документа ...]\n\n");
}

/**
 * Compresses an array of older messages into a compact SUMMARY text block.
 * Optimized: shorter summary for compound paths.
 */
function summarizeOlderMessages(olderMessages: Message[], lang: Language, isCompound: boolean = false): string {
  const points: string[] = [];
  const userTopics: string[] = [];

  for (const msg of olderMessages) {
    if (isLowValueMessage(msg.content)) continue;
    const clean = normalizeText(msg.content);
    if (!clean) continue;

    if (msg.role === "user") {
      const maxLen = isCompound ? 60 : 120;
      const summaryLine = clean.length > maxLen ? clean.slice(0, maxLen - 3) + "..." : clean;
      userTopics.push(summaryLine);
    } else {
      // For assistant responses, extract core action / answer summary
      const firstSentence = clean.split(/[.!?\n]/)[0]?.trim();
      if (firstSentence && firstSentence.length > 15) {
        const maxLen = isCompound ? 50 : 100;
        points.push(firstSentence.length > maxLen ? firstSentence.slice(0, maxLen - 3) + "..." : firstSentence);
      }
    }
  }

  const topicCount = isCompound ? userTopics.slice(-2) : userTopics.slice(-4);
  const summaryHeader =
    lang === "ru"
      ? "КРАТКАЯ СВОДКА ПРЕДЫДУЩЕГО ДИАЛОГА:"
      : lang === "uk"
      ? "КОРОТКИЙ ЗМІСТ ПОПЕРЕДНЬОГО ДІАЛОГУ:"
      : "SUMMARY OF PREVIOUS CONVERSATION:";

  const lines = topicCount.map((t, idx) => `• ${t}`);
  return `${summaryHeader}\n${lines.join("\n")}`;
}

/**
 * Builds the fully optimized context structure:
 * - Drops low-value messages.
 * - Extracts structured facts profile.
 * - Compresses old history (> 4 messages) into [SUMMARY] + [RECENT].
 * - Performs RAG chunk relevance search on large documents.
 * - Normalizes whitespaces and punctuation.
 * - NEW: Ultra-optimized path for small questions (Groq Compound)
 */
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
  const isCompoundQuery = !vision && isSmallQuestion(latestQuery);
  const isTiny = isTinyQuestion(latestQuery);

  // 1. Filter out low-value messages (e.g. "ок", "спасибо") from history (keep latest if user)
  // For compound/tiny, be even more aggressive: drop more history
  let filteredCount = 0;
  const filteredMessages: Message[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLatest = i === messages.length - 1;
    if (!isLatest && isLowValueMessage(msg.content) && (!msg.attachments || msg.attachments.length === 0)) {
      filteredCount++;
      continue;
    }
    // For tiny questions, also filter out very old long assistant messages that aren't relevant
    if (isCompoundQuery && !isLatest && i < messages.length - 3) {
      // If old assistant message is >300 chars and not containing keywords from latest query, drop it
      if (msg.role === "assistant" && msg.content.length > 300) {
        const queryTerms = latestQuery.toLowerCase().split(/\s+/).filter(t => t.length > 3);
        const hasOverlap = queryTerms.some(term => msg.content.toLowerCase().includes(term));
        if (!hasOverlap && messages.length > 4) {
          filteredCount++;
          continue;
        }
      }
    }
    filteredMessages.push(msg);
  }

  // 2. Extract structured user profile facts — skip for tiny compound queries to save tokens
  let factsHeader = "";
  let factsStrings: string[] = [];
  if (!isTiny) {
    const facts = extractUserFacts(filteredMessages);
    if (facts.name) factsStrings.push(`User: ${facts.name}`);
    if (facts.age) factsStrings.push(`Age: ${facts.age}`);
    if (facts.techStack && facts.techStack.length > 0) factsStrings.push(`Tech: ${facts.techStack.join(", ")}`);
    factsHeader = factsStrings.length > 0 ? `\n[User Profile: { ${factsStrings.join(", ")} }]` : "";
  } else {
    // For tiny questions, no need for user profile
    filteredCount++; // count as optimization
  }

  // 3. Separate older messages from recent turns
  // For compound: use fewer recent turns to save tokens
  const RECENT_TURNS = isCompoundQuery ? (isTiny ? 1 : 2) : 4;
  const totalCount = filteredMessages.length;
  let usedSummary = false;
  let historyToSend: Message[] = [];
  let summaryBlock = "";

  if (totalCount > RECENT_TURNS + 1) {
    // For tiny compound questions, don't use summary at all if we have few messages — just send last 1-2
    if (isTiny && totalCount <= 6) {
      usedSummary = false;
      historyToSend = filteredMessages.slice(-RECENT_TURNS);
    } else {
      usedSummary = true;
      const olderMessages = filteredMessages.slice(0, totalCount - RECENT_TURNS);
      historyToSend = filteredMessages.slice(totalCount - RECENT_TURNS);
      summaryBlock = summarizeOlderMessages(olderMessages, lang, isCompoundQuery);
    }
  } else {
    const depth = isCompoundQuery ? RECENT_TURNS : info.historyDepth;
    historyToSend = filteredMessages.slice(-depth);
  }

  // 4. Assemble API messages
  const apiMessages: { role: "system" | "user" | "assistant"; content: any }[] = [];

  // System message with injected structured user facts and summary if present
  // For tiny compound, system prompt should be minimal
  let fullSystemContent = systemPrompt + factsHeader;
  if (usedSummary && summaryBlock) {
    fullSystemContent += `\n\n${summaryBlock}`;
  }

  // For compound, trim system prompt if it's too verbose
  if (isCompoundQuery && fullSystemContent.length > 1200) {
    // Keep only first 1000 chars of system + facts + summary, preserve core instructions
    const coreInstructions = systemPrompt.slice(0, 800);
    const extra = factsHeader + (summaryBlock ? `\n\n${summaryBlock}` : "");
    fullSystemContent = coreInstructions + extra.slice(0, 400);
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

    // RAG Chunking for text attachments — more aggressive for small queries
    for (const f of textFiles) {
      const ext = f.name.split(".").pop() || "";
      if (isLatest) {
        const maxChunks = isCompoundQuery ? 2 : 3;
        const chunkSize = isCompoundQuery ? 600 : 800;
        const compressedContent = extractRelevantChunks(f.textContent || "", latestQuery, maxChunks, chunkSize);
        textChunks.push(`Файл ${f.name} (релевантные фрагменты):\n\`\`\`${ext}\n${compressedContent}\n\`\`\``);
      } else {
        textChunks.push(`[Файл: ${f.name}]`);
      }
    }

    for (const f of otherFiles) {
      textChunks.push(`[Вложение: ${f.name}, ${Math.round(f.size / 1024)} KB]`);
    }

    let normalizedBody = normalizeText(msg.content);
    // For compound non-latest messages, truncate to save tokens
    if (isCompoundQuery && !isLatest && normalizedBody.length > 200) {
      normalizedBody = normalizedBody.slice(0, 197) + "...";
    }

    if (normalizedBody) textChunks.push(normalizedBody);
    else if (textChunks.length === 0 && images.length === 0) textChunks.push("...");

    let finalContent = textChunks.join("\n\n");

    // Vision images handling
    if (vision && isLatest && msg.role === "user" && images.length > 0) {
      const parts: any[] = [{ type: "text", text: finalContent }];
      for (const img of images.slice(0, 1)) {
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
