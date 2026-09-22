import React, { useState } from "react";
import { Check, Copy, Eye, FileText, Gauge, Sparkles, User, X, RotateCcw, Edit3, Share2, Globe, ExternalLink, Send, Table as TableIcon, FlaskConical } from "lucide-react";
import Logo from "./Logo";
import type { AttachedFile, Message, ModelId } from "../types";
import { getModel } from "../data/models";
import { useSettings } from "../context/SettingsContext";
import { cn } from "../utils/cn";
import { M3LoadingIndicator } from "../../m3-loading/M3LoadingIndicator";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanContentText(raw: string): string {
  if (!raw) return "";
  let text = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/\[\/?THINKING\]/gi, "");

  // Strip meta-reasoning preamble if leaked
  if (/^(?:we need to answer|the user wants|the user is asking|i should answer|let's think):/i.test(text.trim())) {
    const parts = text.split(/\n\s*\n/);
    if (parts.length > 1 && /we need to answer|the user|let's analyze/i.test(parts[0])) {
      text = parts.slice(1).join("\n\n");
    }
  }

  return text.trim();
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={j} className="font-extrabold text-[var(--s-on-brand-container)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={j}
          className="rounded-md bg-[var(--s-surface-2)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--s-brand)] border border-[var(--s-line)]/50"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={j} className="italic text-[var(--s-ink-soft)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={j}>{part}</span>;
  });
}

function TableRenderer({ lines, tableKey }: { lines: string[]; tableKey: string | number }) {
  const [copied, setCopied] = useState(false);
  const cleanLines = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (cleanLines.length < 2) return null;

  const parseCells = (line: string) => {
    let cells = line.split("|").map((c) => c.trim());
    if (cells[0] === "") cells.shift();
    if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
    return cells;
  };

  const headerCells = parseCells(cleanLines[0]);
  const isDelimiter = (l: string) => /^\|?\s*[-:]+[-| :]*\|?$/.test(l);
  const dataStartIdx = isDelimiter(cleanLines[1]) ? 2 : 1;

  const rows = cleanLines.slice(dataStartIdx).map((rowLine) => parseCells(rowLine));

  const handleCopyTable = () => {
    const rawTable = cleanLines.join("\n");
    navigator.clipboard.writeText(rawTable).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div key={tableKey} className="my-4 w-full rounded-2xl border border-[var(--s-line)] bg-[var(--s-surface-1)] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--s-surface-2)]/60 border-b border-[var(--s-line)]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--s-brand)]">
          <TableIcon className="w-3.5 h-3.5" />
          <span>Таблица данных</span>
        </div>
        <button
          onClick={handleCopyTable}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--s-surface-1)] border border-[var(--s-line)] hover:bg-[var(--s-brand-container)] transition cursor-pointer text-[var(--s-ink)]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Скопировано!' : 'Копировать таблицу'}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-[var(--s-brand-container)]/50 text-[var(--s-on-brand-container)] border-b border-[var(--s-line)]">
              {headerCells.map((h, hi) => (
                <th key={hi} className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--s-line)]/50 text-[var(--s-ink)]">
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 1 ? "bg-[var(--s-surface-2)]/30" : "bg-transparent"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 leading-relaxed align-top">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodeOrFormulaBlock({ block, bi }: { block: string; bi: number }) {
  const [copied, setCopied] = useState(false);
  const nl = block.indexOf("\n");
  const langTag = nl !== -1 ? block.slice(3, nl).trim() : "";
  const code = nl === -1 ? block.slice(3, -3) : block.slice(nl + 1, -3).replace(/\n$/, "");

  const isChemicalOrFormula =
    langTag.toLowerCase().includes("chem") ||
    langTag.toLowerCase().includes("math") ||
    langTag.toLowerCase().includes("latex") ||
    /\b(H2O|CO2|NaCl|H2SO4|CH4|C6H12O6|CaCO3|HCl|NaOH|Fe2O3|NH3|KMnO4)\b/.test(code);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div key={bi} className="my-3 rounded-2xl bg-[var(--s-surface-2)] border border-[var(--s-line)] overflow-hidden shadow-xs">
      <div className="flex items-center justify-between bg-[var(--s-surface-3,var(--s-surface-2))] px-4 py-1.5 border-b border-[var(--s-line)]/60">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[var(--s-brand)]">
          {isChemicalOrFormula ? <FlaskConical className="w-3.5 h-3.5 text-amber-500" /> : null}
          <span>{isChemicalOrFormula ? (langTag || 'Formula / Chemical') : (langTag || 'Code')}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-[var(--s-ink-faint)] hover:text-[var(--s-brand)] hover:bg-[var(--s-surface-1)] transition cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Скопировано' : 'Скопировать'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed text-[var(--s-ink)] font-mono select-all">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderContent(rawContent: string) {
  const content = cleanContentText(rawContent);
  if (!content) return null;

  const blocks = content.split(/(```[\s\S]*?```)/g);

  return blocks.map((block, bi) => {
    // 1. Code / Formula blocks
    if (block.startsWith("```") && block.endsWith("```")) {
      return <CodeOrFormulaBlock key={bi} block={block} bi={bi} />;
    }

    // 2. Process paragraphs, tables, lists, and headers
    const paragraphs = block.split(/\n\s*\n/);

    return paragraphs.map((para, pi) => {
      const cleanPara = para.trim();
      if (!cleanPara) return null;

      const lines = cleanPara.split("\n");

      // Check for Markdown Table
      const isTable =
        lines.length >= 2 &&
        lines.some((l) => l.trim().startsWith("|") || l.trim().endsWith("|") || l.includes("|")) &&
        lines.some((l) => /^\|?\s*[-:]+[-| :]*\|?$/.test(l.trim()));

      if (isTable) {
        return <TableRenderer key={`${bi}-${pi}`} lines={lines} tableKey={`${bi}-${pi}`} />;
      }

      // Check for Headings
      if (cleanPara.startsWith("### ")) {
        return (
          <h4 key={`${bi}-${pi}`} className="mt-4 mb-1.5 text-sm sm:text-base font-extrabold text-[var(--s-on-brand-container)]">
            {renderInline(cleanPara.slice(4))}
          </h4>
        );
      }
      if (cleanPara.startsWith("## ")) {
        return (
          <h3 key={`${bi}-${pi}`} className="mt-4 mb-2 text-base sm:text-lg font-black text-[var(--s-on-brand-container)] tracking-tight">
            {renderInline(cleanPara.slice(3))}
          </h3>
        );
      }
      if (cleanPara.startsWith("# ")) {
        return (
          <h2 key={`${bi}-${pi}`} className="mt-4 mb-2 text-lg sm:text-xl font-black text-[var(--s-on-brand-container)] tracking-tight">
            {renderInline(cleanPara.slice(2))}
          </h2>
        );
      }

      // Check for Blockquote
      if (cleanPara.startsWith("> ")) {
        const quoteText = lines.map((l) => (l.startsWith("> ") ? l.slice(2) : l)).join("\n");
        return (
          <blockquote
            key={`${bi}-${pi}`}
            className="my-2.5 border-l-4 border-[var(--s-brand)] bg-[var(--s-brand-container)]/25 px-4 py-2 rounded-r-2xl text-[14px] italic text-[var(--s-ink-soft)]"
          >
            {renderInline(quoteText)}
          </blockquote>
        );
      }

      // Check for bullet list
      const isList = lines.every((l) => /^(\s*[-*•]|\s*\d+\.)\s+/.test(l));
      if (isList) {
        return (
          <ul key={`${bi}-${pi}`} className="my-2 space-y-1.5 pl-2">
            {lines.map((l, li) => {
              const itemText = l.replace(/^(\s*[-*•]|\s*\d+\.)\s+/, "");
              return (
                <li key={li} className="flex items-start gap-2 leading-relaxed text-[14px] sm:text-[15px]">
                  <span className="text-[var(--s-brand)] font-bold select-none">•</span>
                  <span className="flex-1">{renderInline(itemText)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      // Standard paragraph
      return (
        <p key={`${bi}-${pi}`} className={cn("leading-relaxed text-[14px] sm:text-[15px]", (bi > 0 || pi > 0) && "mt-2.5")}>
          {lines.map((line, li) => (
            <React.Fragment key={li}>
              {renderInline(line)}
              {li < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  });
}

const ICONS: Record<ModelId, typeof Gauge> = {
  lnv1: Gauge,
  lv1pro: Sparkles,
  lvision: Eye,
};

function Attachments({
  files,
  onPreview,
}: {
  files: AttachedFile[];
  onPreview: (f: AttachedFile) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {files.map((f) =>
        f.isImage && f.dataUrl ? (
          <button
            key={f.id}
            onClick={() => onPreview(f)}
            className="overflow-hidden rounded-2xl border border-[var(--s-line)] bg-[var(--s-surface-1)] shadow-sm transition hover:shadow-md cursor-pointer"
          >
            <img src={f.dataUrl} alt={f.name} className="max-h-44 w-auto object-cover" />
          </button>
        ) : (
          <div
            key={f.id}
            className="flex items-center gap-2 rounded-2xl border border-[var(--s-line)] bg-[var(--s-surface-1)] px-3 py-2 shadow-sm"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--s-brand-container)] text-[var(--s-brand)]">
              <FileText className="h-4 w-4" />
            </span>
            <span className="leading-tight text-left">
              <span className="block max-w-[150px] truncate text-xs font-bold text-[var(--s-on-brand-container)]">
                {f.name}
              </span>
              <span className="block text-[10px] text-[var(--s-ink-faint)]">{formatSize(f.size)}</span>
            </span>
          </div>
        ),
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onEdit?: (message: Message) => void;
  onRegenerate?: (message: Message) => void;
  onShareToConnect?: (text: string) => void;
}

export default function MessageBubble({
  message,
  onEdit,
  onRegenerate,
  onShareToConnect,
}: MessageBubbleProps) {
  const { lang, t } = useSettings();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [preview, setPreview] = useState<AttachedFile | null>(null);
  const isUser = message.role === "user";

  const handleCopy = () => {
    const textToCopy = cleanContentText(message.content);
    navigator.clipboard.writeText(textToCopy).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = () => {
    const text = cleanContentText(message.content);
    if (onShareToConnect) {
      onShareToConnect(text);
    } else {
      // Dispatches event for Lisyan Connect integration
      window.dispatchEvent(new CustomEvent('linkerru_send_to_lisyan_connect', { detail: { text } }));
    }
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  };

  const lightbox = preview?.dataUrl ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm cursor-pointer"
      onClick={() => setPreview(null)}
    >
      <img
        src={preview.dataUrl}
        alt={preview.name}
        className="max-h-[85vh] max-w-full rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={() => setPreview(null)}
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#2a0060] transition hover:bg-white cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  ) : null;

  if (isUser) {
    return (
      <>
        <div className="group flex animate-fade-up justify-end gap-3 px-4">
          <div className="flex max-w-[85%] sm:max-w-[75%] flex-col items-end gap-1.5">
            {message.attachments && message.attachments.length > 0 && (
              <Attachments files={message.attachments} onPreview={setPreview} />
            )}
            {message.content && (
              <div className="rounded-3xl rounded-tr-lg bg-[var(--s-brand)] px-5 py-3.5 text-white shadow-md">
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</div>
              </div>
            )}

            {/* Quick Actions for User Prompt */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={() => onEdit(message)}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--s-ink-faint)] hover:text-[var(--s-brand)] hover:bg-[var(--s-surface-2)] transition cursor-pointer"
                  title="Редактировать запрос"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Изменить</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--s-ink-faint)] hover:text-[var(--s-brand)] hover:bg-[var(--s-surface-2)] transition cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--s-brand-container)] text-[var(--s-brand)]">
            <User className="h-4.5 w-4.5" />
          </div>
        </div>
        {lightbox}
      </>
    );
  }

  const model = getModel(message.modelId ?? "lnv1");
  const Icon = ICONS[model.id] || Gauge;

  return (
    <div className="group flex animate-fade-up gap-3 px-4">
      <Logo className="h-9 w-9 shrink-0" />
      <div className="max-w-[90%] sm:max-w-[84%]">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[var(--s-brand)]">
          <Icon className="h-3 w-3" />
          {model.name}
          <span className="rounded-full bg-[var(--s-surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--s-ink-faint)]">
            {model.apiModel}
          </span>
        </div>
        <div className="rounded-3xl rounded-tl-lg border border-[var(--s-line)] bg-[var(--s-surface-1)] px-5 py-3.5 text-[15px] text-[var(--s-ink)] shadow-[0_2px_10px_var(--s-shadow)]">
          {message.streaming ? (
            <div className="flex items-center gap-3 py-1">
              <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24 }}>
                <M3LoadingIndicator size={24} color="var(--s-brand, var(--accent))" speed={1.1} />
              </div>
              <span className="text-[13px] font-semibold text-[var(--s-brand)] tracking-tight">
                {message.content || (lang === "ru" ? "Lisyan AI генерирует ответ..." : lang === "uk" ? "Lisyan AI генерує відповідь..." : "Lisyan AI is thinking...")}
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-1">{renderContent(message.content)}</div>

              {/* Source Pills (Google / Web search citations) */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-[var(--s-line)]/60">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--s-brand)] mb-2">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{lang === 'ru' ? 'Источники информации' : 'Sources & Grounding'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {message.sources.map((src, si) => (
                      <a
                        key={si}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--s-surface-2)] border border-[var(--s-line)] text-xs font-semibold text-[var(--s-ink)] hover:bg-[var(--s-brand-container)] hover:border-[var(--s-brand)] transition group/pill"
                        title={src.snippet || src.title}
                      >
                        <span className="text-[var(--s-brand)] font-bold text-[11px]">#{si + 1}</span>
                        <span className="max-w-[160px] truncate">{src.domain || src.title}</span>
                        <ExternalLink className="w-3 h-3 opacity-50 group-hover/pill:opacity-100" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--s-line)]/40 text-xs font-semibold text-[var(--s-ink-faint)]">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition hover:bg-[var(--s-surface-2)] hover:text-[var(--s-brand)] cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? t("copied") : t("copy")}</span>
                </button>

                {onRegenerate && (
                  <button
                    onClick={() => onRegenerate(message)}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition hover:bg-[var(--s-surface-2)] hover:text-[var(--s-brand)] cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>{lang === 'ru' ? 'Повторить' : 'Regenerate'}</span>
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition hover:bg-[var(--s-surface-2)] hover:text-[var(--s-brand)] cursor-pointer text-indigo-600 dark:text-indigo-400"
                  title="Поделиться в Lisyan Connect"
                >
                  {shared ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{shared ? 'Передано в Connect!' : 'В Lisyan Connect'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
