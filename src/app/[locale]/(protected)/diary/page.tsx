"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function useDiaryLabels() {
  const t = useTranslations("diary");
  return {
    MOODS: [
      { value: "terrible", label: t("moodTerrible") },
      { value: "bad", label: t("moodBad") },
      { value: "neutral", label: t("moodNeutral") },
      { value: "good", label: t("moodGood") },
      { value: "great", label: t("moodGreat") },
    ],
    PLATFORMS: [
      { value: "casino", label: t("platformCasino") },
      { value: "bookmaker", label: t("platformBookmaker") },
      { value: "poker", label: t("platformPoker") },
      { value: "slots", label: t("platformSlots") },
      { value: "other", label: t("platformOther") },
    ],
    TRIGGERS: [
      { value: "stress", label: t("triggerStress") },
      { value: "boredom", label: t("triggerBoredom") },
      { value: "loneliness", label: t("triggerLoneliness") },
      { value: "alcohol", label: t("triggerAlcohol") },
      { value: "ads", label: t("triggerAds") },
      { value: "other", label: t("triggerOther") },
    ],
  };
}

function MoodIcon({ value, className = "w-5 h-5", label }: { value: string; className?: string; label?: string }) {
  const paths: Record<string, React.ReactNode> = {
    terrible: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />,
    bad: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />,
    neutral: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zM9 15h6" />,
    good: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />,
    great: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />,
  };
  const color = value === "terrible" || value === "bad" ? "text-red-400" : value === "good" || value === "great" ? "text-green-400" : "text-slate-400";
  return (
    <span className={`inline-flex shrink-0 ${color}`} title={label}>
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{paths[value] || paths.neutral}</svg>
    </span>
  );
}

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
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₸";
}

// ── Page ──

export default function DiaryPage() {
  const t = useTranslations("diary");
  const tCommon = useTranslations("common");
  const { MOODS, PLATFORMS, TRIGGERS } = useDiaryLabels();
  const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(PLATFORMS.map((p) => [p.value, p.label]));
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
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-slate-400 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? tCommon("cancel") : t("newEntry")}
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
            <NewEntryForm onSuccess={handleNewEntry} MOODS={MOODS} PLATFORMS={PLATFORMS} TRIGGERS={TRIGGERS} t={t} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t("filterType")}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-dark-lighter border border-dark-border rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">{t("all")}</option>
              <option value="episode">{t("filterEpisodes")}</option>
              <option value="positive">{t("filterPositive")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t("filterDateFrom")}</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="px-3 py-2 bg-dark-lighter border border-dark-border rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t("filterDateTo")}</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="px-3 py-2 bg-dark-lighter border border-dark-border rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
            <Button variant="secondary" size="sm" onClick={handleFilterApply}>
            {t("apply")}
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
              {t("reset")}
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
          <div className="flex justify-center mb-3">
            <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-slate-400 mb-1">{t("noEntriesFound")}</p>
          <p className="text-sm text-slate-500">
            {t("createFirstToStart")}
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
              <EntryCard entry={entry} MOODS={MOODS} TRIGGERS={TRIGGERS} PLATFORM_LABEL={PLATFORM_LABEL} t={t} />
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
            &larr; {tCommon("back")}
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
            {tCommon("next")} &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}

// ── New Entry Form ──

interface NewEntryFormProps {
  onSuccess: () => void;
  MOODS: { value: string; label: string }[];
  PLATFORMS: { value: string; label: string }[];
  TRIGGERS: { value: string; label: string }[];
  t: (k: string) => string;
}

function NewEntryForm({ onSuccess, MOODS, PLATFORMS, TRIGGERS, t }: NewEntryFormProps) {
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
      setError(t("selectMoodBefore"));
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
        setError(data.error || t("saveError"));
        return;
      }

      onSuccess();
    } catch {
      setError(t("connectionError"));
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
            {t("entryType")}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("episode")}
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all inline-flex items-center justify-center gap-2 ${
                type === "episode"
                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                  : "border-dark-border text-slate-400 hover:border-slate-600"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t("episodeEntry")}
            </button>
            <button
              type="button"
              onClick={() => setType("positive")}
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all inline-flex items-center justify-center gap-2 ${
                type === "positive"
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-dark-border text-slate-400 hover:border-slate-600"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              {t("positiveDay")}
            </button>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {t("dateTime")}
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
                    {t("durationMin")}
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
                    {t("amountSpent")}
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
                  {t("platform")}
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
                  {t("triggersSeveral")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRIGGERS.map((tr) => (
                    <button
                      key={tr.value}
                      type="button"
                      onClick={() => toggleTrigger(tr.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        triggers.includes(tr.value)
                          ? "border-orange-400/40 bg-orange-400/10 text-orange-400"
                          : "border-dark-border text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {tr.label}
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
            {type === "episode" ? t("moodBeforeGame") : t("moodBeforeNow")}
          </label>
          <MoodPicker value={moodBefore} onChange={setMoodBefore} MOODS={MOODS} />
        </div>

        {/* Mood after (only for episodes) */}
        {type === "episode" && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t("moodAfterGame")}
            </label>
            <MoodPicker value={moodAfter} onChange={setMoodAfter} MOODS={MOODS} />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {t("whatHappened")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2.5 bg-dark-lighter border border-dark-border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none transition-colors"
            placeholder={t("describePlaceholder")}
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
          {t("saveEntry")}
        </Button>
      </form>
    </Card>
  );
}

// ── Mood Picker ──

function MoodPicker({
  value,
  onChange,
  MOODS,
}: {
  value: string;
  onChange: (v: string) => void;
  MOODS: { value: string; label: string }[];
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
          <span className="text-2xl"><MoodIcon value={m.value} className="w-8 h-8" label={m.label} /></span>
          <span className="text-xs text-slate-400">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Entry Card ──

interface EntryCardProps {
  entry: DiaryEntry;
  MOODS: { value: string; label: string }[];
  TRIGGERS: { value: string; label: string }[];
  PLATFORM_LABEL: Record<string, string>;
  t: (k: string) => string;
}

function EntryCard({ entry, MOODS, TRIGGERS, PLATFORM_LABEL, t }: EntryCardProps) {
  const isEpisode = entry.type === "episode";

  return (
    <Card>
      <div className="flex items-start gap-4">
        {/* Type badge */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isEpisode ? "bg-red-500/10 text-red-400" : "bg-accent/10 text-accent"
          }`}
        >
          {isEpisode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-sm font-medium ${
                isEpisode ? "text-red-400" : "text-accent"
              }`}
            >
              {isEpisode ? t("episodeEntry") : t("positiveDay")}
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
                  {entry.duration} {t("minutes")}
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
            <div className="flex items-center gap-2 mb-2">
              <MoodIcon value={entry.mood_before} className="w-6 h-6" label={MOODS.find((m) => m.value === entry.mood_before)?.label} />
              {isEpisode && entry.mood_after && (
                <>
                  <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  <MoodIcon value={entry.mood_after} className="w-6 h-6" label={MOODS.find((m) => m.value === entry.mood_after)?.label} />
                </>
              )}
            </div>
          )}

          {/* Triggers */}
          {entry.triggers && entry.triggers.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {entry.triggers.map((tr) => (
                <span
                  key={tr}
                  className="text-xs px-2 py-0.5 rounded bg-dark-lighter text-slate-400 border border-dark-border"
                >
                  {TRIGGERS.find((x) => x.value === tr)?.label || tr}
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
