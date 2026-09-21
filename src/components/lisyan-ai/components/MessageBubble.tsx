import React, { useState } from "react";
import { Check, Copy, Eye, FileText, Gauge, Sparkles, User, X } from "lucide-react";
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

function renderContent(content: string) {
  const blocks = content.split(/(```[\s\S]*?```)/g);
  return blocks.map((block, bi) => {
    if (block.startsWith("```") && block.endsWith("```")) {
      const nl = block.indexOf("\n");
      const code = nl === -1 ? block.slice(3, -3) : block.slice(nl + 1, -3).replace(/\n$/, "");
      return (
        <pre
          key={bi}
          className="my-2 overflow-x-auto rounded-2xl bg-[var(--s-surface-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--s-ink)] font-mono border border-[var(--s-line)]"
        >
          <code>{code}</code>
        </pre>
      );
    }
    return block.split("\n\n").map((para, i) => {
      if (!para.trim()) return null;
      const parts = para.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
      return (
        <p key={`${bi}-${i}`} className={cn("leading-relaxed", (bi > 0 || i > 0) && "mt-3")}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-extrabold text-[var(--s-on-brand-container)]">
                {part.slice(2, -2)}
              </strong>
            ) : part.startsWith("`") && part.endsWith("`") ? (
              <code
                key={j}
                className="rounded-md bg-[var(--s-surface-2)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--s-brand)]"
              >
                {part.slice(1, -1)}
              </code>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
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

export default function MessageBubble({ message }: { message: Message }) {
  const { lang, t } = useSettings();
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<AttachedFile | null>(null);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        <div className="flex animate-fade-up justify-end gap-3 px-4">
          <div className="flex max-w-[85%] sm:max-w-[75%] flex-col items-end gap-2">
            {message.attachments && message.attachments.length > 0 && (
              <Attachments files={message.attachments} onPreview={setPreview} />
            )}
            {message.content && (
              <div className="rounded-3xl rounded-tr-lg bg-[var(--s-brand)] px-5 py-3.5 text-white shadow-md">
                <div className="text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</div>
              </div>
            )}
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
      <div className="max-w-[88%] sm:max-w-[80%]">
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
                {message.content || (lang === 'ru' ? 'Lisyan AI генерирует ответ...' : lang === 'uk' ? 'Lisyan AI генерує відповідь...' : 'Lisyan AI is thinking...')}
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-1">{renderContent(message.content)}</div>
              <button
                onClick={handleCopy}
                className="mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--s-ink-faint)] opacity-80 transition hover:bg-[var(--s-surface-2)] hover:text-[var(--s-brand)] cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("copied") : t("copy")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
