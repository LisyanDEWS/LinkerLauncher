import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Flame,
  CheckCircle2,
  Circle,
  Calendar,
  BarChart3,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Download,
  Upload,
  Trophy,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface DailyRecord {
  date: string; // YYYY-MM-DD
  goal: string;
  completed: boolean;
  subtasks: SubTask[];
  pomodorosCompleted: number;
}

interface DailyFocusAppProps {
  primaryColor?: string;
  lang?: Language;
}

export default function DailyFocusApp({ primaryColor = '#6750A4', lang = 'ru' }: DailyFocusAppProps) {
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayStr();

  // Storage
  const [records, setRecords] = useState<Record<string, DailyRecord>>(() => {
    try {
      const saved = localStorage.getItem('linkerru_daily_focus_records');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      [todayStr]: {
        date: todayStr,
        goal: '',
        completed: false,
        subtasks: [],
        pomodorosCompleted: 0,
      }
    };
  });

  const [activeTab, setActiveTab] = useState<'focus' | 'calendar' | 'stats' | 'timer'>('focus');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [editingGoal, setEditingGoal] = useState('');

  // Pomodoro State
  const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
  const [pomoIsRunning, setPomoIsRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');

  // Active record
  const currentRecord: DailyRecord = records[todayStr] || {
    date: todayStr,
    goal: '',
    completed: false,
    subtasks: [],
    pomodorosCompleted: 0,
  };

  useEffect(() => {
    setEditingGoal(currentRecord.goal);
  }, [currentRecord.goal]);

  const saveRecords = (newRecs: Record<string, DailyRecord>) => {
    setRecords(newRecs);
    try {
      localStorage.setItem('linkerru_daily_focus_records', JSON.stringify(newRecs));
    } catch (e) {
      console.warn('Failed to save daily focus:', e);
    }
  };

  const updateCurrentRecord = (updater: (prev: DailyRecord) => DailyRecord) => {
    const updated = updater(currentRecord);
    const newRecs = { ...records, [todayStr]: updated };
    saveRecords(newRecs);
  };

  // Set Goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal.trim()) return;
    updateCurrentRecord((prev) => ({
      ...prev,
      goal: editingGoal.trim(),
    }));
  };

  // Toggle Goal Completed
  const handleToggleGoal = () => {
    updateCurrentRecord((prev) => ({
      ...prev,
      completed: !prev.completed,
    }));
  };

  // Subtasks
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newTask: SubTask = {
      id: Date.now().toString(),
      title: newSubtaskText.trim(),
      completed: false,
    };
    updateCurrentRecord((prev) => {
      const nextSubtasks = [...prev.subtasks, newTask];
      const allDone = nextSubtasks.length > 0 && nextSubtasks.every((t) => t.completed);
      return {
        ...prev,
        subtasks: nextSubtasks,
        completed: allDone ? true : prev.completed,
      };
    });
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (id: string) => {
    updateCurrentRecord((prev) => {
      const nextSubtasks = prev.subtasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      const allDone = nextSubtasks.length > 0 && nextSubtasks.every((t) => t.completed);
      return {
        ...prev,
        subtasks: nextSubtasks,
        completed: allDone ? true : prev.completed,
      };
    });
  };

  const handleDeleteSubtask = (id: string) => {
    updateCurrentRecord((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((t) => t.id !== id),
    }));
  };

  // Pomodoro Logic
  useEffect(() => {
    let timer: any = null;
    if (pomoIsRunning) {
      timer = setInterval(() => {
        setPomoTimeLeft((prev) => {
          if (prev <= 1) {
            setPomoIsRunning(false);
            if (pomoMode === 'work') {
              updateCurrentRecord((r) => ({ ...r, pomodorosCompleted: (r.pomodorosCompleted || 0) + 1 }));
              setPomoMode('break');
              return 5 * 60;
            } else {
              setPomoMode('work');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pomoIsRunning, pomoMode, todayStr]);

  const formatPomoTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Streak & Stats Calculations
  const stats = useMemo(() => {
    const dates = Object.keys(records).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let totalCompleted = 0;

    let tempStreak = 0;
    const today = new Date();

    // Check last 90 days
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const rec = records[k];
      if (rec && rec.completed) {
        tempStreak++;
        totalCompleted++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Current streak ending today or yesterday
    let checkDate = new Date(today);
    while (true) {
      const k = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      const rec = records[k];
      if (rec && rec.completed) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const totalDaysRecorded = Math.max(1, Object.keys(records).length);
    const completionRate = Math.round((totalCompleted / totalDaysRecorded) * 100);

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalCompleted,
      completionRate,
    };
  }, [records]);

  // Export / Import
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `daily_focus_export_${todayStr}.json`);
    a.click();
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Focus Goal', 'Completed', 'Subtasks Total', 'Subtasks Done', 'Pomodoros'];
    const rows = Object.values(records).map((r) => [
      r.date,
      `"${(r.goal || '').replace(/"/g, '""')}"`,
      r.completed ? 'YES' : 'NO',
      r.subtasks?.length || 0,
      r.subtasks?.filter((t) => t.completed).length || 0,
      r.pomodorosCompleted || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csvContent));
    a.setAttribute('download', `daily_focus_${todayStr}.csv`);
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object') {
          saveRecords({ ...records, ...parsed });
        }
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
  };

  // Progress Bar for Subtasks
  const subtasksTotal = currentRecord.subtasks?.length || 0;
  const subtasksDone = currentRecord.subtasks?.filter((t) => t.completed).length || 0;
  const progressPercent = subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : currentRecord.completed ? 100 : 0;

  return (
    <div className="flex flex-col h-full bg-[var(--surface-dim)] text-[var(--on-surface)] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface)] border-b border-[var(--outline-var)]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight">
              {isRu ? 'Daily Focus' : isUk ? 'Daily Focus' : 'Daily Focus'}
            </h1>
            <p className="text-xs text-[var(--on-surface-var)] font-medium">
              {new Date().toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black shadow-xs">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{stats.currentStreak} {isRu ? 'дней ударно' : 'days streak'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-center gap-1.5 p-2 bg-[var(--surface-dim)] border-b border-[var(--outline-var)]">
        {[
          { id: 'focus', icon: Target, label: isRu ? 'Фокус дня' : 'Today Focus' },
          { id: 'timer', icon: Timer, label: isRu ? 'Таймер' : 'Pomodoro' },
          { id: 'calendar', icon: Calendar, label: isRu ? 'Стрики' : 'Streaks' },
          { id: 'stats', icon: BarChart3, label: isRu ? 'Статистика' : 'Analytics' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm border border-[var(--outline-var)]'
                  : 'text-[var(--on-surface-var)] hover:bg-[var(--surface)]/50'
              }`}
            >
              <tab.icon className="w-4 h-4" style={{ color: active ? primaryColor : undefined }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* TAB 1: DAILY FOCUS */}
        {activeTab === 'focus' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
            {/* Primary Focus Card */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] shadow-sm relative overflow-hidden">
              <div
                className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl opacity-15 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black tracking-wider uppercase text-[var(--on-surface-var)]">
                  {isRu ? '🎯 ГЛАВНАЯ ЦЕЛЬ НА СЕГОДНЯ' : '🎯 ONE MAIN GOAL TODAY'}
                </span>
                {currentRecord.goal && (
                  <button
                    onClick={handleToggleGoal}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      currentRecord.completed
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-[var(--surface-dim)] text-[var(--on-surface-var)] hover:border-[var(--outline-var)]'
                    }`}
                  >
                    {currentRecord.completed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isRu ? 'Выполнено' : 'Completed'}</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5" />
                        <span>{isRu ? 'В процессе' : 'In Progress'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {currentRecord.goal ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={handleToggleGoal}
                      className="mt-1 flex-shrink-0 cursor-pointer text-emerald-500 hover:scale-110 transition"
                    >
                      {currentRecord.completed ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-7 h-7 text-[var(--outline-var)] hover:text-emerald-500" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p
                        className={`text-lg sm:text-xl font-bold leading-snug ${
                          currentRecord.completed ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {currentRecord.goal}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--outline-var)]/50">
                    <div className="flex justify-between text-xs font-bold text-[var(--on-surface-var)]">
                      <span>{isRu ? 'Прогресс дня' : 'Day Progress'}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[var(--surface-dim)] rounded-full overflow-hidden border border-[var(--outline-var)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: currentRecord.completed ? '#10b981' : primaryColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveGoal} className="space-y-3">
                  <p className="text-sm text-[var(--on-surface-var)]">
                    {isRu
                      ? 'Какое одно главное дело сделает сегодняшний день победным?'
                      : 'What single accomplishment will make today a victory?'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingGoal}
                      onChange={(e) => setEditingGoal(e.target.value)}
                      placeholder={isRu ? 'Например: Завершить презентацию проекта' : 'e.g. Finish project presentation'}
                      className="flex-1 px-4 py-3 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-sm font-medium focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="submit"
                      disabled={!editingGoal.trim()}
                      className="px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-md transition disabled:opacity-40 cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isRu ? 'Установить' : 'Set Focus'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Subtasks / Milestones Section */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--on-surface-var)]">
                  {isRu ? 'Шаги и контрольные точки' : 'Milestones & Subtasks'} ({subtasksDone}/{subtasksTotal})
                </h3>
              </div>

              {/* Add Subtask */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  placeholder={isRu ? 'Добавить шаг...' : 'Add step...'}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-xs sm:text-sm font-medium focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskText.trim()}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-2xl font-bold text-xs bg-[var(--surface-dim)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)]/80 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isRu ? 'Добавить' : 'Add'}</span>
                </button>
              </form>

              {/* Subtask list */}
              <div className="space-y-2">
                {currentRecord.subtasks?.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-dim)]/50 border border-[var(--outline-var)]/60 transition hover:bg-[var(--surface-dim)]"
                  >
                    <button
                      onClick={() => handleToggleSubtask(task.id)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--outline-var)] shrink-0" />
                      )}
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          task.completed ? 'line-through opacity-50' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteSubtask(task.id)}
                      className="p-1.5 rounded-lg text-[var(--on-surface-var)] hover:text-red-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POMODORO TIMER */}
        {activeTab === 'timer' && (
          <div className="max-w-md mx-auto space-y-6 text-center animate-fade-up">
            <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] shadow-sm space-y-6">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    pomoMode === 'work'
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}
                >
                  {pomoMode === 'work' ? (isRu ? '🔥 Фокус-сессия' : 'Focus Session') : isRu ? '☕ Перерыв' : 'Break'}
                </span>
              </div>

              {/* Huge Timer Digits */}
              <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-[var(--on-surface)]">
                {formatPomoTime(pomoTimeLeft)}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPomoIsRunning(!pomoIsRunning)}
                  className="flex items-center gap-2 px-8 py-4 rounded-3xl text-white font-black text-base shadow-lg transition hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {pomoIsRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                  <span>{pomoIsRunning ? (isRu ? 'Пауза' : 'Pause') : isRu ? 'Старт' : 'Start'}</span>
                </button>
                <button
                  onClick={() => {
                    setPomoIsRunning(false);
                    setPomoTimeLeft(pomoMode === 'work' ? 25 * 60 : 5 * 60);
                  }}
                  className="p-4 rounded-3xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--outline-var)]/60 text-xs font-semibold text-[var(--on-surface-var)]">
                {isRu ? '🍅 Завершено сессий сегодня:' : '🍅 Completed pomodoros today:'}{' '}
                <span className="font-bold text-[var(--on-surface)]">{currentRecord.pomodorosCompleted || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STREAK CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--on-surface-var)]">
                {isRu ? 'Календарь стриков (последние 30 дней)' : 'Streak Grid (Last 30 Days)'}
              </h3>

              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (29 - i));
                  const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  const rec = records[k];
                  const isDone = rec && rec.completed;
                  const isCurrent = k === todayStr;

                  return (
                    <div
                      key={k}
                      title={`${k}: ${rec?.goal || 'No goal'} (${isDone ? 'Completed' : 'Missed'})`}
                      className={`h-12 rounded-2xl flex flex-col items-center justify-center border transition-all text-[11px] font-bold ${
                        isDone
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                          : rec?.goal
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                          : 'bg-[var(--surface-dim)] border-[var(--outline-var)] text-[var(--on-surface-var)]'
                      } ${isCurrent ? 'ring-2 ring-offset-2 ring-[var(--accent)]' : ''}`}
                    >
                      <span>{d.getDate()}</span>
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" /> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STATS & DATA EXPORT */}
        {activeTab === 'stats' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] text-center space-y-1">
                <Flame className="w-5 h-5 mx-auto text-amber-500" />
                <div className="text-2xl font-black">{stats.currentStreak}</div>
                <div className="text-[11px] text-[var(--on-surface-var)] font-semibold">{isRu ? 'Текущий стрик' : 'Current Streak'}</div>
              </div>
              <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] text-center space-y-1">
                <Trophy className="w-5 h-5 mx-auto text-yellow-500" />
                <div className="text-2xl font-black">{stats.longestStreak}</div>
                <div className="text-[11px] text-[var(--on-surface-var)] font-semibold">{isRu ? 'Рекорд стрика' : 'Best Streak'}</div>
              </div>
              <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] text-center space-y-1">
                <Award className="w-5 h-5 mx-auto text-emerald-500" />
                <div className="text-2xl font-black">{stats.totalCompleted}</div>
                <div className="text-[11px] text-[var(--on-surface-var)] font-semibold">{isRu ? 'Дней побед' : 'Days Done'}</div>
              </div>
              <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] text-center space-y-1">
                <TrendingUp className="w-5 h-5 mx-auto text-blue-500" />
                <div className="text-2xl font-black">{stats.completionRate}%</div>
                <div className="text-[11px] text-[var(--on-surface-var)] font-semibold">{isRu ? 'Успешность' : 'Rate'}</div>
              </div>
            </div>

            {/* Export / Backup Card */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--outline-var)] shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--on-surface-var)]">
                {isRu ? 'Экспорт и резервное копирование' : 'Data Management & Export'}
              </h3>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-xs font-bold hover:bg-[var(--surface-dim)]/80 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isRu ? 'Скачать CSV' : 'Export CSV'}</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-xs font-bold hover:bg-[var(--surface-dim)]/80 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isRu ? 'Скачать JSON' : 'Export JSON'}</span>
                </button>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-xs font-bold hover:bg-[var(--surface-dim)]/80 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{isRu ? 'Импортировать JSON' : 'Import JSON'}</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
