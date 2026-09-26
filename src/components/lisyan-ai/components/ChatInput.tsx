import React, { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowUp, FileText, Globe, Paperclip, Square, UploadCloud, X } from "lucide-react";
import type { AttachedFile } from "../types";
import { processUploadedFile } from "../utils/fileHelpers";
import { useSettings } from "../context/SettingsContext";

interface ChatInputProps {
  onSend: (text: string, attachments: AttachedFile[]) => void;
  disabled?: boolean;
  onStop?: () => void;
  initialText?: string;
  onTextConsumed?: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatInput({ onSend, disabled, onStop, initialText, onTextConsumed }: ChatInputProps) {
  const { t, lang } = useSettings();
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialText !== undefined && initialText !== null) {
      setValue(initialText);
      if (onTextConsumed) onTextConsumed();
      ref.current?.focus();
    }
  }, [initialText, onTextConsumed]);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const addFiles = async (list: FileList | File[]) => {
    const processed: AttachedFile[] = [];
    for (const f of Array.from(list)) processed.push(await processUploadedFile(f));
    setFiles((prev) => [...prev, ...processed]);
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const submit = () => {
    let trimmed = value.trim();
    if ((!trimmed && files.length === 0) || disabled) return;
    if (webSearchActive && !/найди|поищи|google|гугл/i.test(trimmed)) {
      trimmed = `Найди в интернете актуальную информацию: ${trimmed}`;
    }
    onSend(trimmed, files);
    setValue("");
    setFiles([]);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-3xl px-4 pb-4"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,.webp,.png,.jpeg,.jpg,.gif,.bmp,.svg,.docx,.doc,.txt,.md,.pdf,.json,.xml,.csv,.rtf"
        className="hidden"
        onChange={onFileInput}
      />
      {dragging && (
        <div className="pointer-events-none absolute inset-x-4 inset-y-0 z-20 flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[var(--s-brand)] bg-[var(--s-brand-container)]/90 backdrop-blur-sm">
          <UploadCloud className="h-8 w-8 text-[var(--s-brand)]" />
          <p className="mt-1 text-sm font-bold text-[var(--s-on-brand-container)]">{t("dropHere")}</p>
        </div>
      )}
      <div className="rounded-[28px] border border-[var(--s-line)] bg-[var(--s-surface-1)] shadow-[0_8px_30px_var(--s-shadow)] transition focus-within:border-[var(--s-brand)] focus-within:ring-4 focus-within:ring-[var(--s-brand-container)]">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-[var(--s-line)] p-2.5">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-2xl bg-[var(--s-surface-2)] p-1.5 pr-2">
                {f.isImage && f.dataUrl ? (
                  <img src={f.dataUrl} alt={f.name} className="h-8 w-8 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--s-brand-container)] text-[var(--s-brand)]">
                    <FileText className="h-4 w-4" />
                  </span>
                )}
                <span className="leading-tight">
                  <span className="block max-w-[120px] truncate text-xs font-bold text-[var(--s-on-brand-container)]">
                    {f.name}
                  </span>
                  <span className="block text-[10px] text-[var(--s-ink-faint)]">{formatSize(f.size)}</span>
                </span>
                <button
                  onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                  className="rounded-full p-1 text-[var(--s-brand)] transition hover:bg-[var(--s-surface-3)] cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 p-2.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--s-brand)] transition hover:bg-[var(--s-surface-2)] active:scale-90 cursor-pointer"
            title={t("attach")}
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setWebSearchActive(!webSearchActive)}
            className={`mb-1 flex h-10 px-3 items-center gap-1.5 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer ${
              webSearchActive
                ? "bg-[var(--s-brand)] text-white shadow-xs"
                : "text-[var(--s-ink-faint)] hover:bg-[var(--s-surface-2)] hover:text-[var(--s-brand)]"
            }`}
            title="Google / Поиск в интернете"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{lang === "ru" ? "Поиск Web" : "Search"}</span>
          </button>

          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={t("inputPlaceholder")}
            className="max-h-[200px] flex-1 resize-none bg-transparent py-2.5 text-[15px] text-[var(--s-ink)] outline-none placeholder:text-[var(--s-ink-faint)]"
          />
          {disabled ? (
            <button
              onClick={onStop}
              className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--s-brand-strong)] text-white shadow-md transition active:scale-90 cursor-pointer"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!value.trim() && files.length === 0}
              className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--s-brand)] text-white shadow-md transition enabled:hover:opacity-90 enabled:active:scale-90 disabled:opacity-40 cursor-pointer"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-[var(--s-ink-faint)]">{t("disclaimer")}</p>
    </div>
  );
}
