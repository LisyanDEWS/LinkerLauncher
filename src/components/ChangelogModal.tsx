import React, { useState, useEffect } from 'react';
import { History, Sparkles, GitCommit } from 'lucide-react';
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
  message: string;
  author: string;
  date: string;
}

export default function ChangelogModal({ lang, embeddedInWindow = true }: ChangelogModalProps) {
  const t = translations[lang];
  const [commits, setCommits] = useState<CommitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
          const formatted: CommitEntry[] = data.map((c: any) => ({
            sha: c.sha?.slice(0, 7) || 'unknown',
            message: c.commit?.message?.split('\n')[0] || 'No message',
            author: (c.commit?.author?.name || c.commit?.committer?.name || 'Unknown') === 'zxc-mrt1n-o4' ? 'nark0zz-dev' : (c.commit?.author?.name || c.commit?.committer?.name || 'Unknown'),
            date: c.commit?.author?.date || c.commit?.committer?.date || '',
          }));
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full h-full p-6 bg-[var(--surface-dim)] text-[var(--on-surface)] flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-4 flex-shrink-0 border-b border-[var(--outline-var)] pb-3">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[var(--accent)]" />
          <span className="text-xs font-black tracking-widest text-[var(--on-surface)] uppercase">
            {t.changelog_title}
          </span>
        </div>
        <a
          href="https://github.com/LisyanDEWS/LinkerLauncher/commits/main"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 rounded-full hover:bg-[var(--accent)]/20 transition-colors"
        >
          GitHub
        </a>
      </div>

      <div className="flex-1 space-y-3 pr-1" id="changelog-list-content">
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

        {!loading && !error && commits.map((commit, idx) => (
          <div
            key={commit.sha}
            className={`space-y-1.5 pb-3 ${idx < commits.length - 1 ? 'border-b border-[var(--outline-var)]' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <GitCommit size={13} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <span className="text-xs font-bold text-[var(--on-surface)] truncate">
                  {commit.message}
                </span>
              </div>
              {idx === 0 && (
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full shrink-0">
                  {lang === 'ru' ? 'Последний' : 'Latest'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 pl-5">
              <span className="text-[10px] font-mono font-bold text-[var(--on-surface-var)] bg-[var(--container)] px-1.5 py-0.5 rounded">
                {commit.sha}
              </span>
              <span className="text-[10px] font-semibold text-[var(--on-surface-var)]/70">
                {commit.author}
              </span>
              <span className="text-[10px] font-semibold text-[var(--on-surface-var)]/50">
                {formatDate(commit.date)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
