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
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-slate-400 text-center py-16">
        Ошибка загрузки данных
      </p>
    );
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
    <div className="space-y-6 pb-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Streak counter */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-3 mb-2"
              >
                <span className="text-4xl">🔥</span>
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                  Ур. {safeData.level} — {safeData.levelName}
                </span>
              </div>
              {safeData.nextLevel && (
                <span className="text-xs text-slate-500">
                  След: {safeData.nextLevel.name} ({safeData.nextLevel.requires} ачивок)
                </span>
              )}
            </div>

            <div className="h-2.5 bg-dark-lighter rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-300"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-white">{safeData.earnedCount}</div>
                <div className="text-xs text-slate-500">из {safeData.totalCount} ачивок</div>
              </div>
              <div>
                <div className="text-xl font-bold text-accent">
                  {formatMoney(safeData.totalSaved)}
                </div>
                <div className="text-xs text-slate-500">сэкономлено</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{safeData.longestStreak}</div>
                <div className="text-xs text-slate-500">рекорд {pluralizeDays(safeData.longestStreak)}</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Achievements Grid — Earned */}
      {earned.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Полученные ({earned.length})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {earned.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Card className="h-full border-accent/30 hover:border-accent/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl mb-2">{achievement.icon}</div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {achievement.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Grid — Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Заблокированные ({locked.length})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.4, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.04 }}
              >
                <Card className="h-full relative">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl mb-2 grayscale">
                      {achievement.icon}
                    </div>
                    <div className="absolute top-2 right-2 text-slate-600 text-xs">
                      🔒
                    </div>
                    <h3 className="text-sm font-semibold text-slate-500 mb-1">
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {achievement.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Сводка</h2>
          <div className="space-y-3">
            <StatRow label="Текущая серия" value={`${safeData.streakDays} ${pluralizeDays(safeData.streakDays)}`} />
            <StatRow label="Лучшая серия" value={`${safeData.longestStreak} ${pluralizeDays(safeData.longestStreak)}`} />
            <StatRow label="Сэкономлено" value={formatMoney(safeData.totalSaved)} accent />
            <StatRow label="Достижения" value={`${safeData.earnedCount} / ${safeData.totalCount}`} />
            <StatRow label="Уровень" value={`${safeData.levelName} (ур. ${safeData.level})`} />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-accent" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
