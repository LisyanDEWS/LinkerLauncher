import React, { useState, useEffect } from 'react';
import { History, Sparkles, GitCommit, ChevronDown, ChevronUp, FileCode, Plus, Minus, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ChangelogModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  lang: Language;
  embeddedInWindow?: boolean;
}

interface CommitEntry {
  sha: string;
  fullSha: string;
  message: string;
  body?: string;
  author: string;
  date: string;
}

interface CommitDetail {
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}

export default function ChangelogModal({ lang, embeddedInWindow = true }: ChangelogModalProps) {
  const t = translations[lang] || translations['ru'];
  const [commits, setCommits] = useState<CommitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Selected commit for detailed description view
  const [selectedCommit, setSelectedCommit] = useState<CommitEntry | null>(null);
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://api.github.com/repos/LisyanDEWS/LinkerLauncher/commits?per_page=30', {
          headers: { 'Accept': 'application/vnd.github+json' },
        });
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          const formatted: CommitEntry[] = data.map((c: any) => {
            const rawMsg = c.commit?.message || 'No message';
            const lines = rawMsg.split('\n');
            const title = lines[0] || 'No message';
            const body = lines.slice(1).join('\n').trim();

            return {
              sha: c.sha?.slice(0, 7) || 'unknown',
              fullSha: c.sha || '',
              message: title,
              body: body,
              author: (c.commit?.author?.name || c.commit?.committer?.name || 'Unknown') === 'zxc-mrt1n-o4' ? 'nark0zz-dev' : (c.commit?.author?.name || c.commit?.committer?.name || 'Unknown'),
              date: c.commit?.author?.date || c.commit?.committer?.date || '',
            };
          });
          setCommits(formatted);
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch detailed commit info when a commit is clicked
  const handleSelectCommit = async (commit: CommitEntry) => {
    if (selectedCommit?.fullSha === commit.fullSha) {
      setSelectedCommit(null);
      setCommitDetail(null);
      return;
    }

    setSelectedCommit(commit);
    setCommitDetail(null);
    setDetailLoading(true);

    try {
      const res = await fetch(`https://api.github.com/repos/LisyanDEWS/LinkerLauncher/commits/${commit.fullSha}`, {
        headers: { 'Accept': 'application/vnd.github+json' },
      });
      const data = await res.json();
      if (data && data.files) {
        setCommitDetail({
          stats: data.stats,
          files: data.files,
        });
      }
    } catch (e) {
      console.error('Failed to load commit detail', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full h-full p-5 bg-transparent text-[var(--on-surface)] flex flex-col overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3.5 flex-shrink-0 border-b border-[var(--outline-var)] pb-3">
        <div className="flex items-center gap-2">
          <History size={17} className="text-[var(--accent)]" />
          <span className="text-xs font-black tracking-widest text-[var(--on-surface)] uppercase">
            {t.changelog_title || (lang === 'ru' ? 'История изменений' : 'Changelog')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/LisyanDEWS/LinkerLauncher/commits/main"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 rounded-full hover:bg-[var(--accent)]/20 transition-colors flex items-center gap-1"
          >
            <span>GitHub</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Main Commit List and Details Split/View */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5" id="changelog-list-content">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-[var(--outline-var)] border-t-[var(--accent)] rounded-full animate-spin" />
            <span className="text-xs text-[var(--on-surface-var)] font-semibold">
              {lang === 'ru' ? 'Загрузка коммитов...' : 'Loading commits...'}
            </span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-xs text-[var(--on-surface-var)] font-semibold">
              {lang === 'ru' ? 'Не удалось загрузить изменения' : 'Failed to load changes'}
            </span>
            <a
              href="https://github.com/LisyanDEWS/LinkerLauncher/commits/main"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[var(--accent)] hover:underline"
            >
              {lang === 'ru' ? 'Открыть на GitHub' : 'Open on GitHub'}
            </a>
          </div>
        )}

        {!loading && !error && commits.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <span className="text-xs text-[var(--on-surface-var)] font-semibold">
              {lang === 'ru' ? 'Нет коммитов' : 'No commits'}
            </span>
          </div>
        )}

        {!loading && !error && commits.map((commit, idx) => {
          const isSelected = selectedCommit?.fullSha === commit.fullSha;

          return (
            <div
              key={commit.fullSha || commit.sha}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'bg-[var(--surface)] border-[var(--accent)] shadow-md'
                  : 'bg-[var(--surface-dim)]/50 border-[var(--outline-var)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-dim)]'
              }`}
            >
              {/* Clickable Header for Commit */}
              <button
                type="button"
                onClick={() => handleSelectCommit(commit)}
                className="w-full text-left p-3.5 flex flex-col gap-2 cursor-pointer outline-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <GitCommit size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-[var(--on-surface)] leading-snug break-words">
                      {commit.message}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {idx === 0 && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full">
                        {lang === 'ru' ? 'Последний' : 'Latest'}
                      </span>
                    )}
                    <div className="text-[var(--on-surface-var)] opacity-60">
                      {isSelected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-[var(--on-surface-var)] bg-[var(--container)] px-1.5 py-0.5 rounded">
                    {commit.sha}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--on-surface-var)]/80">
                    {commit.author}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--on-surface-var)]/50">
                    {formatDate(commit.date)}
                  </span>
                </div>
              </button>

              {/* Detailed Commit Description & Files Changed Expansion */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-[var(--outline-var)] p-3.5 bg-[var(--container)]/40 flex flex-col gap-3 text-left"
                  >
                    {/* Multi-line Description Body */}
                    {commit.body && (
                      <div className="text-xs font-medium text-[var(--on-surface-var)] whitespace-pre-wrap bg-[var(--surface)] p-3 rounded-xl border border-[var(--outline-var)] font-mono leading-relaxed">
                        {commit.body}
                      </div>
                    )}

                    {/* Stats & Files Modified Breakdown */}
                    {detailLoading && (
                      <div className="flex items-center justify-center py-4 gap-2 text-xs text-[var(--on-surface-var)] font-semibold">
                        <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                        <span>{lang === 'ru' ? 'Загрузка списка изменённых файлов...' : 'Loading changed files...'}</span>
                      </div>
                    )}

                    {!detailLoading && commitDetail && (
                      <div className="space-y-2.5">
                        {/* Summary Bar */}
                        {commitDetail.stats && (
                          <div className="flex items-center gap-3 text-[11px] font-bold">
                            <span className="text-[var(--on-surface)]">
                              {lang === 'ru' ? `Изменено файлов: ${commitDetail.files?.length || 0}` : `Files changed: ${commitDetail.files?.length || 0}`}
                            </span>
                            <span className="flex items-center gap-0.5 text-emerald-500 font-mono">
                              <Plus size={11} />
                              {commitDetail.stats.additions}
                            </span>
                            <span className="flex items-center gap-0.5 text-rose-500 font-mono">
                              <Minus size={11} />
                              {commitDetail.stats.deletions}
                            </span>
                          </div>
                        )}

                        {/* List of Files Modified */}
                        {commitDetail.files && commitDetail.files.length > 0 && (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {commitDetail.files.map((f) => (
                              <div
                                key={f.filename}
                                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileCode size={13} className="text-[var(--accent)] shrink-0" />
                                  <span className="font-mono text-[11px] text-[var(--on-surface)] truncate">
                                    {f.filename}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                                  {f.status === 'added' && (
                                    <span className="text-emerald-500 font-bold px-1 rounded bg-emerald-500/10">A</span>
                                  )}
                                  {f.status === 'removed' && (
                                    <span className="text-rose-500 font-bold px-1 rounded bg-rose-500/10">D</span>
                                  )}
                                  {f.status === 'modified' && (
                                    <span className="text-blue-500 font-bold px-1 rounded bg-blue-500/10">M</span>
                                  )}
                                  <span className="text-emerald-600 font-bold">+{f.additions}</span>
                                  <span className="text-rose-600 font-bold">-{f.deletions}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Commit Link on GitHub */}
                    <div className="pt-1 flex justify-end">
                      <a
                        href={`https://github.com/LisyanDEWS/LinkerLauncher/commit/${commit.fullSha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                      >
                        <span>{lang === 'ru' ? 'Смотреть полный диф на GitHub' : 'View full diff on GitHub'}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
