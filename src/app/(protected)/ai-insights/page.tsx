"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
      meta: { name: string; architecture: string; parameters: number };
      prediction: {
        riskScore: number;
        riskProbability: number;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        confidence: number;
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

const impactColor = { low: "bg-green-500", medium: "bg-yellow-500", high: "bg-red-500" };
const impactLabel = { low: "Низкий", medium: "Средний", high: "Высокий" };

export default function AIInsightsPage() {
  const [data, setData] = useState<AIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/analyze")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
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
    return <p className="text-slate-400 text-center py-16">Ошибка загрузки AI-анализа</p>;
  }

  const nn = data.modules.neuralNetwork;
  const sent = data.modules.sentimentAnalysis;
  const anom = data.modules.anomalyDetector;
  const combined = data.combinedRisk;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🧠</span> AI-анализ
          </h1>
          <p className="text-slate-400 mt-1">Результаты трёх независимых AI-модулей</p>
        </div>
        <Link href="/about-ai" className="text-sm text-accent hover:underline shrink-0">
          Как работают модели
        </Link>
      </div>

      {/* Combined Risk Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white mb-4">Сводный анализ</h2>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <div className={`text-3xl font-bold ${
                  nn.prediction.riskLevel === "HIGH" ? "text-red-400" :
                  nn.prediction.riskLevel === "MEDIUM" ? "text-yellow-400" : "text-green-400"
                }`}>{nn.prediction.riskScore}</div>
                <p className="text-xs text-slate-500 mt-1">Нейросеть</p>
              </div>
              <div>
                <div className={`text-3xl font-bold ${
                  sent.trend.trend === "declining" ? "text-red-400" :
                  sent.trend.trend === "improving" ? "text-green-400" : "text-slate-300"
                }`}>
                  {sent.trend.trend === "improving" ? "↑" : sent.trend.trend === "declining" ? "↓" : "→"}
                </div>
                <p className="text-xs text-slate-500 mt-1">NLP-тренд</p>
              </div>
              <div>
                <div className={`text-3xl font-bold ${
                  anom.summary.overallRisk === "high" ? "text-red-400" :
                  anom.summary.overallRisk === "moderate" ? "text-yellow-400" : "text-green-400"
                }`}>{anom.summary.totalAnomalies}</div>
                <p className="text-xs text-slate-500 mt-1">Аномалий</p>
              </div>
            </div>

            {combined.allWarnings.length > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-dark-border">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Предупреждения</p>
                {combined.allWarnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-yellow-400 mt-0.5 shrink-0">⚠</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ═══ MODULE 1: Neural Network ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">🔮</div>
            <div>
              <h2 className="text-lg font-semibold text-white">Нейронная сеть</h2>
              <p className="text-xs text-slate-500">{nn.meta.architecture} · {nn.meta.parameters} параметров</p>
            </div>
            <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Независимая модель
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Risk gauge */}
            <div>
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-5xl font-bold ${
                  nn.prediction.riskLevel === "HIGH" ? "text-red-400" :
                  nn.prediction.riskLevel === "MEDIUM" ? "text-yellow-400" : "text-green-400"
                }`}>{nn.prediction.riskScore}</span>
                <span className="text-slate-500 text-lg mb-2">/100</span>
              </div>
              <div className="h-3 bg-dark rounded-full overflow-hidden mb-3">
                <motion.div
                  className={`h-full rounded-full ${
                    nn.prediction.riskLevel === "HIGH" ? "bg-gradient-to-r from-yellow-500 to-red-500" :
                    nn.prediction.riskLevel === "MEDIUM" ? "bg-gradient-to-r from-green-500 to-yellow-500" :
                    "bg-gradient-to-r from-green-400 to-green-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${nn.prediction.riskScore}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  nn.prediction.riskLevel === "HIGH" ? "text-red-400 bg-red-500/10" :
                  nn.prediction.riskLevel === "MEDIUM" ? "text-yellow-400 bg-yellow-500/10" :
                  "text-green-400 bg-green-500/10"
                }`}>
                  {nn.prediction.riskLevel === "HIGH" ? "Высокий риск" :
                   nn.prediction.riskLevel === "MEDIUM" ? "Умеренный риск" : "Низкий риск"}
                </span>
                <span className="text-slate-500">Уверенность: {Math.round(nn.prediction.confidence * 100)}%</span>
              </div>

              {/* Raw input features */}
              <div className="mt-4 pt-4 border-t border-dark-border">
                <p className="text-xs text-slate-400 mb-2">Входные данные</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-slate-500">Эпизодов/нед: <span className="text-white">{nn.inputFeatures.episodeFrequency}</span></div>
                  <div className="text-slate-500">Тренд расходов: <span className="text-white">{nn.inputFeatures.spendingTrend.toFixed(1)}x</span></div>
                  <div className="text-slate-500">Настроение: <span className="text-white">{nn.inputFeatures.moodScore.toFixed(1)}/5</span></div>
                  <div className="text-slate-500">Ночная актив.: <span className="text-white">{Math.round(nn.inputFeatures.nightActivityRatio * 100)}%</span></div>
                  <div className="text-slate-500">Триггеров: <span className="text-white">{nn.inputFeatures.triggerDiversity}</span></div>
                  <div className="text-slate-500">Серия: <span className="text-white">{nn.inputFeatures.streakDays} дн.</span></div>
                </div>
              </div>
            </div>

            {/* Feature importance */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-3">Важность факторов</p>
              <div className="space-y-3">
                {nn.prediction.featureImportance.map((f, i) => (
                  <motion.div
                    key={f.feature}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{f.feature}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        f.impact === "high" ? "text-red-400 bg-red-500/10" :
                        f.impact === "medium" ? "text-yellow-400 bg-yellow-500/10" :
                        "text-green-400 bg-green-500/10"
                      }`}>{impactLabel[f.impact]}</span>
                    </div>
                    <div className="h-2 bg-dark rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${impactColor[f.impact]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${f.normalizedValue * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.08 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══ MODULE 2: NLP Sentiment ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">💬</div>
            <div>
              <h2 className="text-lg font-semibold text-white">NLP-анализ настроения</h2>
              <p className="text-xs text-slate-500">{sent.meta.lexicon}</p>
            </div>
            <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Независимая модель
            </span>
          </div>

          {sent.trend.entryCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-slate-400 mb-1">Нет записей для анализа</p>
              <p className="text-sm text-slate-500 mb-3">Добавьте записи в дневник с текстом в поле «Заметки»</p>
              <Link href="/diary" className="text-sm text-accent hover:underline">
                Перейти в дневник
              </Link>
            </div>
          ) : (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-dark-lighter rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{sent.trend.entryCount}</p>
                  <p className="text-[10px] text-slate-500">записей</p>
                </div>
                <div className="bg-dark-lighter rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${
                    sent.trend.averageScore > 0 ? "text-green-400" :
                    sent.trend.averageScore < 0 ? "text-red-400" : "text-slate-300"
                  }`}>{sent.trend.averageScore > 0 ? "+" : ""}{sent.trend.averageScore}</p>
                  <p className="text-[10px] text-slate-500">средний score</p>
                </div>
                <div className="bg-dark-lighter rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${
                    sent.trend.trend === "improving" ? "text-green-400" :
                    sent.trend.trend === "declining" ? "text-red-400" : "text-slate-300"
                  }`}>
                    {sent.trend.trend === "improving" ? "↑" : sent.trend.trend === "declining" ? "↓" : "→"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {sent.trend.trend === "improving" ? "Улучшается" :
                     sent.trend.trend === "declining" ? "Ухудшается" : "Стабильно"}
                  </p>
                </div>
                <div className="bg-dark-lighter rounded-lg p-3 text-center">
                  <p className="text-2xl">
                    {sent.trend.dominantMood === "positive" ? "😊" :
                     sent.trend.dominantMood === "negative" ? "😟" : "😐"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {sent.trend.dominantMood === "positive" ? "Позитивный" :
                     sent.trend.dominantMood === "negative" ? "Негативный" : "Нейтральный"}
                  </p>
                </div>
              </div>

              {/* Sentiment timeline */}
              <p className="text-sm font-medium text-slate-300 mb-3">Настроение по записям</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {sent.entries.map((entry, i) => (
                  <motion.div
                    key={`${entry.date}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    className="flex items-center gap-3 p-2.5 bg-dark-lighter rounded-lg"
                  >
                    <span className="text-lg shrink-0">
                      {entry.label === "positive" ? "😊" : entry.label === "negative" ? "😟" : "😐"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{formatDate(entry.date)}</span>
                        <span className={`text-xs font-medium ${
                          entry.score > 0 ? "text-green-400" : entry.score < 0 ? "text-red-400" : "text-slate-400"
                        }`}>
                          {entry.score > 0 ? "+" : ""}{entry.score}
                        </span>
                      </div>
                    </div>
                    {/* Mini bar */}
                    <div className="w-20 h-2 bg-dark rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${
                          entry.label === "positive" ? "bg-green-500" :
                          entry.label === "negative" ? "bg-red-500" : "bg-slate-500"
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(entry.comparative) * 100, 100)}%`,
                          marginLeft: entry.comparative >= 0 ? "50%" : `${50 - Math.min(Math.abs(entry.comparative) * 100, 50)}%`,
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Warnings */}
              {sent.trend.warningSignals.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <p className="text-xs font-medium text-yellow-400 mb-2">Предупреждения NLP</p>
                  {sent.trend.warningSignals.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="text-yellow-400">⚠</span> {w}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </motion.div>

      {/* ═══ MODULE 3: Anomaly Detector ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg">📊</div>
            <div>
              <h2 className="text-lg font-semibold text-white">Детектор аномалий</h2>
              <p className="text-xs text-slate-500">{anom.meta.method}</p>
            </div>
            <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Независимая модель
            </span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-dark-lighter rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${
                anom.summary.totalAnomalies > 0 ? "text-amber-400" : "text-green-400"
              }`}>{anom.summary.totalAnomalies}</p>
              <p className="text-[10px] text-slate-500">аномалий</p>
            </div>
            <div className="bg-dark-lighter rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{anom.summary.criticalCount}</p>
              <p className="text-[10px] text-slate-500">критических</p>
            </div>
            <div className="bg-dark-lighter rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{anom.summary.warningCount}</p>
              <p className="text-[10px] text-slate-500">предупреждений</p>
            </div>
            <div className="bg-dark-lighter rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${
                anom.summary.overallRisk === "high" ? "text-red-400" :
                anom.summary.overallRisk === "moderate" ? "text-yellow-400" : "text-green-400"
              }`}>
                {anom.summary.overallRisk === "high" ? "🔴" :
                 anom.summary.overallRisk === "moderate" ? "🟡" : "🟢"}
              </p>
              <p className="text-[10px] text-slate-500">
                Риск: {anom.summary.overallRisk === "high" ? "высокий" :
                        anom.summary.overallRisk === "moderate" ? "умеренный" : "низкий"}
              </p>
            </div>
          </div>

          {/* Spending chart with Z-scores */}
          {anom.spending.chart && anom.spending.chart.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-300 mb-3">Расходы за 30 дней (Z-score)</p>
              <div className="flex items-end gap-[2px] h-32">
                {anom.spending.chart.map((point, i) => {
                  const maxVal = Math.max(...anom.spending.chart.map((p) => p.value), 1);
                  const heightPct = point.value > 0 ? Math.max((point.value / maxVal) * 100, 4) : 2;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          point.severity === "critical" ? "bg-red-500" :
                          point.severity === "warning" ? "bg-yellow-500" :
                          point.value > 0 ? "bg-slate-500/50" : "bg-slate-700/30"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-dark-card border border-dark-border rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                        <p className="text-white">{formatDate(point.date)}</p>
                        <p className="text-slate-400">{formatMoney(point.value)}</p>
                        {point.z !== 0 && <p className={`${Math.abs(point.z) >= 1.5 ? "text-yellow-400" : "text-slate-500"}`}>Z: {point.z}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>{anom.spending.chart.length > 0 ? formatDate(anom.spending.chart[0].date) : ""}</span>
                <span>Сегодня</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-500/50"></span>Норма</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500"></span>Z &gt; 1.5</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500"></span>Z &gt; 2.5</span>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-dark-lighter rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Расходы</p>
              <p className="text-sm text-white">μ = {formatMoney(anom.spending.mean)}</p>
              <p className="text-xs text-slate-500">σ = {formatMoney(anom.spending.stdDev)}</p>
            </div>
            <div className="bg-dark-lighter rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Время</p>
              <p className="text-sm text-white">Пик: {anom.timePatterns.peakHour !== null ? `${anom.timePatterns.peakHour}:00` : "—"}</p>
              <p className="text-xs text-slate-500">Ночь: {Math.round(anom.timePatterns.nightRatio * 100)}%</p>
            </div>
            <div className="bg-dark-lighter rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Блокировки</p>
              <p className="text-sm text-white">Всего: {anom.blockAttempts.total}</p>
              <p className="text-xs text-slate-500">μ = {anom.blockAttempts.mean}/день</p>
            </div>
          </div>

          {/* Alerts */}
          {anom.summary.alerts.length > 0 && (
            <div className="pt-4 border-t border-dark-border">
              <p className="text-xs font-medium text-amber-400 mb-2">Обнаруженные аномалии</p>
              <div className="space-y-2">
                {anom.summary.alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {anom.summary.totalAnomalies === 0 && (
            <div className="text-center py-4 text-green-400/80 text-sm">
              ✓ Аномалий не обнаружено — поведение в пределах нормы
            </div>
          )}
        </Card>
      </motion.div>

      {/* Timestamp */}
      <p className="text-center text-xs text-slate-600">
        Анализ выполнен: {new Date(data.timestamp).toLocaleString("ru-RU")} · 3 независимых модуля · 0 внешних API
      </p>
    </div>
  );
}
