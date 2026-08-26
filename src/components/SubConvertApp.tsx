import React, { useState, useMemo, useRef } from 'react';
import {
  Subtitles,
  Search,
  Copy,
  Download,
  FileText,
  FileCode,
  FileJson,
  Play,
  Check,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Languages,
  Clock,
  Youtube,
  Trash2,
  Share2,
  ChevronDown,
  ChevronUp,
  Bot,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Material3Palette } from '../types';

interface Snippet {
  start: number;
  duration: number;
  text: string;
}

interface AvailableLanguage {
  code: string;
  name: string;
  generated: boolean;
}

interface TranscriptData {
  videoId: string;
  title: string | null;
  author?: string | null;
  channelId?: string | null;
  lengthSeconds?: string | null;
  viewCount?: string | null;
  thumbnail: string;
  language: string;
  languageCode: string;
  isGenerated: boolean;
  snippetCount: number;
  text: string;
  snippets: Snippet[];
  availableLanguages: AvailableLanguage[];
}

interface SubConvertAppProps {
  lang: 'ru' | 'en';
  theme?: 'light' | 'dark';
  activePalette?: Material3Palette;
  playChime?: (type?: 'click' | 'alert' | 'reset' | 'victory' | 'toast') => void;
  triggerToast?: (text: string) => void;
  openAgnoGPT?: () => void;
}

const PRESET_LANGUAGES = [
  { code: 'ru', labelRu: 'Русский', labelEn: 'Russian' },
  { code: 'en', labelRu: 'Английский', labelEn: 'English' },
  { code: 'es', labelRu: 'Испанский', labelEn: 'Spanish' },
  { code: 'de', labelRu: 'Немецкий', labelEn: 'German' },
  { code: 'fr', labelRu: 'Французский', labelEn: 'French' },
  { code: 'ja', labelRu: 'Японский', labelEn: 'Japanese' },
];

function extractVideoId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/);
  return match ? match[1] : trimmed;
}

function parseSubtitleContent(content: string): Snippet[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // 1. JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.snippets)) return parsed.snippets;
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not json
    }
  }

  // 2. SRT / WebVTT
  if (trimmed.includes('-->')) {
    const parsedSnippets: Snippet[] = [];
    const blocks = trimmed.replace(/\r\n/g, '\n').split(/\n\s*\n/);
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length >= 2) {
        const timeLine = lines.find((l) => l.includes('-->'));
        if (timeLine) {
          const parts = timeLine.split('-->');
          const parseSec = (tStr: string) => {
            const cleaned = tStr.trim().replace(',', '.');
            const tParts = cleaned.split(':');
            if (tParts.length === 3) {
              return parseFloat(tParts[0]) * 3600 + parseFloat(tParts[1]) * 60 + parseFloat(tParts[2]);
            } else if (tParts.length === 2) {
              return parseFloat(tParts[0]) * 60 + parseFloat(tParts[1]);
            }
            return 0;
          };
          const start = parseSec(parts[0]);
          const end = parseSec(parts[1]);
          const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(' ').trim();
          if (textLines) {
            parsedSnippets.push({
              start: Math.round(start * 100) / 100,
              duration: Math.round(Math.max(0.5, end - start) * 100) / 100,
              text: textLines.replace(/<[^>]*>/g, ''),
            });
          }
        }
      }
    }
    if (parsedSnippets.length > 0) return parsedSnippets;
  }

  // 3. YouTube text with timestamp format or simple lines
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  const parsedSnippets: Snippet[] = [];
  let curSec = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tsMatch = line.match(/^(\d{1,2}:)?\d{1,2}:\d{2}$/);
    if (tsMatch && i + 1 < lines.length) {
      const p = line.split(':');
      const sec = p.length === 3 ? parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]) : parseInt(p[0]) * 60 + parseInt(p[1]);
      curSec = sec;
      const text = lines[++i];
      if (text) {
        parsedSnippets.push({ start: curSec, duration: 3, text });
      }
    } else {
      parsedSnippets.push({
        start: i * 3,
        duration: 3,
        text: line,
      });
    }
  }

  return parsedSnippets;
}

const TRANSCRIPT_API = "https://youtube-transcript.ai/transcript/{ID}.txt";
const HISTORY_KEY = "linkerru_subconvert_history";

function parseClockToSeconds(token: string): number {
  const parts = token.split(":").map((n) => parseInt(n, 10) || 0);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function parseTimestampLine(line: string): { start: number, duration: number, text: string } | null {
  const m = line.match(/^\[(\d+(?::\d{1,2}){1,2})\]\s*(.*)$/);
  if (!m) return null;
  const text = m[2].trim();
  if (!text) return null;
  return { start: parseClockToSeconds(m[1]), duration: 2, text }; // Defaulting duration to 2s for simplicity in UI
}

function parseMarkdown(markdown: string, videoId: string): TranscriptData {
  const lines = markdown.split(/\r?\n/);
  let title = "YouTube Video";
  let language = "en";
  let availableLanguages: any[] = [];
  const snippets: any[] = [];

  let inBody = false;
  for (const raw of lines) {
    const line = raw.trimEnd();

    const titleMatch = line.match(/^# Transcript:\s*(.*)$/);
    if (titleMatch) title = titleMatch[1].trim();

    const metaMatch = line.match(/^Language:\s*(\S+)/);
    if (metaMatch) language = metaMatch[1];

    const langsMatch = line.match(/^Other available languages:\s*(.*)$/);
    if (langsMatch) {
      availableLanguages = langsMatch[1].split(',').map((s) => ({
        code: s.trim().split(' ')[0],
        name: s.trim(),
        generated: false,
      }));
    }

    if (/^## Transcript\s*$/.test(line)) {
      inBody = true;
      continue;
    }
    if (inBody && /^---\s*$/.test(line)) break;

    if (inBody) {
      const parsed = parseTimestampLine(line);
      if (parsed) snippets.push(parsed);
    }
  }

  return {
    videoId,
    title,
    author: "YouTube",
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    language,
    languageCode: language,
    isGenerated: false,
    snippetCount: snippets.length,
    text: snippets.map((s) => s.text).join(' '),
    snippets,
    availableLanguages: availableLanguages.length > 0 ? availableLanguages : [{ code: language, name: language, generated: false }]
  };
}

async function fetchClientTranscript(videoId: string, targetLang?: string): Promise<TranscriptData> {
  const langQuery = targetLang && targetLang !== 'auto' ? `?lang=${encodeURIComponent(targetLang)}` : '';
  const url = TRANSCRIPT_API.replace("{ID}", encodeURIComponent(videoId)) + langQuery;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Transcript service responded with HTTP ${res.status}.`);
  }
  const markdown = await res.text();
  const parsed = parseMarkdown(markdown, videoId);
  
  if (parsed.snippets.length === 0) {
    throw new Error("This video has no subtitles available.");
  }
  
  return parsed;
}


export function SubConvertApp({
  lang,
  theme = 'dark',
  activePalette,
  playChime,
  triggerToast,
  openAgnoGPT,
}: SubConvertAppProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [preferredLang, setPreferredLang] = useState(lang === 'ru' ? 'ru' : 'en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TranscriptData | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'timed'>('text');
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [recentTranscripts, setRecentTranscripts] = useState<any[]>([]);

  const primaryColor = activePalette?.primary || 'var(--accent)';

  const fetchRecentTranscripts = React.useCallback(async () => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentTranscripts(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchRecentTranscripts();
  }, [fetchRecentTranscripts]);

  const handleFetch = async (targetLang?: string, targetUrl?: string) => {
    const queryUrl = (targetUrl !== undefined ? targetUrl : videoUrl).trim();
    if (!queryUrl) {
      setError(lang === 'ru' ? 'Пожалуйста, вставьте ссылку на YouTube-видео или ID.' : 'Please paste a YouTube URL or video ID.');
      playChime?.('alert');
      return;
    }

    setError(null);
    setIsLoading(true);
    playChime?.('click');

    const chosenLang = targetLang !== undefined ? targetLang : preferredLang;
    const vidId = extractVideoId(queryUrl);

    try {
      if (!vidId) {
        throw new Error(lang === 'ru' ? 'Неверная ссылка на YouTube-видео' : 'Invalid YouTube video URL');
      }

      const loadedData = await fetchClientTranscript(vidId, chosenLang);

      setData(loadedData);
      
      // Save to localStorage history
      setRecentTranscripts(prev => {
        const historyItem = {
          id: `${vidId}_${Date.now()}`,
          videoId: vidId,
          title: loadedData.title,
          thumbnail: loadedData.thumbnail,
          author: loadedData.author,
          language: loadedData.language
        };
        const next = [historyItem, ...prev.filter(h => h.videoId !== vidId)].slice(0, 15);
        try {
          window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch { /* ignore */ }
        return next;
      });

      playChime?.('victory');
      triggerToast?.(lang === 'ru' ? `Субтитры успешно загружены (${loadedData.snippetCount} строк)` : `Subtitles loaded (${loadedData.snippetCount} lines)`);
    } catch (err: any) {
      let errorMessage = err?.message || '';
      if (errorMessage.includes('Transcript is disabled') || errorMessage.includes('No subtitles')) {
        errorMessage = lang === 'ru' 
          ? 'Субтитры недоступны для этого видео (возможно отключены автором, либо YouTube блокирует серверные запросы).' 
          : 'Transcripts are disabled by the author, or YouTube is blocking the request.';
      }
      setError(errorMessage || (lang === 'ru' ? 'Ошибка загрузки' : 'Extraction error'));
      playChime?.('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.text);
    setCopiedType('text');
    playChime?.('toast');
    triggerToast?.(lang === 'ru' ? 'Текст скопирован в буфер обмена' : 'Transcript copied to clipboard');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const pad = (n: number, w: number = 2) => String(n).padStart(w, '0');

  const fmtTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec - Math.floor(sec)) * 1000);
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
  };

  const fmtShortTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${pad(m)}:${pad(s)}`;
  };

  const toSrt = (snippets: Snippet[]) => {
    return snippets
      .map((s, i) => `${i + 1}\n${fmtTime(s.start)} --> ${fmtTime(s.start + s.duration)}\n${s.text}\n`)
      .join('\n');
  };

  const downloadFile = (filename: string, content: string, mime: string = 'text/plain;charset=utf-8') => {
    playChime?.('click');
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    triggerToast?.(lang === 'ru' ? `Файл ${filename} скачан` : `Downloaded ${filename}`);
  };

  const handleDownloadTxt = () => {
    if (!data) return;
    const filename = `subtitles-${data.videoId}-${data.languageCode || 'transcript'}.txt`;
    downloadFile(filename, data.text, 'text/plain;charset=utf-8');
  };

  const handleDownloadSrt = () => {
    if (!data) return;
    const filename = `subtitles-${data.videoId}-${data.languageCode || 'captions'}.srt`;
    downloadFile(filename, toSrt(data.snippets), 'text/plain;charset=utf-8');
  };

  const handleDownloadJson = () => {
    if (!data) return;
    const filename = `subtitles-${data.videoId}.json`;
    downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
  };

  const handleAnalyzeAgno = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.text);
      setCopiedType('agno');
      setTimeout(() => setCopiedType(null), 2000);
      playChime?.('click');
      triggerToast?.(lang === 'ru' ? 'Текст скопирован. Открываем AgnoGPT...' : 'Text copied. Opening AgnoGPT...');
      if (openAgnoGPT) {
        openAgnoGPT();
      }
    } catch (err) {
      triggerToast?.(lang === 'ru' ? 'Не удалось скопировать текст' : 'Failed to copy text');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setVideoUrl(text.trim());
        playChime?.('click');
      }
    } catch {
      // Ignore clipboard read refusal
    }
  };

  const filteredSnippets = useMemo(() => {
    if (!data) return [];
    if (!filterQuery.trim()) return data.snippets;
    const q = filterQuery.toLowerCase();
    return data.snippets.filter((s) => s.text.toLowerCase().includes(q));
  }, [data, filterQuery]);

  return (
    <div className="h-full flex flex-col bg-transparent text-[var(--on-surface)] overflow-y-auto select-text font-sans">
      {/* HEADER BAR */}
      <div className="p-4 md:p-6 border-b border-[var(--outline-var)] bg-[var(--surface-dim)]/40 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Subtitles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black tracking-tight text-[var(--on-surface)]">
                  SubConvertYT
                </h2>
              </div>
              <p className="text-xs text-[var(--on-surface-var)] font-medium">
                {lang === 'ru'
                  ? 'Мгновенное извлечение и конвертация субтитров (.txt, .srt, .json)'
                  : 'Extract and convert YouTube subtitles & transcripts (.txt, .srt, .json)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={() => {
                  setData(null);
                  setVideoUrl('');
                  setError(null);
                  playChime?.('reset');
                }}
                className="px-3 py-1.5 rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] hover:bg-[var(--container-high)] text-xs font-bold text-[var(--on-surface)] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw size={13} />
                <span className="hidden sm:inline">{lang === 'ru' ? 'Новое видео' : 'New Video'}</span>
              </button>
            )}
          </div>
        </div>

        {/* INPUT FORM */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFetch();
                }}
                placeholder={
                  lang === 'ru'
                    ? 'Вставьте ссылку YouTube (например, https://youtu.be/...)'
                    : 'Paste YouTube URL or Video ID (e.g. https://youtu.be/...)'
                }
                className="w-full pl-10 pr-24 py-3 rounded-2xl border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] text-xs md:text-sm font-semibold placeholder:text-[var(--outline)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-inner"
              />
              <Youtube size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--outline)]" />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {videoUrl ? (
                  <button
                    onClick={() => setVideoUrl('')}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-dim)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
                    title={lang === 'ru' ? 'Очистить' : 'Clear'}
                  >
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <button
                    onClick={handlePaste}
                    className="px-2 py-1 rounded-lg bg-[var(--surface-dim)] hover:bg-[var(--container-high)] text-[10px] font-bold text-[var(--on-surface-var)] transition-colors cursor-pointer"
                  >
                    {lang === 'ru' ? 'Вставить' : 'Paste'}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => handleFetch()}
              disabled={isLoading || !videoUrl.trim()}
              className="px-6 py-3 rounded-2xl text-xs md:text-sm font-black text-white transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer shrink-0 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>{lang === 'ru' ? 'Извлечение...' : 'Extracting...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>{lang === 'ru' ? 'Извлечь субтитры' : 'Get Subtitles'}</span>
                </>
              )}
            </button>
          </div>

          {/* LANGUAGE PRESETS */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-[var(--on-surface-var)] flex items-center gap-1 mr-1">
              <Languages size={13} />
              {lang === 'ru' ? 'Язык:' : 'Lang:'}
            </span>
            {PRESET_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setPreferredLang(l.code);
                  if (data) handleFetch(l.code);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  preferredLang === l.code
                    ? 'text-white shadow-xs'
                    : 'bg-[var(--surface)] border border-[var(--outline-var)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--container-high)]'
                }`}
                style={preferredLang === l.code ? { backgroundColor: primaryColor } : undefined}
              >
                {lang === 'ru' ? l.labelRu : l.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="m-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">{lang === 'ru' ? 'Не удалось извлечь субтитры:' : 'Could not extract subtitles:'}</span>
            <p className="mt-0.5 text-red-300 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* MAIN RESULT VIEW */}
      {data ? (
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 min-h-0">
          {/* VIDEO INFO HEADER */}
          <div className="card panel-gradient rounded-3xl p-4 md:p-5 border border-[var(--outline-var)] shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative w-full sm:w-44 aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0 group">
                <img
                  src={data.thumbnail}
                  alt={data.title || 'YouTube Thumbnail'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setShowPlayer(!showPlayer)}
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/70 backdrop-blur-xs text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg cursor-pointer"
                  title={lang === 'ru' ? 'Включить плеер' : 'Toggle player'}
                >
                  <Play size={16} className="ml-0.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <div>
                  <h3 className="text-sm md:text-base font-black text-[var(--on-surface)] leading-snug line-clamp-2 tracking-tight">
                    {data.title || `YouTube Video (${data.videoId})`}
                  </h3>
                  {data.author && (
                    <p className="text-xs text-[var(--on-surface-var)] font-bold mt-1">
                      {data.author}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {data.language}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[10px] font-bold text-[var(--on-surface-var)]">
                    {data.isGenerated
                      ? (lang === 'ru' ? 'Авто-субтитры' : 'Auto-generated')
                      : (lang === 'ru' ? 'Авторские субтитры' : 'Manual subtitles')}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[10px] font-bold text-[var(--on-surface-var)] flex items-center gap-1">
                    <Clock size={11} />
                    {data.snippetCount} {lang === 'ru' ? 'строк' : 'lines'}
                  </span>
                  <a
                    href={`https://www.youtube.com/watch?v=${data.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-full bg-[var(--surface-dim)] border border-[var(--outline-var)] hover:bg-[var(--container-high)] text-[10px] font-bold text-[var(--on-surface)] flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={11} />
                    <span>YouTube</span>
                  </a>
                </div>
              </div>
            </div>

            {/* EMBEDDED PLAYER IF TOGGLED */}
            {showPlayer && (
              <div className="mt-4 pt-4 border-t border-[var(--outline-var)]">
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${data.videoId}?autoplay=1`}
                    title="YouTube video player"
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* AVAILABLE OTHER LANGUAGES SELECTOR */}
            {data.availableLanguages && data.availableLanguages.length > 1 && (
              <div className="mt-3 pt-3 border-t border-[var(--outline-var)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--outline)]">
                    {lang === 'ru' ? 'Доступные дорожки:' : 'Available tracks:'}
                  </span>
                  {data.availableLanguages.map((trk, i) => (
                    <button
                      key={i}
                      onClick={() => handleFetch(trk.code)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        trk.code === data.languageCode
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--surface-dim)] hover:bg-[var(--container-high)] text-[var(--on-surface-var)] border border-[var(--outline-var)]'
                      }`}
                    >
                      {trk.name} {trk.generated ? '(auto)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACTION BAR & CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* VIEW MODE TOGGLE */}
            <div className="flex items-center p-1 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)]">
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'text'
                    ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-xs'
                    : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                }`}
              >
                {lang === 'ru' ? 'Сплошной текст' : 'Full Transcript'}
              </button>
              <button
                onClick={() => setViewMode('timed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'timed'
                    ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-xs'
                    : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                }`}
              >
                {lang === 'ru' ? 'С таймкодами' : 'Timed Subtitles'}
              </button>
            </div>

            {/* SEARCH IN TRANSCRIPT */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={lang === 'ru' ? 'Поиск в тексте...' : 'Search in transcript...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] text-xs text-[var(--on-surface)] placeholder:text-[var(--outline)] focus:outline-none focus:border-[var(--accent)]"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--outline)]" />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--outline)] hover:text-[var(--on-surface)]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* DOWNLOAD & COPY BUTTONS */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleAnalyzeAgno}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                style={{ backgroundColor: primaryColor }}
                title="Analyze in AgnoGPT"
              >
                {copiedType === 'agno' ? <Check size={13} className="text-white" /> : <Bot size={13} />}
                <span>{copiedType === 'agno' ? (lang === 'ru' ? 'Открываем...' : 'Opening...') : (lang === 'ru' ? 'Анализ в AgnoGPT' : 'Analyze in AgnoGPT')}</span>
              </button>
              <button
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] hover:bg-[var(--container-high)] text-xs font-bold text-[var(--on-surface)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                {copiedType === 'text' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                <span>{copiedType === 'text' ? (lang === 'ru' ? 'Скопировано' : 'Copied') : (lang === 'ru' ? 'Копировать' : 'Copy')}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] hover:bg-[var(--container-high)] text-xs font-bold text-[var(--on-surface)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Download .txt"
              >
                <FileText size={13} />
                <span>.TXT</span>
              </button>

              <button
                onClick={handleDownloadSrt}
                className="px-3 py-1.5 rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] hover:bg-[var(--container-high)] text-xs font-bold text-[var(--on-surface)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Download .srt (SubRip format with timestamps)"
              >
                <FileCode size={13} />
                <span>.SRT</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] hover:bg-[var(--container-high)] text-xs font-bold text-[var(--on-surface)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Download .json"
              >
                <FileJson size={13} />
                <span>.JSON</span>
              </button>
            </div>
          </div>

          {/* TRANSCRIPT DISPLAY AREA */}
          <div className="flex-1 rounded-3xl border border-[var(--outline-var)] bg-[var(--surface-dim)]/60 p-4 md:p-6 overflow-y-auto min-h-[260px] shadow-inner">
            {viewMode === 'text' ? (
              <div className="text-sm md:text-base leading-relaxed text-[var(--on-surface)] whitespace-pre-wrap select-text font-normal font-sans">
                {filterQuery ? (
                  // Highlight search matches
                  filteredSnippets.map((s) => s.text).join(' ')
                ) : (
                  data.text
                )}
              </div>
            ) : (
              <div className="space-y-2 select-text">
                {filteredSnippets.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[var(--outline)] italic">
                    {lang === 'ru' ? 'Совпадений не найдено' : 'No matches found'}
                  </div>
                ) : (
                  filteredSnippets.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)]/60 flex items-start gap-3 hover:border-[var(--outline)] transition-colors group"
                    >
                      <span
                        className="px-2 py-1 rounded-lg text-[10px] font-black text-white shrink-0 tabular-nums shadow-2xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {fmtShortTime(s.start)}
                      </span>
                      <p className="text-xs md:text-sm text-[var(--on-surface)] leading-snug flex-1 select-text">
                        {s.text}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(s.text);
                          playChime?.('toast');
                          triggerToast?.(lang === 'ru' ? 'Строка скопирована' : 'Line copied');
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-[var(--surface-dim)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-all cursor-pointer shrink-0"
                        title={lang === 'ru' ? 'Копировать строку' : 'Copy line'}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EMPTY STATE / PROMO & RECENT TRANSCRIPTS */
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto min-h-0">
          <div className="flex flex-col items-center justify-center py-8 text-center shrink-0">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-white mb-4 shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Subtitles size={32} />
            </div>
            <h3 className="text-lg font-black text-[var(--on-surface)] tracking-tight">
              {lang === 'ru' ? 'Конвертируйте YouTube-видео в субтитры' : 'Convert YouTube videos to subtitles'}
            </h3>
            <p className="text-xs md:text-sm text-[var(--on-surface-var)] max-w-md mt-1.5 leading-relaxed">
              {lang === 'ru'
                ? 'Вставьте ссылку на любое видео YouTube сверху для моментального извлечения полного текста, таймкодов и экспорта в .TXT, .SRT или .JSON.'
                : 'Paste any YouTube video link above to instantly extract transcripts, timestamps, and export to .TXT, .SRT, or .JSON formats.'}
            </p>
          </div>

          {recentTranscripts && recentTranscripts.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-bold text-[var(--on-surface)] mb-4">
                {lang === 'ru' ? 'Недавние транскрипты' : 'Recent Transcripts'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recentTranscripts.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setVideoUrl(t.videoId);
                      handleFetch(undefined, t.videoId);
                    }}
                    className="p-3 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] hover:border-[var(--outline)] transition-all cursor-pointer flex gap-3 group"
                  >
                    <div className="w-16 h-12 rounded-lg bg-black overflow-hidden shrink-0">
                      <img src={t.thumbnail} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--on-surface)] line-clamp-2 leading-snug">
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[var(--on-surface-var)] truncate">{t.author}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--surface)] text-[var(--on-surface)] uppercase font-black">
                          {t.language}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
