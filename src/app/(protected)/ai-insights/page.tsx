"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/components/ui/Card";

interface FeatureImportance {
  feature: string;
  normalizedValue: number;
  impact: "low" | "medium" | "high";
}

interface SentimentEntry {
  date: string;
  score: number;
  comparative: number;
  label: "positive" | "negative" | "neutral";
}

interface SpendingChartPoint {
  date: string;
  value: number;
  z: number;
  severity: "normal" | "warning" | "critical";
}

interface AnomalyItem {
  date: string;
  value: number;
  zScore: number;
  severity: "normal" | "warning" | "critical";
}

interface AIData {
  timestamp: string;
  modules: {
    neuralNetwork: {
      meta: {
        name: string;
        architecture: string;
        parameters: number;
        algorithm?: string;
        datasetSize?: number;
        regMAE?: number;
        regR2?: number;
      };
      prediction: {
        riskScore: number;
        riskProbability: number;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        confidence: number;
        daysUntilRelapse?: number;
        relapseProbability?: number;
        featureImportance: FeatureImportance[];
      };
      inputFeatures: {
        episodeFrequency: number;
        spendingTrend: number;
        moodScore: number;
        nightActivityRatio: number;
        triggerDiversity: number;
        streakDays: number;
      };
    };
    sentimentAnalysis: {
      meta: { name: string; lexicon: string };
      trend: {
        averageScore: number;
        trend: string;
        dominantMood: string;
        negativeStreak: number;
        warningSignals: string[];
        recentVsPrevious: number;
        entryCount: number;
      };
      entries: SentimentEntry[];
    };
    anomalyDetector: {
      meta: { name: string; method: string };
      summary: {
        totalAnomalies: number;
        criticalCount: number;
        warningCount: number;
        overallRisk: string;
        alerts: string[];
      };
      spending: {
        mean: number;
        stdDev: number;
        total: number;
        anomalies: AnomalyItem[];
        chart: SpendingChartPoint[];
      };
      episodes: { mean: number; stdDev: number; total: number; anomalies: AnomalyItem[] };
      timePatterns: { peakHour: number | null; nightRatio: number };
      blockAttempts: { mean: number; stdDev: number; total: number; anomalies: AnomalyItem[] };
    };
    behavioralDNA?: {
      archetype: string;
      label: string;
      description: string;
      insight: string;
      confidence: number;
    };
  };
  combinedRisk: {
    neuralScore: number;
    sentimentTrend: string;
    anomalyRisk: string;
    allWarnings: string[];
  };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₸";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/* ── Radial Gauge ── */
function RadialGauge({ value, max, color, size = 120, strokeWidth = 8 }: {
  value: number; max: number; color: string; size?: number; strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="currentColor" className="text-dark-lighter" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - pct) }}
        transition={{ duration: 1.4, ease: "easeOut" as const, delay: 0.3 }}
      />
    </svg>
  );
}

/* ── Pulse Dot ── */
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

/* ── Status Pill ── */
function StatusPill({ level, label }: { level: "low" | "medium" | "high"; label: string }) {
  const styles = {
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${styles[level]}`}>
      <PulseDot color={level === "low" ? "bg-emerald-400" : level === "medium" ? "bg-amber-400" : "bg-red-400"} />
      {label}
    </span>
  );
}

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeSlide = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } } };

export default function AIInsightsPage() {
  const [data, setData] = useState<AIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<number>(0);

  useEffect(() => {
    fetch("/api/ai/analyze")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-accent/40 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-accent/10 animate-pulse" />
        </div>
        <p className="text-sm text-slate-500 animate-pulse">AI-модули анализируют данные...</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-400 text-center py-16">Ошибка загрузки AI-анализа</p>;
  }

  const nn = data.modules.neuralNetwork;
  const sent = data.modules.sentimentAnalysis;
  const anom = data.modules.anomalyDetector;
  const dna = data.modules.behavioralDNA;
  const combined = data.combinedRisk;

  const riskColor = nn.prediction.riskLevel === "HIGH" ? "#ef4444" :
    nn.prediction.riskLevel === "MEDIUM" ? "#f59e0b" : "#22c55e";

  const riskLevelMap: Record<string, "low" | "medium" | "high"> = {
    LOW: "low", MEDIUM: "medium", HIGH: "high",
    low: "low", moderate: "medium", high: "high",
  };

  const modules = [
    { id: 0, label: "GBM-модель", sub: nn.meta.algorithm || nn.meta.architecture, color: "emerald" },
    { id: 1, label: "Поведенческий профиль", sub: dna?.label || "DNA", color: "purple" },
    { id: 2, label: "NLP-анализ", sub: "AFINN-165", color: "blue" },
    { id: 3, label: "Детектор аномалий", sub: "Z-Score", color: "amber" },
  ];

  return (
    <motion.div className="space-y-6 pb-8" initial="hidden" animate="visible" variants={stagger}>

      {/* ── Header ── */}
      <motion.div variants={fadeSlide} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/20 to-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">AI-анализ</h1>
          </div>
          <p className="text-slate-500 text-sm">Три независимых модуля, ноль внешних API</p>
        </div>
        <Link href="/about-ai"
          className="text-xs text-slate-400 hover:text-accent transition-colors border border-dark-border rounded-lg px-3 py-1.5 hover:border-accent/30">
          Как работают модели
        </Link>
      </motion.div>

      {/* ── Combined Summary ── */}
      <motion.div variants={fadeSlide}>
        <Card className="relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-accent/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
            {/* Neural gauge */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <RadialGauge value={nn.prediction.riskScore} max={100} color={riskColor} size={100} strokeWidth={6} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{nn.prediction.riskScore}</span>
                  <span className="text-[10px] text-slate-500">/100</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Риск рецидива</p>
              <StatusPill level={riskLevelMap[nn.prediction.riskLevel]} label={
                nn.prediction.riskLevel === "HIGH" ? "Высокий" :
                nn.prediction.riskLevel === "MEDIUM" ? "Умеренный" : "Низкий"
              } />
            </div>

            {/* Sentiment */}
            <div className="flex flex-col items-center">
              <div className="relative w-[100px] h-[100px] flex items-center justify-center">
                <motion.div
                  className={`w-16 h-16 rounded-2xl ${
                    sent.trend.trend === "improving" ? "bg-emerald-500/10 border-emerald-500/20" :
                    sent.trend.trend === "declining" ? "bg-red-500/10 border-red-500/20" :
                    "bg-slate-500/10 border-slate-500/20"
                  } border flex items-center justify-center`}
                  animate={{ rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
                >
                  <svg className={`w-7 h-7 ${
                    sent.trend.trend === "improving" ? "text-emerald-400" :
                    sent.trend.trend === "declining" ? "text-red-400" : "text-slate-400"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sent.trend.trend === "improving" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    ) : sent.trend.trend === "declining" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12h-15" />
                    )}
                  </svg>
                </motion.div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Эмоц. фон</p>
              <span className="text-xs text-slate-300 font-medium">
                {sent.trend.entryCount > 0 ? (
                  sent.trend.trend === "improving" ? "Улучшается" :
                  sent.trend.trend === "declining" ? "Ухудшается" : "Стабильный"
                ) : "Нет данных"}
              </span>
            </div>

            {/* Anomalies */}
            <div className="flex flex-col items-center">
              <div className="relative w-[100px] h-[100px] flex items-center justify-center">
                <motion.div
                  className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${
                    anom.summary.totalAnomalies > 0
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-emerald-500/10 border-emerald-500/20"
                  }`}
                  animate={anom.summary.criticalCount > 0 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className={`text-2xl font-bold ${
                    anom.summary.totalAnomalies > 0 ? "text-amber-400" : "text-emerald-400"
                  }`}>{anom.summary.totalAnomalies}</span>
                </motion.div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Аномалий</p>
              <StatusPill
                level={riskLevelMap[anom.summary.overallRisk] || "low"}
                label={anom.summary.overallRisk === "high" ? "Высокий" :
                       anom.summary.overallRisk === "moderate" ? "Средний" : "Норма"}
              />
            </div>
          </div>

          {/* Warnings */}
          {combined.allWarnings.length > 0 && (
            <div className="mt-6 pt-5 border-t border-dark-border space-y-2">
              {combined.allWarnings.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <p className="text-sm text-slate-300">{w}</p>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── Module Tabs ── */}
      <motion.div variants={fadeSlide}>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            const activeClasses = m.color === "emerald"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : m.color === "blue"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                : m.color === "purple"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30";
            const dotClasses = isActive
              ? m.color === "emerald"
                ? "bg-emerald-400"
                : m.color === "blue"
                  ? "bg-blue-400"
                  : m.color === "purple"
                    ? "bg-purple-400"
                    : "bg-amber-400"
              : "bg-slate-600";
            return (
              <button key={m.id} onClick={() => setActiveModule(m.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                  isActive ? activeClasses : "text-slate-400 hover:text-white bg-dark-lighter border-transparent hover:border-dark-border"
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${dotClasses}`} />
                <span>{m.label}</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{m.sub}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Module Content ── */}
      <AnimatePresence mode="wait">
        {activeModule === 0 && (
          <motion.div key="nn" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">GBM Relapse Predictor</h2>
                  <p className="text-xs text-slate-500">
                    {nn.meta.algorithm || nn.meta.architecture}
                    {nn.meta.regMAE ? ` · MAE ${nn.meta.regMAE}d · R² ${nn.meta.regR2}` : ` · ${nn.meta.parameters} параметров`}
                  </p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Обучена на данных
                </span>
              </div>

              {/* Days until relapse banner */}
              {nn.prediction.daysUntilRelapse !== undefined && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 ${
                  nn.prediction.daysUntilRelapse <= 10
                    ? "bg-red-500/5 border-red-500/20"
                    : nn.prediction.daysUntilRelapse <= 25
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-emerald-500/5 border-emerald-500/20"
                }`}>
                  <div className={`text-4xl font-bold tabular-nums ${
                    nn.prediction.daysUntilRelapse <= 10 ? "text-red-400" :
                    nn.prediction.daysUntilRelapse <= 25 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {nn.prediction.daysUntilRelapse}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">дней до предполагаемого срыва</p>
                    <p className="text-xs text-slate-500">
                      Предсказание GBM · Обучена на 2000 записях ·{" "}
                      {nn.prediction.relapseProbability !== undefined
                        ? `P(срыв скоро) = ${Math.round(nn.prediction.relapseProbability * 100)}%`
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: gauge + inputs */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <RadialGauge value={nn.prediction.riskScore} max={100} color={riskColor} size={160} strokeWidth={10} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-bold ${
                        nn.prediction.riskLevel === "HIGH" ? "text-red-400" :
                        nn.prediction.riskLevel === "MEDIUM" ? "text-amber-400" : "text-emerald-400"
                      }`}>{nn.prediction.riskScore}</span>
                      <span className="text-xs text-slate-500">из 100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <StatusPill level={riskLevelMap[nn.prediction.riskLevel]} label={
                      nn.prediction.riskLevel === "HIGH" ? "Высокий риск" :
                      nn.prediction.riskLevel === "MEDIUM" ? "Умеренный риск" : "Низкий риск"
                    } />
                    <span className="text-xs text-slate-500">
                      Уверенность {Math.round(nn.prediction.confidence * 100)}%
                    </span>
                  </div>

                  {/* Input features grid */}
                  <div className="w-full grid grid-cols-2 gap-3">
                    {[
                      { label: "Эпизодов / нед", value: String(nn.inputFeatures.episodeFrequency) },
                      { label: "Тренд расходов", value: `${nn.inputFeatures.spendingTrend.toFixed(1)}x` },
                      { label: "Настроение", value: `${nn.inputFeatures.moodScore.toFixed(1)} / 5` },
                      { label: "Ночная активность", value: `${Math.round(nn.inputFeatures.nightActivityRatio * 100)}%` },
                      { label: "Триггеров", value: String(nn.inputFeatures.triggerDiversity) },
                      { label: "Серия воздержания", value: `${nn.inputFeatures.streakDays} дн` },
                    ].map((item) => (
                      <div key={item.label} className="bg-dark-lighter rounded-lg px-3 py-2.5">
                        <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                        <p className="text-sm font-medium text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: feature importance */}
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-4">Вклад каждого фактора</p>
                  <div className="space-y-4">
                    {nn.prediction.featureImportance.map((f, i) => (
                      <motion.div key={f.feature}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-slate-300">{f.feature}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            f.impact === "high" ? "text-red-400 bg-red-500/10" :
                            f.impact === "medium" ? "text-amber-400 bg-amber-500/10" :
                            "text-emerald-400 bg-emerald-500/10"
                          }`}>
                            {f.impact === "high" ? "Высокий" : f.impact === "medium" ? "Средний" : "Низкий"}
                          </span>
                        </div>
                        <div className="h-2.5 bg-dark rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              f.impact === "high" ? "bg-gradient-to-r from-red-500/80 to-red-400" :
                              f.impact === "medium" ? "bg-gradient-to-r from-amber-500/80 to-amber-400" :
                              "bg-gradient-to-r from-emerald-500/80 to-emerald-400"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(f.normalizedValue * 100, 3)}%` }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: "easeOut" as const }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeModule === 1 && (
          <motion.div key="dna" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Поведенческий профиль (Behavioral DNA)</h2>
                  <p className="text-xs text-slate-500">Персонализированный архетип на основе паттернов</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {dna ? `${Math.round(dna.confidence * 100)}% уверенность` : "—"}
                </span>
              </div>

              <div className="space-y-6">
                {dna ? (
                  <>
                    <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                      <p className="text-sm text-slate-400 mb-1">Ваш архетип</p>
                      <p className="text-xl font-semibold text-white">{dna.label}</p>
                      <p className="text-sm text-slate-300 mt-2">{dna.description}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <p className="text-sm text-slate-400 mb-1">Инсайт для вас</p>
                      <p className="text-slate-200 font-medium">&quot;{dna.insight}&quot;</p>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <p>Недостаточно данных для определения профиля.</p>
                    <p className="text-sm mt-2">Добавьте эпизоды в дневник с настроением и триггерами.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {activeModule === 2 && (
          <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">NLP-анализ настроения</h2>
                  <p className="text-xs text-slate-500">{sent.meta.lexicon}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Независимая
                </span>
              </div>

              {sent.trend.entryCount === 0 ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-dark-lighter border border-dark-border flex items-center justify-center">
                    <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 font-medium mb-1">Нет записей для анализа</p>
                    <p className="text-sm text-slate-500 mb-4 max-w-xs">Добавьте запись в дневник с описанием, чтобы NLP-модуль проанализировал текст</p>
                    <Link href="/diary"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors border border-accent/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Добавить запись
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Записей", value: String(sent.trend.entryCount), color: "text-white" },
                      { label: "Средний score", value: `${sent.trend.averageScore > 0 ? "+" : ""}${sent.trend.averageScore}`,
                        color: sent.trend.averageScore > 0 ? "text-emerald-400" : sent.trend.averageScore < 0 ? "text-red-400" : "text-slate-300" },
                      { label: "Динамика",
                        value: sent.trend.trend === "improving" ? "Улучшается" : sent.trend.trend === "declining" ? "Ухудшается" : "Стабильно",
                        color: sent.trend.trend === "improving" ? "text-emerald-400" : sent.trend.trend === "declining" ? "text-red-400" : "text-slate-300" },
                      { label: "Доминанта",
                        value: sent.trend.dominantMood === "positive" ? "Позитив" : sent.trend.dominantMood === "negative" ? "Негатив" : "Нейтрал",
                        color: sent.trend.dominantMood === "positive" ? "text-emerald-400" : sent.trend.dominantMood === "negative" ? "text-red-400" : "text-slate-300" },
                    ].map((c) => (
                      <div key={c.label} className="bg-dark-lighter rounded-xl p-3.5 text-center">
                        <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{c.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sentiment timeline */}
                  <p className="text-sm font-medium text-slate-300 mb-3">Настроение по записям</p>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {sent.entries.map((entry, i) => {
                      const barColor = entry.label === "positive" ? "bg-emerald-500" : entry.label === "negative" ? "bg-red-500" : "bg-slate-500";
                      return (
                        <motion.div key={`${entry.date}-${i}`}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-3 bg-dark-lighter rounded-xl"
                        >
                          <div className={`w-2 h-8 rounded-full shrink-0 ${barColor}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-slate-500">{formatDate(entry.date)}</span>
                          </div>
                          <span className={`text-sm font-mono font-medium ${
                            entry.score > 0 ? "text-emerald-400" : entry.score < 0 ? "text-red-400" : "text-slate-400"
                          }`}>
                            {entry.score > 0 ? "+" : ""}{entry.score}
                          </span>
                          <div className="w-16 h-1.5 bg-dark rounded-full overflow-hidden shrink-0">
                            <div className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${Math.min(Math.abs(entry.comparative) * 200, 100)}%` }} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {sent.trend.warningSignals.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-dark-border space-y-2">
                      {sent.trend.warningSignals.map((w, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                          <p className="text-sm text-slate-300">{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          </motion.div>
        )}

        {activeModule === 3 && (
          <motion.div key="anom" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Детектор аномалий</h2>
                  <p className="text-xs text-slate-500">{anom.meta.method}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Независимая
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Аномалий", value: anom.summary.totalAnomalies,
                    color: anom.summary.totalAnomalies > 0 ? "text-amber-400" : "text-emerald-400" },
                  { label: "Критических", value: anom.summary.criticalCount, color: "text-red-400" },
                  { label: "Предупреждений", value: anom.summary.warningCount, color: "text-amber-400" },
                  { label: "Общий риск", value: anom.summary.overallRisk === "high" ? "Высок." :
                    anom.summary.overallRisk === "moderate" ? "Сред." : "Низк.",
                    color: anom.summary.overallRisk === "high" ? "text-red-400" :
                           anom.summary.overallRisk === "moderate" ? "text-amber-400" : "text-emerald-400" },
                ].map((c) => (
                  <div key={c.label} className="bg-dark-lighter rounded-xl p-3.5 text-center">
                    <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Spending chart */}
              {anom.spending.chart && anom.spending.chart.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-300 mb-3">Расходы за 30 дней</p>
                  <div className="flex items-end gap-px h-36 bg-dark-lighter rounded-xl p-3">
                    {anom.spending.chart.map((point, i) => {
                      const maxVal = Math.max(...anom.spending.chart.map((p) => p.value), 1);
                      const heightPct = point.value > 0 ? Math.max((point.value / maxVal) * 100, 3) : 1;
                      return (
                        <motion.div key={i} className="flex-1 flex flex-col justify-end h-full group relative"
                          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.02, duration: 0.4 }}
                          style={{ transformOrigin: "bottom" }}
                        >
                          <div className={`w-full rounded-t transition-colors ${
                            point.severity === "critical" ? "bg-red-500 shadow-sm shadow-red-500/30" :
                            point.severity === "warning" ? "bg-amber-500 shadow-sm shadow-amber-500/20" :
                            point.value > 0 ? "bg-slate-600/60 group-hover:bg-slate-500/80" : "bg-slate-700/20"
                          }`} style={{ height: `${heightPct}%`, minHeight: "2px" }} />
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10
                            bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                            <p className="text-white font-medium">{formatDate(point.date)}</p>
                            <p className="text-slate-400">{formatMoney(point.value)}</p>
                            {point.z !== 0 && (
                              <p className={Math.abs(point.z) >= 1.5 ? "text-amber-400" : "text-slate-500"}>
                                Z-score: {point.z}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1.5 px-1">
                    <span>{anom.spending.chart.length > 0 ? formatDate(anom.spending.chart[0].date) : ""}</span>
                    <span>Сегодня</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-600/60" /> Норма</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Z &gt; 1.5</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500" /> Z &gt; 2.5</span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { title: "Расходы", lines: [`μ = ${formatMoney(anom.spending.mean)}`, `σ = ${formatMoney(anom.spending.stdDev)}`] },
                  { title: "Время", lines: [
                    `Пик: ${anom.timePatterns.peakHour !== null ? `${anom.timePatterns.peakHour}:00` : "нет данных"}`,
                    `Ночь: ${Math.round(anom.timePatterns.nightRatio * 100)}%`
                  ]},
                  { title: "Блокировки", lines: [`Всего: ${anom.blockAttempts.total}`, `μ = ${anom.blockAttempts.mean} / день`] },
                ].map((s) => (
                  <div key={s.title} className="bg-dark-lighter rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-2 font-medium">{s.title}</p>
                    {s.lines.map((l, i) => (
                      <p key={i} className="text-sm text-slate-300 font-mono">{l}</p>
                    ))}
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {anom.summary.alerts.length > 0 && (
                <div className="pt-4 border-t border-dark-border space-y-2">
                  {anom.summary.alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <p className="text-sm text-slate-300">{a}</p>
                    </div>
                  ))}
                </div>
              )}

              {anom.summary.totalAnomalies === 0 && (
                <div className="flex flex-col items-center py-6 gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-sm text-emerald-400/80">Поведение в пределах нормы</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <motion.p variants={fadeSlide} className="text-center text-xs text-slate-600">
        {new Date(data.timestamp).toLocaleString("ru-RU")} / 3 независимых модуля / 0 внешних API
      </motion.p>
    </motion.div>
  );
}
