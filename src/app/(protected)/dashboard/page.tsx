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

const MOOD_ICONS: Record<string, React.ReactNode> = {
  great: (
    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
  good: (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
  neutral: (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zM9 15h6" />
    </svg>
  ),
  bad: (
    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
  terrible: (
    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
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
    case "none": return { text: "text-emerald-400", bg: "bg-emerald-400", label: "Нет проблемы" };
    case "low": return { text: "text-amber-400", bg: "bg-amber-400", label: "Низкий" };
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" } }),
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const quote = getDailyQuote();

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/ai/analyze").then((r) => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([dashData, analysisData]) => {
        setData(dashData);
        setAiAnalysis(analysisData);
      })
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
        <p className="text-sm text-slate-500 animate-pulse">Загрузка данных...</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-400 text-center py-16">Ошибка загрузки данных</p>;
  }

  const risk = data.pgsi ? getRiskColor(data.pgsi.risk_category) : null;
  const { weeklyStats, streak, recentDiary } = data;

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible">

      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-white">
          {data.user.name ? `Привет, ${data.user.name}!` : "Добро пожаловать!"}
        </h1>
        <p className="text-slate-400 mt-1">Ваша персональная панель мониторинга</p>
      </motion.div>

      {/* Quote */}
      <motion.div variants={fadeUp} custom={1}
        className="relative overflow-hidden bg-gradient-to-br from-accent/5 via-dark-card to-cyan-500/5 border border-accent/10 rounded-xl p-5"
      >
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <svg className="w-5 h-5 text-accent/40 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-slate-300 italic leading-relaxed">{quote.text}</p>
          <p className="text-accent text-sm mt-2 font-medium">— {quote.author}</p>
        </div>
      </motion.div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk card */}
        <motion.div variants={fadeUp} custom={2}>
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
                <div className={`text-2xl font-bold mb-1 ${risk!.text}`}>{risk!.label}</div>
                <div className="mt-3 h-2 bg-dark rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${risk!.bg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.pgsi.total_score / 27) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">Тест от {formatDate(data.pgsi.created_at)}</span>
                  <Link href="/pgsi-test" className="text-xs text-accent hover:underline">Пройти заново</Link>
                </div>
              </>
            ) : (
              <div className="text-slate-500">
                <p className="mb-3">Тест не пройден</p>
                <Link href="/pgsi-test"><Button size="sm">Пройти тест</Button></Link>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Weekly stats */}
        <motion.div variants={fadeUp} custom={3}>
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
                  <span className="text-xl font-bold text-white">{formatMoney(weeklyStats.totalAmount)}</span>
                </div>
                <DeltaIndicator value={weeklyStats.amountDelta} inverse isMoney />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Streak */}
        <motion.div variants={fadeUp} custom={4}>
          <Card className="h-full relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="text-sm text-slate-400 mb-3">Серия воздержания</div>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold text-white tabular-nums">{streak}</div>
                <div>
                  <div className="text-sm text-slate-400">
                    {streak === 1 ? "день" : streak > 1 && streak < 5 ? "дня" : "дней"}
                  </div>
                  <div className="text-xs text-slate-500">без игры</div>
                </div>
              </div>

              {streak > 0 && (
                <div className="mt-4 flex gap-1.5">
                  {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                    <motion.div key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 300 }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        streak >= 7 ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20" :
                        "bg-accent/10 border border-accent/20"
                      }`}
                    >
                      {streak >= 7 ? (
                        <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 23c-3.03 0-6.21-2.15-6.21-6.31 0-3.31 2.53-6.09 4.5-8.19l.76-.79c.39.67.87 1.37 1.44 2.09.41.51.85 1.03 1.28 1.56.24-.96.36-1.98.36-3.06 0-.87-.08-1.69-.24-2.46C16.62 8.79 18.87 12.62 18.87 16.69 18.87 20.85 15.03 23 12 23z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      )}
                    </motion.div>
                  ))}
                  {streak > 7 && (
                    <div className="w-7 h-7 rounded-lg bg-dark-lighter border border-dark-border flex items-center justify-center text-[10px] text-slate-500 font-medium">
                      +{streak - 7}
                    </div>
                  )}
                </div>
              )}
              {streak === 0 && (
                <p className="text-xs text-slate-500 mt-3">Зафиксируйте эпизод, чтобы начать отсчёт</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* SOS Button */}
      <motion.div variants={fadeUp} custom={5}>
        <Link href="/sos">
          <Card className="group cursor-pointer hover:border-red-500/30 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-white">Мне нужна помощь</div>
                <div className="text-sm text-slate-400">Дыхание, таймер, заземление — справиться с желанием</div>
              </div>
              <svg className="w-5 h-5 text-slate-500 shrink-0 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* AI Analysis Hub */}
      <motion.div variants={fadeUp} custom={6}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-cyan-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">AI-анализ</h2>
            </div>
            <Link href="/ai-insights" className="text-xs text-accent hover:underline">Подробнее</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Neural Network */}
            <div className="bg-dark-lighter rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300">Нейросеть</p>
                  <p className="text-[10px] text-slate-500">6-8-4-1</p>
                </div>
              </div>
              {aiAnalysis ? (() => {
                const nn = aiAnalysis.modules.neuralNetwork.prediction;
                return (
                  <>
                    <div className="flex items-end gap-1 mb-2">
                      <span className={`text-2xl font-bold ${
                        nn.riskLevel === "HIGH" ? "text-red-400" :
                        nn.riskLevel === "MEDIUM" ? "text-amber-400" : "text-emerald-400"
                      }`}>{nn.riskScore}</span>
                      <span className="text-slate-500 text-xs mb-1">/100</span>
                    </div>
                    <div className="h-1.5 bg-dark rounded-full overflow-hidden mb-2">
                      <motion.div
                        className={`h-full rounded-full ${
                          nn.riskLevel === "HIGH" ? "bg-red-400" :
                          nn.riskLevel === "MEDIUM" ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${nn.riskScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        nn.riskLevel === "HIGH" ? "text-red-400 bg-red-500/10" :
                        nn.riskLevel === "MEDIUM" ? "text-amber-400 bg-amber-500/10" :
                        "text-emerald-400 bg-emerald-500/10"
                      }`}>{nn.riskLevel === "HIGH" ? "Высокий" : nn.riskLevel === "MEDIUM" ? "Умеренный" : "Низкий"}</span>
                      <span className="text-[10px] text-slate-500">{Math.round(nn.confidence * 100)}%</span>
                    </div>
                  </>
                );
              })() : (
                <div className="text-slate-500 text-xs animate-pulse">Загрузка...</div>
              )}
            </div>

            {/* NLP Sentiment */}
            <div className="bg-dark-lighter rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
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
                        Добавить запись
                      </Link>
                    </div>
                  );
                }
                const trendColor = s.trend === "improving" ? "text-emerald-400" : s.trend === "declining" ? "text-red-400" : "text-slate-400";
                return (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className={`w-5 h-5 ${trendColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {s.trend === "improving" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                        ) : s.trend === "declining" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12h-15" />
                        )}
                      </svg>
                      <div>
                        <p className={`text-sm font-medium ${trendColor}`}>
                          {s.trend === "improving" ? "Улучшается" : s.trend === "declining" ? "Ухудшается" : "Стабильно"}
                        </p>
                        <p className="text-[10px] text-slate-500">{s.entryCount} записей</p>
                      </div>
                    </div>
                    {s.warningSignals.length > 0 ? (
                      <div className="space-y-1">
                        {s.warningSignals.slice(0, 2).map((w, i) => (
                          <div key={i} className="text-[10px] text-amber-400 flex items-start gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span className="line-clamp-1">{w}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400/80 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Фон стабильный
                      </div>
                    )}
                  </>
                );
              })() : (
                <div className="text-center py-1">
                  <p className="text-[11px] text-slate-500 animate-pulse">Загрузка...</p>
                </div>
              )}
            </div>

            {/* Anomaly Detection */}
            <div className="bg-dark-lighter rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300">Детектор</p>
                  <p className="text-[10px] text-slate-500">Z-score</p>
                </div>
              </div>
              {aiAnalysis ? (() => {
                const a = aiAnalysis.modules.anomalyDetector.summary;
                const rColor = a.overallRisk === "high" ? "text-red-400" : a.overallRisk === "moderate" ? "text-amber-400" : "text-emerald-400";
                return (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className={`text-lg font-bold ${rColor}`}>{a.totalAnomalies}</p>
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
                          <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span className="line-clamp-1">{al}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400/80 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Аномалий нет
                      </div>
                    )}
                  </>
                );
              })() : (
                <div className="text-xs text-emerald-400/80 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Аномалий нет
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Нейросеть
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                NLP
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Аномалии
              </span>
            </div>
            <span className="text-[10px] text-slate-600">3 независимых AI-модуля</span>
          </div>
        </Card>
      </motion.div>

      {/* Diary entries */}
      <motion.div variants={fadeUp} custom={7}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Последние записи</h2>
            <Link href="/diary" className="text-sm text-accent hover:underline">Все записи</Link>
          </div>

          {recentDiary.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 mb-3">Пока нет записей</p>
              <Link href="/diary"><Button size="sm" variant="secondary">Написать первую запись</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDiary.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-dark-lighter/50 hover:bg-dark-lighter transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    entry.type === "episode" ? "bg-red-500/10" : "bg-accent/10"
                  }`}>
                    {entry.type === "episode" ? (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-medium ${
                        entry.type === "episode" ? "text-red-400" : "text-accent"
                      }`}>
                        {entry.type === "episode" ? "Эпизод" : "Позитивный день"}
                      </span>
                      {entry.mood_before && (
                        <span className="flex items-center gap-1">
                          {MOOD_ICONS[entry.mood_before]}
                          {entry.type === "episode" && entry.mood_after && (
                            <>
                              <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                              {MOOD_ICONS[entry.mood_after]}
                            </>
                          )}
                        </span>
                      )}
                      {entry.type === "episode" && entry.amount > 0 && (
                        <span className="text-xs text-red-400 font-medium">{formatMoney(entry.amount)}</span>
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
    </motion.div>
  );
}

function DeltaIndicator({ value, inverse = false, isMoney = false }: { value: number; inverse?: boolean; isMoney?: boolean }) {
  if (value === 0) {
    return <span className="text-xs text-slate-500">Без изменений</span>;
  }
  const isPositiveChange = inverse ? value < 0 : value > 0;
  return (
    <span className={`text-xs font-medium inline-flex items-center gap-1 ${isPositiveChange ? "text-emerald-400" : "text-red-400"}`}>
      <svg className={`w-3 h-3 ${value < 0 ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
      {isMoney ? formatMoney(Math.abs(value)) : Math.abs(value)} vs пред. нед.
    </span>
  );
}
