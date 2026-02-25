"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { IconLightbulb, IconTrendUp, IconTrendDown, IconMinus, IconGym, IconBook, IconHome, IconPlane, IconChat, IconSos, IconTrophy, IconAlert } from "@/components/Icons";

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₸";
}

export default function ProgressPage() {
  const [aiData, setAiData] = useState<Record<string, unknown> | null>(null);
  const [achievements, setAchievements] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/ai/analyze").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/achievements").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([ai, ach]) => {
        setAiData(ai);
        setAchievements(ach);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-slate-500">Анализируем ваши данные...</p>
      </div>
    );
  }

  const modules = aiData?.modules as Record<string, unknown> | undefined;
  const combined = aiData?.combinedRisk as { allWarnings?: string[] } | undefined;
  const nn = modules?.neuralNetwork as {
    prediction?: {
      riskScore?: number;
      riskLevel?: string;
      daysUntilRelapse?: number;
      relapseProbability?: number;
      confidence?: number;
      featureImportance?: Array<{ feature: string; impact: string }>;
    };
    inputFeatures?: { streakDays?: number };
  } | undefined;
  const dna = modules?.behavioralDNA as { label?: string; insight?: string } | undefined;
  const sent = modules?.sentimentAnalysis as { trend?: { trend?: string; entryCount?: number } } | undefined;

  const riskScore = nn?.prediction?.riskScore ?? 0;
  const riskLevel = nn?.prediction?.riskLevel ?? "LOW";
  const daysUntil = nn?.prediction?.daysUntilRelapse ?? 30;
  const relapseProb = (nn?.prediction?.relapseProbability ?? 0) * 100;
  const featureImportance = nn?.prediction?.featureImportance ?? [];
  const allWarnings = combined?.allWarnings ?? [];
  const highImpactFeatures = featureImportance.filter((f) => f.impact === "high");
  const streakDays = (nn?.inputFeatures?.streakDays ?? achievements?.streakDays ?? 0) as number;
  const totalSaved = (achievements?.totalSaved ?? 0) as number;
  const totalLost = (achievements?.totalLost ?? 0) as number;

  const riskColor = riskLevel === "HIGH" ? "text-red-400" : riskLevel === "MEDIUM" ? "text-amber-400" : "text-emerald-400";
  const riskBg = riskLevel === "HIGH" ? "bg-red-500/10 border-red-500/20" : riskLevel === "MEDIUM" ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20";
  const riskLabel = riskLevel === "HIGH" ? "Высокий" : riskLevel === "MEDIUM" ? "Умеренный" : "Низкий";

  return (
    <div className="space-y-5 sm:space-y-6 pb-8 w-full max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Мой прогресс</h1>
        <p className="text-slate-400 mt-1">Как у вас дела и что делать дальше</p>
      </div>

      {/* Главная карточка: риск */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`${riskBg} border`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Уровень риска</p>
              <p className={`text-4xl font-bold ${riskColor}`}>{riskScore}</p>
              <p className="text-sm text-slate-300 mt-1">{riskLabel}</p>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-current flex items-center justify-center" style={{ borderColor: riskLevel === "HIGH" ? "#ef4444" : riskLevel === "MEDIUM" ? "#f59e0b" : "#22c55e" }}>
              <span className={`text-2xl font-bold ${riskColor}`}>{riskScore}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <p className="text-sm text-slate-300">
              <span className="text-slate-400">Через сколько дней возможный срыв:</span>{" "}
              <span className={`font-semibold ${daysUntil <= 14 ? "text-amber-400" : "text-white"}`}>
                {daysUntil <= 0 ? "уже в зоне риска" : daysUntil === 1 ? "1 день" : daysUntil < 5 ? `${daysUntil} дня` : `${daysUntil} дней`}
              </span>
            </p>
            {relapseProb > 0 && (
              <p className="text-sm text-slate-300">
                <span className="text-slate-400">Вероятность срыва:</span>{" "}
                <span className={relapseProb >= 50 ? "text-red-400 font-semibold" : relapseProb >= 25 ? "text-amber-400" : "text-white"}>
                  {Math.round(relapseProb)}%
                </span>
              </p>
            )}
          </div>
          {daysUntil <= 14 && riskScore > 30 && (
            <p className="flex items-start gap-2 text-sm text-slate-300 mt-4 p-3 rounded-lg bg-black/20">
              <IconLightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <span>Рекомендуем связаться с доверенным лицом или поговорить в чате поддержки.</span>
            </p>
          )}
        </Card>
      </motion.div>

      {/* Серия и сбережения */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 gap-3 sm:gap-4"
      >
        <Card className="text-center">
          <p className="text-3xl font-bold text-accent">{streakDays}</p>
          <p className="text-sm text-slate-400 mt-1">
            {streakDays === 1 ? "день" : streakDays < 5 ? "дня" : "дней"} без игры
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-emerald-400">{formatMoney(totalSaved)}</p>
          <p className="text-sm text-slate-400 mt-1">сэкономлено</p>
        </Card>
      </motion.div>

      {/* Ваш профиль (архетип) */}
      {dna?.label && dna?.insight && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <p className="text-sm text-slate-400 mb-1">Ваш профиль</p>
            <p className="text-lg font-semibold text-white">{dna.label}</p>
            <p className="text-slate-300 mt-2 text-sm leading-relaxed">&quot;{dna.insight}&quot;</p>
          </Card>
        </motion.div>
      )}

      {/* Настроение из дневника */}
      {sent?.trend?.entryCount && sent.trend.entryCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card>
            <p className="text-sm text-slate-400 mb-1">Настроение по дневнику</p>
            <p className="flex items-center gap-2 text-white">
              {sent.trend.trend === "improving" && <><IconTrendUp className="w-5 h-5 text-emerald-400" /> Становится лучше</>}
              {sent.trend.trend === "declining" && <><IconTrendDown className="w-5 h-5 text-amber-400" /> Есть тревожные сигналы</>}
              {sent.trend.trend !== "improving" && sent.trend.trend !== "declining" && <><IconMinus className="w-5 h-5 text-slate-400" /> Стабильно</>}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Ключевые факторы риска */}
      {highImpactFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
        >
          <Card>
            <p className="text-sm text-slate-400 mb-2">Что влияет на риск</p>
            <ul className="space-y-1.5">
              {highImpactFeatures.map((f) => (
                <li key={f.feature} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {f.feature}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}

      {/* Предупреждения */}
      {allWarnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.27 }}
        >
          <Card className="border-amber-500/20 bg-amber-500/5">
            <p className="flex items-center gap-2 text-sm text-amber-400 font-medium mb-2">
              <IconAlert className="w-5 h-5 shrink-0" /> Обратите внимание
            </p>
            <ul className="space-y-1.5">
              {allWarnings.slice(0, 5).map((w, i) => (
                <li key={i} className="text-sm text-slate-300">
                  {w}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}

      {/* Потери — что можно было купить */}
      {totalLost > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <p className="text-sm text-slate-400 mb-2">На эти деньги можно было</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300 text-sm">
              {totalLost >= 45000 && <span className="inline-flex items-center gap-1.5"><IconGym className="w-4 h-4 text-slate-400" />3 месяца спортзала</span>}
              {totalLost >= 75000 && <span className="inline-flex items-center gap-1.5"><IconBook className="w-4 h-4 text-slate-400" />100 книг</span>}
              {totalLost >= 150000 && <span className="inline-flex items-center gap-1.5"><IconHome className="w-4 h-4 text-slate-400" />2 месяца аренды</span>}
              {totalLost >= 500000 && <span className="inline-flex items-center gap-1.5"><IconPlane className="w-4 h-4 text-slate-400" />Отпуск на море</span>}
              {totalLost < 45000 && <span>Продолжайте вести дневник — данные появятся</span>}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Действия */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="flex flex-wrap gap-2 sm:gap-3"
      >
        <Link href="/help">
          <Button variant="secondary" className="inline-flex items-center gap-2">
            <IconChat className="w-4 h-4" /> Поговорить с поддержкой
          </Button>
        </Link>
        <Link href="/sos">
          <Button variant="ghost" className="text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 inline-flex items-center gap-2">
            <IconSos className="w-4 h-4" /> Мне тяжело
          </Button>
        </Link>
        <Link href="/achievements">
          <Button variant="ghost" className="inline-flex items-center gap-2">
            <IconTrophy className="w-4 h-4" /> Достижения
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
