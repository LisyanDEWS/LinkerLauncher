import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, X, Image as ImageIcon, StickyNote } from 'lucide-react';
import { Language, ThemeMode, Material3Palette } from '../types';
import {
  KeepNote,
  getAllNotes,
  addNote,
  updateNote,
  deleteNoteAndImages,
  addImage,
  getImage,
} from '../lib/keepsStorage';

/**
 * KeepsApp — a lightweight local notes app (Google Keep style).
 *
 * Notes support text + multiple images. Images are stored as Blobs in
 * IndexedDB ONLY — never uploaded to Firebase. This is a local scratchpad.
 *
 * Notes are rendered as a masonry-style grid of colored cards. Each card is
 * editable inline. Images appear as thumbnails inside the card.
 */

interface KeepsAppProps {
  lang: Language;
  theme: ThemeMode;
  activePalette: Material3Palette;
}

const NOTE_COLORS = [
  'var(--surface)',
  '#FFF9C4', // soft yellow
  '#F8BBD0', // soft pink
  '#C5E1A5', // soft green
  '#B3E5FC', // soft blue
  '#D1C4E9', // soft purple
];

const DARK_NOTE_COLORS = [
  'var(--surface)',
  '#5D5A1F',
  '#5D2F3F',
  '#3A4A2A',
  '#1F3A4A',
  '#3A2F4A',
];

export function KeepsApp({ lang, theme, activePalette }: KeepsAppProps) {
  const isRu = lang === 'ru';
  const accent = activePalette.primary;
  const colors = theme === 'dark' ? DARK_NOTE_COLORS : NOTE_COLORS;

  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerColor, setComposerColor] = useState(0);
  const [composerImages, setComposerImages] = useState<{ id: number; url: string }[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all notes on mount.
  const refresh = useCallback(async () => {
    const all = await getAllNotes();
    setNotes(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Resolve image blobs to object URLs for display.
  useEffect(() => {
    const allIds = new Set<number>();
    notes.forEach((n) => n.imageIds.forEach((id) => allIds.add(id)));
    composerImages.forEach((img) => allIds.add(img.id));
    const missing = [...allIds].filter((id) => !imageUrls[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map(async (id) => {
        const blob = await getImage(id);
        if (!blob) return [id, ''] as const;
        return [id, URL.createObjectURL(blob)] as const;
      })
    ).then((entries) => {
      if (cancelled) {
        entries.forEach(([, url]) => url && URL.revokeObjectURL(url));
        return;
      }
      setImageUrls((prev) => {
        const next = { ...prev };
        entries.forEach(([id, url]) => {
          if (url) next[id] = url;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [notes, composerImages, imageUrls]);

  // Revoke object URLs on unmount.
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach((url: string) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added: { id: number; url: string }[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const id = await addImage(file);
      const url = URL.createObjectURL(file);
      added.push({ id, url });
    }
    setComposerImages((prev) => [...prev, ...added]);
  };

  const handleRemoveComposerImage = (id: number) => {
    setComposerImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSaveNote = async () => {
    const text = composerText.trim();
    if (!text && composerImages.length === 0) {
      setComposerOpen(false);
      setComposerText('');
      setComposerImages([]);
      return;
    }
    await addNote({
      text,
      imageIds: composerImages.map((img) => img.id),
      color: composerColor,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setComposerOpen(false);
    setComposerText('');
    setComposerImages([]);
    setComposerColor(0);
    refresh();
  };

  const handleDeleteNote = async (note: KeepNote) => {
    await deleteNoteAndImages(note);
    refresh();
  };

  const handleUpdateNoteText = async (note: KeepNote, text: string) => {
    await updateNote({ ...note, text, updatedAt: Date.now() });
    refresh();
  };

  const handleUpdateNoteColor = async (note: KeepNote, colorIdx: number) => {
    await updateNote({ ...note, color: colorIdx, updatedAt: Date.now() });
    refresh();
  };

  return (
    <div className="flex h-full w-full flex-col bg-transparent" style={{ ['--accent' as string]: accent }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--outline-var)] shrink-0">
        <div className="flex items-center gap-2">
          <StickyNote size={18} className="text-[var(--accent)]" />
          <span className="text-sm font-black text-[var(--on-surface)] uppercase tracking-tight">
            {isRu ? 'Заметки' : 'Keeps'}
          </span>
        </div>
        <span className="text-[10px] text-[var(--on-surface-var)] font-bold">
          {isRu ? 'Только локально' : 'Local only'}
        </span>
      </div>

      {/* Scrollable notes area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {notes.length === 0 && !composerOpen ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <StickyNote size={48} className="text-[var(--outline)]" />
            <p className="text-xs text-[var(--on-surface-var)] max-w-[220px]">
              {isRu ? 'Нет заметок. Нажмите +, чтобы создать первую.' : 'No notes yet. Tap + to create your first one.'}
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-3 [column-fill:_balance]">
            <AnimatePresence>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="mb-3 break-inside-avoid rounded-2xl border border-[var(--outline-var)] p-3 shadow-sm"
                  style={{ backgroundColor: colors[note.color] ?? colors[0] }}
                >
                  {note.imageIds.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {note.imageIds.map((imgId) => (
                        <img
                          key={imgId}
                          src={imageUrls[imgId]}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover border border-[var(--outline-var)]"
                        />
                      ))}
                    </div>
                  )}
                  <textarea
                    value={note.text}
                    onChange={(e) => {
                      const text = e.target.value;
                      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, text } : n)));
                      // Debounce save
                      const noteRef = note;
                      window.clearTimeout((handleUpdateNoteText as unknown as { _t?: number })._t);
                      (handleUpdateNoteText as unknown as { _t?: number })._t = window.setTimeout(() => {
                        handleUpdateNoteText(noteRef, text);
                      }, 600);
                    }}
                    placeholder={isRu ? 'Текст заметки…' : 'Note text…'}
                    className="w-full resize-none bg-transparent text-xs text-[var(--on-surface)] outline-none placeholder:text-[var(--on-surface-var)]"
                    rows={Math.max(2, Math.ceil(note.text.length / 24))}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-1">
                      {colors.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleUpdateNoteColor(note, i)}
                          className="h-3.5 w-3.5 rounded-full border border-[var(--outline-var)] transition-transform hover:scale-125"
                          style={{ backgroundColor: c }}
                          title={isRu ? `Цвет ${i + 1}` : `Color ${i + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--on-surface-var)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      title={isRu ? 'Удалить' : 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Composer */}
        <AnimatePresence>
          {composerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="columns-2 gap-3"
            >
              <div
                className="mb-3 break-inside-avoid rounded-2xl border border-[var(--outline)] p-3 shadow-lg"
                style={{ backgroundColor: colors[composerColor] }}
              >
                {composerImages.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {composerImages.map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.url}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover border border-[var(--outline-var)]"
                        />
                        <button
                          onClick={() => handleRemoveComposerImage(img.id)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--on-surface)] shadow border border-[var(--outline-var)]"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  autoFocus
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder={isRu ? 'Новая заметка…' : 'New note…'}
                  className="w-full resize-none bg-transparent text-xs text-[var(--on-surface)] outline-none placeholder:text-[var(--on-surface-var)]"
                  rows={3}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors"
                      title={isRu ? 'Добавить изображение' : 'Add image'}
                    >
                      <ImageIcon size={14} />
                    </button>
                    <div className="flex gap-1">
                      {colors.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setComposerColor(i)}
                          className="h-3.5 w-3.5 rounded-full border border-[var(--outline-var)] transition-transform hover:scale-125"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleSaveNote}
                    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: accent }}
                  >
                    {isRu ? 'Готово' : 'Done'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      {!composerOpen && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setComposerOpen(true)}
          className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ backgroundColor: accent }}
          title={isRu ? 'Новая заметка' : 'New note'}
        >
          <Plus size={22} />
        </motion.button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleAddImages(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
