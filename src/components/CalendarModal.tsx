import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  primaryColor: string;
}

export default function CalendarModal({ isOpen, onClose, lang, primaryColor }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Record<string, string[]>>({});
  const [newEventText, setNewEventText] = useState<string>('');

  const t = translations[lang];

  // Load events from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('linkerru_events');
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse calendar events', e);
      }
    }
  }, []);

  const saveEvents = (updated: Record<string, string[]>) => {
    setEvents(updated);
    localStorage.setItem('linkerru_events', JSON.stringify(updated));
  };

  const changeMonth = (delta: number) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    setCurrentDate(next);
  };

  // Helper to format date keys: YYYY-MM-DD
  const getDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventText.trim()) return;

    const key = getDateKey(selectedDate);
    const dayEvents = events[key] || [];
    const updated = {
      ...events,
      [key]: [...dayEvents, newEventText.trim()],
    };
    saveEvents(updated);
    setNewEventText('');
  };

  const handleDeleteEvent = (index: number) => {
    const key = getDateKey(selectedDate);
    const dayEvents = events[key] || [];
    const updatedEvents = [...dayEvents];
    updatedEvents.splice(index, 1);

    const updated = { ...events };
    if (updatedEvents.length === 0) {
      delete updated[key];
    } else {
      updated[key] = updatedEvents;
    }
    saveEvents(updated);
  };

  // Build calendar grid days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Day of week index (0=Monday, 6=Sunday for standard European calendar)
  let startWeekdayIndex = firstDayOfMonth.getDay() - 1;
  if (startWeekdayIndex < 0) startWeekdayIndex = 6; // Sunday is 6

  const days: (Date | null)[] = [];

  // Pad the start with nulls
  for (let i = 0; i < startWeekdayIndex; i++) {
    days.push(null);
  }

  // Populate days of month
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }

  // Pad the end so the grid always has 42 cells (6 rows × 7 days).
  // This keeps the grid height constant regardless of how many weeks
  // the current month spans — preventing the controls below from jumping.
  while (days.length < 42) {
    days.push(null);
  }

  const selectedKey = getDateKey(selectedDate);
  const selectedDayEvents = events[selectedKey] || [];

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const monthLabel = currentDate.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            id="calendar-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative z-10 w-[560px] h-[640px] overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-xl shadow-2xl flex flex-col"
            id="calendar-modal"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-6 pb-2" id="calendar-header-group">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--container)] border border-[var(--outline-var)]" id="calendar-icon-container">
                  <Calendar size={20} className="text-[var(--on-surface-var)]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-[var(--on-surface)]" id="calendar-modal-title">
                    {t.calendar_title}
                  </h3>
                  <p className="text-xs text-[var(--on-surface-var)] font-semibold mt-0.5">
                    {t.calendar_desc}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                id="calendar-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6" id="calendar-scroll-content">
              {/* Month Bar */}
              <div className="flex items-center justify-between bg-[var(--container)] border border-[var(--outline-var)] rounded-2xl p-2.5" id="calendar-month-bar">
                <span className="text-sm font-extrabold text-[var(--on-surface)] capitalize pl-3">
                  {monthLabel}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="h-8 w-8 rounded-full border border-[var(--outline-var)] bg-[var(--surface)] flex items-center justify-center text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] transition-all"
                    id="month-prev-btn"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="h-8 w-8 rounded-full border border-[var(--outline-var)] bg-[var(--surface)] flex items-center justify-center text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] transition-all"
                    id="month-next-btn"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Grid Layout */}
              <div>
                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-center" id="calendar-weekday-header">
                  {[t.day_mon, t.day_tue, t.day_wed, t.day_thu, t.day_fri, t.day_sat, t.day_sun].map((day, idx) => (
                    <div key={idx} className="text-xs font-bold text-[var(--on-surface-var)] py-1 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1.5" id="calendar-days-grid">
                  {days.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }

                    const isToday = isSameDay(day, today);
                    const isSelected = isSameDay(day, selectedDate);
                    const key = getDateKey(day);
                    const hasEvents = !!events[key];

                    return (
                      <button
                        key={`day-${day.getDate()}`}
                        onClick={() => setSelectedDate(day)}
                        className={`relative aspect-square rounded-2xl border flex flex-col items-center justify-center font-bold text-sm transition-all select-none ${
                          isSelected
                            ? 'shadow-md border-transparent text-[var(--surface)]'
                            : isToday
                            ? 'bg-[var(--surface-dim)] border-[var(--outline)] text-[var(--on-surface)] hover:bg-[var(--container-high)]'
                            : 'bg-transparent border-transparent text-[var(--on-surface)] hover:bg-[var(--container)]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? primaryColor : undefined,
                        }}
                        id={`calendar-day-btn-${day.getDate()}`}
                      >
                        <span>{day.getDate()}</span>

                        {/* Event Indicator */}
                        {hasEvents && (
                          <span
                            className={`absolute bottom-2.5 w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-[var(--surface)]' : 'bg-[var(--accent-secondary)]'
                            }`}
                            style={{
                              backgroundColor: isSelected ? '#ffffff' : primaryColor,
                            }}
                          />
                        )}

                        {/* Today Outline */}
                        {isToday && !isSelected && (
                          <span
                            className="absolute inset-1 rounded-2xl border-2 pointer-events-none"
                            style={{ borderColor: primaryColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Events Drawer */}
              <div className="border-t border-[var(--outline-var)] pt-4" id="calendar-events-section">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)]">
                    {selectedDate.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h4>
                  <span className="text-[10px] font-bold text-[var(--outline)] uppercase">
                    {selectedDayEvents.length} {t.ph_links}
                  </span>
                </div>

                {/* List of Events */}
                <div className="space-y-2 max-h-[160px] overflow-y-auto mb-4pr-1" id="calendar-events-list">
                  {selectedDayEvents.length === 0 ? (
                    <div className="text-xs text-[var(--outline)] italic text-center py-4">
                      {t.no_events}
                    </div>
                  ) : (
                    selectedDayEvents.map((ev, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)]"
                      >
                        <span className="text-xs font-semibold text-[var(--on-surface)]">
                          {ev}
                        </span>
                        <button
                          onClick={() => handleDeleteEvent(index)}
                          className="p-1 text-[var(--on-surface-var)] hover:text-[var(--accent-secondary)] transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Event Form */}
                <form onSubmit={handleAddEvent} className="flex gap-2" id="add-event-form">
                  <input
                    type="text"
                    value={newEventText}
                    onChange={(e) => setNewEventText(e.target.value)}
                    placeholder={t.event_placeholder}
                    className="flex-1 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--on-surface)] outline-none focus:border-[var(--on-surface)]"
                    id="add-event-input"
                  />
                  <button
                    type="submit"
                    className="flex h-11 px-4 items-center justify-center gap-1 rounded-full text-xs font-extrabold text-[var(--surface)] transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                    id="add-event-submit"
                  >
                    <Plus size={14} />
                    <span>{t.add_event}</span>
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
