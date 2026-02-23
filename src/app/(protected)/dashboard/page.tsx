"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const QUOTES = [
  { text: "Каждый день — это новый шанс стать лучшей версией себя.", author: "Неизвестный" },
  { text: "Сила не в том, чтобы никогда не падать, а в том, чтобы подниматься каждый раз.", author: "Конфуций" },
  { text: "Путь в тысячу миль начинается с одного шага.", author: "Лао-цзы" },
  { text: "Ты не можешь изменить вчера, но можешь изменить сегодня.", author: "Неизвестный" },
  { text: "Признание проблемы — это уже половина решения.", author: "Неизвестный" },
  { text: "Маленькие шаги каждый день приводят к большим переменам.", author: "Неизвестный" },
  { text: "Ты сильнее, чем думаешь, и храбрее, чем чувствуешь.", author: "А. А. Милн" },
  { text: "Свобода — это то, что ты делаешь с тем, что сделали с тобой.", author: "Жан-Поль Сартр" },
  { text: "Не стыдно просить о помощи. Стыдно делать вид, что справляешься.", author: "Неизвестный" },
  { text: "Лучшее время начать было вчера. Следующее лучшее — сейчас.", author: "Неизвестный" },
  { text: "Один день без игры — это победа. Завтра будет ещё одна.", author: "Неизвестный" },
  { text: "Ты не одинок в этой борьбе. И ты заслуживаешь свободу.", author: "Неизвестный" },
  { text: "Контроль начинается с осознанности.", author: "Неизвестный" },
  { text: "Деньги можно заработать. Время и здоровье — нет.", author: "Неизвестный" },
  { text: "Зависимость говорит тебе, что всё в порядке. Но ты знаешь правду.", author: "Неизвестный" },
  { text: "Прогресс, а не совершенство.", author: "Неизвестный" },
  { text: "Каждый отказ от игры делает тебя сильнее.", author: "Неизвестный" },
  { text: "Ты заслуживаешь жизнь, которая не зависит от ставки.", author: "Неизвестный" },
  { text: "Самая важная ставка — ставка на себя.", author: "Неизвестный" },
  { text: "Вчера ты хотел бросить. Сегодня ты уже на шаг впереди.", author: "Неизвестный" },
  { text: "Боль временна. Сдаться — навсегда.", author: "Лэнс Армстронг" },
  { text: "Если ты устал, научись отдыхать, а не сдаваться.", author: "Банкси" },
  { text: "Настоящий выигрыш — когда ты не играешь.", author: "Неизвестный" },
  { text: "Ты не сломлен. Ты в процессе восстановления.", author: "Неизвестный" },
  { text: "То, что ты чувствуешь сейчас, пройдёт. Подожди.", author: "Неизвестный" },
  { text: "Свобода от зависимости — лучший джекпот.", author: "Неизвестный" },
  { text: "Каждое утро — это шанс сделать другой выбор.", author: "Неизвестный" },
  { text: "Ты уже здесь. Это уже больше, чем многие смогли.", author: "Неизвестный" },
  { text: "Зависимость — не приговор. Это вызов, который можно принять.", author: "Неизвестный" },
  { text: "Тебе не нужна удача. Тебе нужна решимость.", author: "Неизвестный" },
  { text: "Жизнь — не азартная игра. В ней можно выбирать.", author: "Неизвестный" },
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

const MOOD_EMOJI: Record<string, string> = {
  great: "\u{1F60A}",
  good: "\u{1F642}",
  neutral: "\u{1F610}",
  bad: "\u{1F614}",
  terrible: "\u{1F622}",
};


interface DashboardData {
  user: { name: string | null; risk_score: number };
  pgsi: { total_score: number; risk_category: string; created_at: string } | null;
  weeklyStats: {
    episodeCount: number;
    totalAmount: number;
    prevWeekCount: number;
    prevWeekAmount: number;
    countDelta: number;
    amountDelta: number;
  };
  streak: number;
  recentDiary: Array<{
    id: string;
    type: string;
    notes: string | null;
    mood_before: string | null;
    mood_after: string | null;
    amount: number;
    date: string;
  }>;
}

function getRiskColor(category: string) {
  switch (category) {
    case "none": return { text: "text-green-400", bg: "bg-green-400", label: "Нет проблемы" };
    case "low": return { text: "text-yellow-400", bg: "bg-yellow-400", label: "Низкий" };
    case "moderate": return { text: "text-orange-400", bg: "bg-orange-400", label: "Умеренный" };
    case "high": return { text: "text-red-400", bg: "bg-red-400", label: "Высокий" };
    default: return { text: "text-slate-400", bg: "bg-slate-400", label: "Не определён" };
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(amount) + " ₸";
}

interface PredictData {
  relapseRisk: number;
  riskLevel: string;
  trend: string;
  warnings: string[];
  recommendations: string[];
}

interface AIAnalysis {
  modules: {
    neuralNetwork: {
      meta: { name: string; architecture: string; parameters: number };
      prediction: {
        riskScore: number;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        confidence: number;
        featureImportance: Array<{ feature: string; normalizedValue: number; impact: string }>;
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
        entryCount: number;
      };
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
    };
  };
  combinedRisk: {
    neuralScore: number;
    sentimentTrend: string;
    anomalyRisk: string;
    allWarnings: string[];
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [predict, setPredict] = useState<PredictData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const quote = getDailyQuote();

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/ai/predict-risk").then((r) => r.json()).catch(() => null),
      fetch("/api/ai/analyze").then((r) => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([dashData, predictData, analysisData]) => {
        setData(dashData);
        setPredict(predictData);
        setAiAnalysis(analysisData);
      })
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
    return <p className="text-slate-400 text-center py-16">Ошибка загрузки данных</p>;
  }

  const risk = data.pgsi ? getRiskColor(data.pgsi.risk_category) : null;
  const { weeklyStats, streak, recentDiary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {data.user.name ? `Привет, ${data.user.name}!` : "Добро пожаловать!"}
        </h1>
        <p className="text-slate-400 mt-1">Ваша персональная панель мониторинга</p>
      </div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-accent-muted border border-accent/10 rounded-xl p-5"
      >
        <p className="text-slate-300 italic leading-relaxed">&laquo;{quote.text}&raquo;</p>
        <p className="text-accent text-sm mt-2">— {quote.author}</p>
      </motion.div>

      {/* Top cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Risk card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Уровень риска</span>
              {data.pgsi && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${risk!.text} bg-dark-lighter`}>
                  PGSI: {data.pgsi.total_score}/27
                </span>
              )}
            </div>

            {data.pgsi ? (
              <>
                <div className={`text-2xl font-bold mb-1 ${risk!.text}`}>
                  {risk!.label}
                </div>
                <div className="mt-3 h-2 bg-dark rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${risk!.bg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.pgsi.total_score / 27) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">
                    Тест от {formatDate(data.pgsi.created_at)}
                  </span>
                  <Link href="/pgsi-test" className="text-xs text-accent hover:underline">
                    Пройти заново
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-slate-500">
                <p className="mb-3">Тест не пройден</p>
                <Link href="/pgsi-test">
                  <Button size="sm">Пройти тест</Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Weekly stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <div className="text-sm text-slate-400 mb-3">Статистика недели</div>

            <div className="space-y-4">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{weeklyStats.episodeCount}</span>
                  <span className="text-sm text-slate-500 mb-0.5">
                    {weeklyStats.episodeCount === 1 ? "эпизод" : weeklyStats.episodeCount > 1 && weeklyStats.episodeCount < 5 ? "эпизода" : "эпизодов"}
                  </span>
                </div>
                <DeltaIndicator value={weeklyStats.countDelta} inverse />
              </div>

              <div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white">
                    {formatMoney(weeklyStats.totalAmount)}
                  </span>
                </div>
                <DeltaIndicator value={weeklyStats.amountDelta} inverse isMoney />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <div className="text-sm text-slate-400 mb-3">Серия воздержания</div>

            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-white">{streak}</div>
              <div>
                <div className="text-sm text-slate-400">
                  {streak === 1 ? "день" : streak > 1 && streak < 5 ? "дня" : "дней"}
                </div>
                <div className="text-xs text-slate-500">без игры</div>
              </div>
            </div>

            {/* Streak flames */}
            {streak > 0 && (
              <div className="mt-4 flex gap-1">
                {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-sm"
                  >
                    {streak >= 7 ? "\u{1F525}" : "\u{2B50}"}
                  </motion.div>
                ))}
                {streak > 7 && (
                  <div className="w-8 h-8 rounded-lg bg-dark-lighter flex items-center justify-center text-xs text-slate-500">
                    +{streak - 7}
                  </div>
                )}
              </div>
            )}

            {streak === 0 && (
              <p className="text-xs text-slate-500 mt-3">
                Зафиксируйте эпизод, чтобы начать отсчёт серии
              </p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* SOS Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Link href="/sos">
          <Card className="group cursor-pointer hover:border-red-500/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">Мне нужна помощь</div>
                <div className="text-sm text-slate-400">Дыхание, таймер, заземление — справиться с желанием играть</div>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* AI Analysis Hub */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <h2 className="text-lg font-semibold text-white">AI-анализ</h2>
            </div>
            <Link href="/about-ai" className="text-xs text-accent hover:underline">
              Как это работает
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Neural Network Risk */}
            <div className="bg-dark-lighter rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-xs">🔮</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300">Нейросеть</p>
                  <p className="text-[10px] text-slate-500">6→8→4→1</p>
                </div>
              </div>
              {aiAnalysis ? (() => {
                const nn = aiAnalysis.modules.neuralNetwork.prediction;
                return (
                  <>
                    <div className="flex items-end gap-1 mb-2">
                      <span className={`text-2xl font-bold ${
                        nn.riskLevel === "HIGH" ? "text-red-400" :
                        nn.riskLevel === "MEDIUM" ? "text-yellow-400" : "text-green-400"
                      }`}>{nn.riskScore}</span>
                      <span className="text-slate-500 text-xs mb-1">/100</span>
                    </div>
                    <div className="h-1.5 bg-dark rounded-full overflow-hidden mb-2">
                      <motion.div
                        className={`h-full rounded-full ${
                          nn.riskLevel === "HIGH" ? "bg-red-400" :
                          nn.riskLevel === "MEDIUM" ? "bg-yellow-400" : "bg-green-400"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${nn.riskScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        nn.riskLevel === "HIGH" ? "text-red-400 bg-red-500/10" :
                        nn.riskLevel === "MEDIUM" ? "text-yellow-400 bg-yellow-500/10" :
                        "text-green-400 bg-green-500/10"
                      }`}>{nn.riskLevel}</span>
                      <span className="text-[10px] text-slate-500">conf: {nn.confidence}</span>
                    </div>
                  </>
                );
              })() : predict ? (
                <>
                  <div className="flex items-end gap-1 mb-2">
                    <span className={`text-2xl font-bold ${
                      predict.riskLevel === "HIGH" ? "text-red-400" :
                      predict.riskLevel === "MEDIUM" ? "text-yellow-400" : "text-green-400"
                    }`}>{predict.relapseRisk}</span>
                    <span className="text-slate-500 text-xs mb-1">/100</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    predict.trend === "increasing" ? "text-red-400 bg-red-500/10" :
                    predict.trend === "decreasing" ? "text-green-400 bg-green-500/10" :
                    "text-slate-400 bg-slate-500/10"
                  }`}>
                    {predict.trend === "increasing" ? "↑ Растёт" : predict.trend === "decreasing" ? "↓ Снижается" : "→ Стабильно"}
                  </span>
                </>
              ) : (
                <div className="text-slate-500 text-xs">Загрузка...</div>
              )}
            </div>

            {/* NLP Sentiment */}
            <div className="bg-dark-lighter rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-xs">💬</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300">NLP-анализ</p>
                  <p className="text-[10px] text-slate-500">AFINN-165</p>
                </div>
              </div>
              {aiAnalysis ? (() => {
                const s = aiAnalysis.modules.sentimentAnalysis.trend;
                if (s.entryCount === 0) {
                  return (
                    <div className="text-center py-1">
                      <p className="text-[11px] text-slate-500 mb-1.5">Нет текстовых записей</p>
                      <Link href="/diary" className="text-[10px] text-accent hover:underline">
                        Добавить запись в дневник
                      </Link>
                    </div>
                  );
                }
                const moodIcon = s.dominantMood === "positive" ? "😊" : s.dominantMood === "negative" ? "😟" : "😐";
                const trendLabel = s.trend === "improving" ? "↑ Улучшается" : s.trend === "declining" ? "↓ Ухудшается" : "→ Стабильно";
                const trendColor = s.trend === "improving" ? "text-green-400" : s.trend === "declining" ? "text-red-400" : "text-slate-400";
                return (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{moodIcon}</span>
                      <div>
                        <p className={`text-sm font-medium ${trendColor}`}>{trendLabel}</p>
                        <p className="text-[10px] text-slate-500">{s.entryCount} записей проанализировано</p>
                      </div>
                    </div>
                    {s.warningSignals.length > 0 ? (
                      <div className="space-y-1">
                        {s.warningSignals.slice(0, 2).map((w, i) => (
                          <div key={i} className="text-[10px] text-yellow-400 flex items-start gap-1">
                            <span className="mt-0.5 shrink-0">⚠</span>
                            <span className="line-clamp-1">{w}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-green-400/80 flex items-center gap-1">
                        <span>✓</span> Фон стабильный
                      </div>
                    )}
                  </>
                );
              })() : (
                <div className="text-center py-1">
                  <p className="text-[11px] text-slate-500">Загрузка...</p>
                </div>
              )}
            </div>

            {/* Anomaly Detection */}
            <div className="bg-dark-lighter rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="text-xs">📊</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300">Детектор</p>
                  <p className="text-[10px] text-slate-500">Z-score</p>
                </div>
              </div>
              {aiAnalysis ? (() => {
                const a = aiAnalysis.modules.anomalyDetector.summary;
                const riskColor = a.overallRisk === "high" ? "text-red-400" : a.overallRisk === "moderate" ? "text-yellow-400" : "text-green-400";
                return (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className={`text-lg font-bold ${riskColor}`}>
                          {a.totalAnomalies}
                        </p>
                        <p className="text-[10px] text-slate-500">аномалий</p>
                      </div>
                      {a.criticalCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded text-red-400 bg-red-500/10">
                          {a.criticalCount} крит.
                        </span>
                      )}
                    </div>
                    {a.alerts.length > 0 ? (
                      <div className="space-y-1">
                        {a.alerts.slice(0, 2).map((al, i) => (
                          <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
                            <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                            <span className="line-clamp-1">{al}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-green-400/80 flex items-center gap-1">
                        <span>✓</span> Аномалий не обнаружено
                      </div>
                    )}
                  </>
                );
              })() : (
                <div className="text-xs text-green-400/80 flex items-center gap-1.5">
                  <span>✓</span> Аномалий не обнаружено
                </div>
              )}
            </div>
          </div>

          {/* AI modules badge */}
          <div className="mt-4 pt-3 border-t border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Нейросеть
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                NLP
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Аномалии
              </span>
            </div>
            <span className="text-[10px] text-slate-600">3 независимых AI-модуля</span>
          </div>
        </Card>
      </motion.div>

      {/* Diary entries */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Последние записи в дневнике</h2>
            <Link href="/diary" className="text-sm text-accent hover:underline">
              Все записи
            </Link>
          </div>

          {recentDiary.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 mb-3">Пока нет записей</p>
              <Link href="/diary">
                <Button size="sm" variant="secondary">Написать первую запись</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDiary.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-dark-lighter/50"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                    entry.type === "episode" ? "bg-red-500/10" : "bg-accent/10"
                  }`}>
                    {entry.type === "episode" ? "\u{1F3B0}" : "\u{2728}"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium ${
                        entry.type === "episode" ? "text-red-400" : "text-accent"
                      }`}>
                        {entry.type === "episode" ? "Эпизод" : "Позитивный день"}
                      </span>
                      {entry.mood_before && (
                        <span className="text-sm">
                          {MOOD_EMOJI[entry.mood_before]}
                          {entry.type === "episode" && entry.mood_after && (
                            <> &rarr; {MOOD_EMOJI[entry.mood_after]}</>
                          )}
                        </span>
                      )}
                      {entry.type === "episode" && entry.amount > 0 && (
                        <span className="text-xs text-red-400 font-medium">
                          {formatMoney(entry.amount)}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-slate-400 line-clamp-1">{entry.notes}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(entry.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

function DeltaIndicator({ value, inverse = false, isMoney = false }: { value: number; inverse?: boolean; isMoney?: boolean }) {
  if (value === 0) {
    return <span className="text-xs text-slate-500">Без изменений</span>;
  }

  // For episodes/money, decrease is good (inverse)
  const isPositiveChange = inverse ? value < 0 : value > 0;

  return (
    <span className={`text-xs font-medium ${isPositiveChange ? "text-green-400" : "text-red-400"}`}>
      {value > 0 ? "+" : ""}
      {isMoney ? formatMoney(value) : value} vs прошлая неделя
    </span>
  );
}
