"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

interface AchievementsData {
  streakDays: number;
  longestStreak: number;
  totalSaved: number;
  achievements: Achievement[];
  earnedCount: number;
  totalCount: number;
  level: number;
  levelName: string;
  nextLevel: { name: string; requires: number } | null;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(amount) + " ₸";
}

function pluralizeDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня";
  return "дней";
}

function AchievementIcon({ icon, earned, size = "md" }: { icon: string; earned: boolean; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  const iconSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";

  const emojiToKey: Record<string, string> = {
    "⭐": "star", "🌟": "star", "🛡️": "shield", "🔥": "fire", "🏆": "trophy", "❤️": "heart",
    "📖": "book", "📚": "book", "📝": "book", "💬": "chat", "⚡": "bolt", "🕐": "clock",
    "⏳": "clock", "💡": "light", "🚀": "rocket", "💰": "default", "💵": "default", "🎯": "trophy",
    "💎": "default", "🌈": "default", "👑": "default", "🏅": "trophy", "🦾": "default",
    "🌙": "default", "📊": "default", "🤖": "chat", "🧩": "default", "🔒": "default",
    "🏰": "default", "🤝": "default", "🔍": "default", "🤑": "default", "🎖️": "trophy",
    "👤": "default", "🌱": "default", "💪": "shield",
  };
  const svgKey = emojiToKey[icon] || "default";

  const iconMap: Record<string, React.ReactNode> = {
    "star": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
    "shield": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
    "fire": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />,
    "trophy": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.997 6.997 0 01-5.27 2.522 6.997 6.997 0 01-5.27-2.522" />,
    "heart": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
    "book": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
    "chat": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />,
    "bolt": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
    "clock": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    "light": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />,
    "rocket": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a48.475 48.475 0 00-6.58 0c-1.007.066-1.878.548-2.482 1.215-.33.365-.548.795-.668 1.257-.12.46-.12.943 0 1.404.12.46.338.891.668 1.256.604.668 1.475 1.15 2.482 1.215a48.422 48.422 0 006.58 0c1.007-.065 1.878-.547 2.482-1.215.33-.365.548-.795.668-1.256.12-.461.12-.944 0-1.404-.12-.462-.338-.892-.668-1.257-.604-.667-1.475-1.149-2.482-1.215zM15.995 3.107a48.004 48.004 0 00-7.99 0C6.608 3.227 5.65 4.168 5.34 5.306l-.265.987a5.004 5.004 0 00-.1 1.97l.202 1.213a3 3 0 002.347 2.44l.92.184a47.963 47.963 0 007.112 0l.92-.184a3 3 0 002.347-2.44l.202-1.213a5.004 5.004 0 00-.1-1.97l-.265-.987C18.35 4.168 17.392 3.227 15.995 3.107z" />,
    "default": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />,
  };

  return (
    <div className={`${sizeClass} rounded-xl flex items-center justify-center shrink-0 transition-all ${
      earned
        ? "bg-gradient-to-br from-accent/15 to-cyan-500/15 border border-accent/20 shadow-sm shadow-accent/5"
        : "bg-dark-lighter border border-dark-border"
    }`}>
      <svg className={`${iconSize} ${earned ? "text-accent" : "text-slate-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {iconMap[svgKey]}
      </svg>
    </div>
  );
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
          <div className="absolute inset-3 rounded-full border-2 border-accent/40 animate-pulse" />
          <div className="absolute inset-5 rounded-full bg-accent/10 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-400 text-center py-16">Ошибка загрузки данных</p>;
  }

  const safeData = {
    streakDays: data.streakDays ?? 0,
    longestStreak: data.longestStreak ?? 0,
    totalSaved: data.totalSaved ?? 0,
    earnedCount: data.earnedCount ?? 0,
    totalCount: data.totalCount ?? 0,
    level: data.level ?? 0,
    levelName: data.levelName ?? "Новичок",
    nextLevel: data.nextLevel ?? null,
    achievements: data.achievements ?? [],
  };

  const thresholds = [0, 4, 9, 15, 22, 28];
  const base = safeData.level < thresholds.length ? thresholds[safeData.level] : 0;
  const nextReq = safeData.nextLevel?.requires ?? safeData.earnedCount;
  const range = nextReq - base;
  const progressPercent = range > 0
    ? Math.min(((safeData.earnedCount - base) / range) * 100, 100)
    : 100;

  const earned = safeData.achievements.filter((a) => a.earned);
  const locked = safeData.achievements.filter((a) => !a.earned);

  return (
    <motion.div className="space-y-6 pb-8" initial="hidden" animate="visible" variants={stagger}>

      {/* Hero Section */}
      <motion.div variants={fadeUp}>
        <Card className="relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-accent/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Streak counter */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-4 mb-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/15 to-red-500/15 border border-orange-500/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  </svg>
                </div>
                <span className="text-5xl sm:text-6xl font-bold text-white tabular-nums">
                  {safeData.streakDays}
                </span>
              </motion.div>
              <p className="text-lg text-slate-300">
                {pluralizeDays(safeData.streakDays)} без игры
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Лучшая серия: {safeData.longestStreak} {pluralizeDays(safeData.longestStreak)}
              </p>
            </div>

            {/* Level + progress */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                Ур. {safeData.level} — {safeData.levelName}
              </span>
              {safeData.nextLevel && (
                <span className="text-xs text-slate-500">
                  След: {safeData.nextLevel.name} ({safeData.nextLevel.requires} ачивок)
                </span>
              )}
            </div>

            <div className="h-2.5 bg-dark-lighter rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-dark-lighter/50 rounded-xl py-3">
                <div className="text-xl font-bold text-white">{safeData.earnedCount}</div>
                <div className="text-[10px] text-slate-500">из {safeData.totalCount} ачивок</div>
              </div>
              <div className="bg-dark-lighter/50 rounded-xl py-3">
                <div className="text-xl font-bold text-accent">{formatMoney(safeData.totalSaved)}</div>
                <div className="text-[10px] text-slate-500">сэкономлено</div>
              </div>
              <div className="bg-dark-lighter/50 rounded-xl py-3">
                <div className="text-xl font-bold text-white">{safeData.longestStreak}</div>
                <div className="text-[10px] text-slate-500">рекорд {pluralizeDays(safeData.longestStreak)}</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Earned Achievements */}
      {earned.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Полученные ({earned.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {earned.map((achievement, i) => (
              <motion.div key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
              >
                <Card className="h-full border-accent/20 hover:border-accent/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5">
                  <div className="flex items-start gap-3">
                    <AchievementIcon icon={achievement.icon} earned={true} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-0.5">{achievement.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{achievement.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Locked Achievements */}
      {locked.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Заблокированные ({locked.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((achievement, i) => (
              <motion.div key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 0.5, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.03 }}
              >
                <Card className="h-full">
                  <div className="flex items-start gap-3">
                    <AchievementIcon icon={achievement.icon} earned={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-semibold text-slate-500">{achievement.title}</h3>
                        <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{achievement.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div variants={fadeUp}>
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Сводка</h2>
          <div className="space-y-0">
            <StatRow label="Текущая серия" value={`${safeData.streakDays} ${pluralizeDays(safeData.streakDays)}`} />
            <StatRow label="Лучшая серия" value={`${safeData.longestStreak} ${pluralizeDays(safeData.longestStreak)}`} />
            <StatRow label="Сэкономлено" value={formatMoney(safeData.totalSaved)} accent />
            <StatRow label="Достижения" value={`${safeData.earnedCount} / ${safeData.totalCount}`} />
            <StatRow label="Уровень" value={`${safeData.levelName} (ур. ${safeData.level})`} />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-dark-border last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-accent" : "text-white"}`}>{value}</span>
    </div>
  );
}
