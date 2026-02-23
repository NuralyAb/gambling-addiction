"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// ── Constants ──

const MOODS = [
  { value: "terrible", emoji: "\u{1F622}", label: "Ужасно" },
  { value: "bad", emoji: "\u{1F614}", label: "Плохо" },
  { value: "neutral", emoji: "\u{1F610}", label: "Нормально" },
  { value: "good", emoji: "\u{1F642}", label: "Хорошо" },
  { value: "great", emoji: "\u{1F60A}", label: "Отлично" },
];

const PLATFORMS = [
  { value: "casino", label: "Онлайн-казино" },
  { value: "bookmaker", label: "Букмекер" },
  { value: "poker", label: "Покер" },
  { value: "slots", label: "Игровые автоматы" },
  { value: "other", label: "Другое" },
];

const TRIGGERS = [
  { value: "stress", label: "Стресс" },
  { value: "boredom", label: "Скука" },
  { value: "loneliness", label: "Одиночество" },
  { value: "alcohol", label: "Алкоголь" },
  { value: "ads", label: "Реклама" },
  { value: "other", label: "Другое" },
];

const MOOD_EMOJI: Record<string, string> = Object.fromEntries(
  MOODS.map((m) => [m.value, m.emoji])
);

const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.value, p.label])
);

// ── Types ──

interface DiaryEntry {
  id: string;
  type: "episode" | "positive";
  date: string;
  duration: number | null;
  amount: number;
  platform: string | null;
  mood_before: string | null;
  mood_after: string | null;
  triggers: string[];
  notes: string | null;
  created_at: string;
}

// ── Helpers ──

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Page ──

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filterType, setFilterType] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const loadEntries = useCallback(
    (p = page) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(p), limit: "10" });
      if (filterType) params.set("type", filterType);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

      fetch(`/api/diary?${params}`)
        .then((r) => r.json())
        .then((data) => {
          setEntries(data.entries || []);
          setTotalPages(data.totalPages || 1);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [page, filterType, filterDateFrom, filterDateTo]
  );

  useEffect(() => {
    loadEntries(page);
  }, [page, loadEntries]);

  const handleFilterApply = () => {
    setPage(1);
    loadEntries(1);
  };

  const handleNewEntry = () => {
    setShowForm(false);
    setPage(1);
    loadEntries(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Дневник</h1>
          <p className="text-slate-400 mt-1">
            Отслеживайте поведение и прогресс
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Отмена" : "Новая запись"}
        </Button>
      </div>

      {/* New entry form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <NewEntryForm onSuccess={handleNewEntry} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Тип</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-dark-lighter border border-dark-border rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Все</option>
              <option value="episode">Игровые эпизоды</option>
              <option value="positive">Позитивные дни</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">С</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="px-3 py-2 bg-dark-lighter border border-dark-border rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">По</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="px-3 py-2 bg-dark-lighter border border-dark-border rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleFilterApply}>
            Применить
          </Button>
          {(filterType || filterDateFrom || filterDateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterType("");
                setFilterDateFrom("");
                setFilterDateTo("");
                setPage(1);
                setTimeout(() => loadEntries(1), 0);
              }}
            >
              Сбросить
            </Button>
          )}
        </div>
      </Card>

      {/* Entries list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">{"\u{1F4D3}"}</p>
          <p className="text-slate-400 mb-1">Записей не найдено</p>
          <p className="text-sm text-slate-500">
            Создайте первую запись, чтобы начать отслеживание
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <EntryCard entry={entry} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            &larr; Назад
          </Button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}

// ── New Entry Form ──

function NewEntryForm({ onSuccess }: { onSuccess: () => void }) {
  const [type, setType] = useState<"episode" | "positive">("episode");
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState("");
  const [amount, setAmount] = useState("");
  const [platform, setPlatform] = useState("");
  const [moodBefore, setMoodBefore] = useState("");
  const [moodAfter, setMoodAfter] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleTrigger = (t: string) => {
    setTriggers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!moodBefore) {
      setError("Выберите настроение ДО");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        type,
        date: new Date(date).toISOString(),
        mood_before: moodBefore,
        mood_after: moodAfter || moodBefore,
        triggers,
        notes: notes || undefined,
      };

      if (type === "episode") {
        body.duration = duration ? parseInt(duration) : undefined;
        body.amount = amount ? parseFloat(amount) : 0;
        body.platform = platform || undefined;
      }

      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка сохранения");
        return;
      }

      onSuccess();
    } catch {
      setError("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Тип записи
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("episode")}
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                type === "episode"
                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                  : "border-dark-border text-slate-400 hover:border-slate-600"
              }`}
            >
              {"\u{1F3B0}"} Игровой эпизод
            </button>
            <button
              type="button"
              onClick={() => setType("positive")}
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                type === "positive"
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-dark-border text-slate-400 hover:border-slate-600"
              }`}
            >
              {"\u{2728}"} Позитивный день
            </button>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Дата и время
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-dark-lighter border border-dark-border rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
          />
        </div>

        {/* Episode-specific fields */}
        <AnimatePresence>
          {type === "episode" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Длительность (мин)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    placeholder="0"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-lighter border border-dark-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Сумма потрачена
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-lighter border border-dark-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
                  />
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Платформа
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlatform(p.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        platform === p.value
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-dark-border text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Triggers */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Триггеры (можно несколько)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRIGGERS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleTrigger(t.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        triggers.includes(t.value)
                          ? "border-orange-400/40 bg-orange-400/10 text-orange-400"
                          : "border-dark-border text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mood before */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Настроение {type === "episode" ? "ДО игры" : "сейчас"}
          </label>
          <MoodPicker value={moodBefore} onChange={setMoodBefore} />
        </div>

        {/* Mood after (only for episodes) */}
        {type === "episode" && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Настроение ПОСЛЕ игры
            </label>
            <MoodPicker value={moodAfter} onChange={setMoodAfter} />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Что происходило?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2.5 bg-dark-lighter border border-dark-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none transition-colors"
            placeholder="Опишите ситуацию, мысли, чувства..."
          />
          <p className="text-xs text-slate-500 mt-1 text-right">
            {notes.length}/500
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" loading={saving}>
          Сохранить запись
        </Button>
      </form>
    </Card>
  );
}

// ── Mood Picker ──

function MoodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all ${
            value === m.value
              ? "border-accent bg-accent/10 scale-110"
              : "border-dark-border hover:border-slate-600"
          }`}
        >
          <span className="text-2xl">{m.emoji}</span>
          <span className="text-xs text-slate-400">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Entry Card ──

function EntryCard({ entry }: { entry: DiaryEntry }) {
  const isEpisode = entry.type === "episode";

  return (
    <Card>
      <div className="flex items-start gap-4">
        {/* Type badge */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
            isEpisode ? "bg-red-500/10" : "bg-accent/10"
          }`}
        >
          {isEpisode ? "\u{1F3B0}" : "\u{2728}"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-sm font-medium ${
                isEpisode ? "text-red-400" : "text-accent"
              }`}
            >
              {isEpisode ? "Игровой эпизод" : "Позитивный день"}
            </span>
            <span className="text-xs text-slate-500">
              {formatDate(entry.date)}
            </span>
          </div>

          {/* Episode details */}
          {isEpisode && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2">
              {entry.amount > 0 && (
                <span className="text-red-400 font-medium">
                  {formatMoney(entry.amount)}
                </span>
              )}
              {entry.duration && (
                <span className="text-slate-400">
                  {entry.duration} мин
                </span>
              )}
              {entry.platform && (
                <span className="text-slate-500">
                  {PLATFORM_LABEL[entry.platform] || entry.platform}
                </span>
              )}
            </div>
          )}

          {/* Mood before → after */}
          {entry.mood_before && (
            <div className="flex items-center gap-1 text-lg mb-2">
              <span title="До">{MOOD_EMOJI[entry.mood_before]}</span>
              {isEpisode && entry.mood_after && (
                <>
                  <span className="text-slate-600 text-xs mx-1">&rarr;</span>
                  <span title="После">{MOOD_EMOJI[entry.mood_after]}</span>
                </>
              )}
            </div>
          )}

          {/* Triggers */}
          {entry.triggers && entry.triggers.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {entry.triggers.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded bg-dark-lighter text-slate-400 border border-dark-border"
                >
                  {TRIGGERS.find((tr) => tr.value === t)?.label || t}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <p className="text-sm text-slate-400 leading-relaxed">
              {entry.notes}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
