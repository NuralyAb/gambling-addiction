"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import Card from "@/components/ui/Card";

interface AnalyticsData {
  dailyActivity: Array<{ date: string; fullDate?: string; count: number; amount: number }>;
  moodTimeline: Array<{ date: string; before: number; after: number }>;
  triggerData: Array<{ name: string; value: number }>;
  timeBlocks: Array<{ name: string; value: number }>;
  insights: string[];
  monthlySpent: number;
  totalEpisodes: number;
}

interface MonthlyBreakdown {
  month: string;
  label: string;
  amount: number;
}

interface AchievementsData {
  streakDays: number;
  totalSaved: number;
  totalLost: number;
  avgPerEpisode: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

const PIE_COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
const MOOD_LABELS = ["", "Ужасно", "Плохо", "Норм", "Хорошо", "Отлично"];

const PURCHASABLE_ITEMS = [
  { icon: "📚", name: "Библиотека на 100 книг", price: 75_000 },
  { icon: "🎓", name: "Курс обучения", price: 120_000 },
  { icon: "🎮", name: "Игровая консоль + игры", price: 150_000 },
  { icon: "👔", name: "Полный гардероб", price: 200_000 },
  { icon: "📱", name: "iPhone", price: 300_000 },
  { icon: "💻", name: "Новый ноутбук", price: 350_000 },
  { icon: "🏋️", name: "Абонемент в зал ×12 мес", price: 420_000 },
  { icon: "🌴", name: "Отпуск на море", price: 500_000 },
  { icon: "🏠", name: "Ремонт комнаты", price: 600_000 },
  { icon: "🚗", name: "Первый взнос на авто", price: 800_000 },
];

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(amount) + " ₸";
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ₸`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K ₸`;
  return `${amount} ₸`;
}

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-slate-400">
          {p.dataKey === "count" ? "Эпизодов" : "Потрачено"}:{" "}
          <span className="text-white font-medium">
            {p.dataKey === "amount" ? `${p.value.toLocaleString("ru-RU")} ₸` : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function CustomLineTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-slate-400">
          {p.dataKey === "before" ? "До" : "После"}:{" "}
          <span className="text-white font-medium">{MOOD_LABELS[p.value] || p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ── Tab Button ── */
function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? "bg-accent/10 text-accent border border-accent/30"
          : "text-slate-400 hover:text-white hover:bg-dark-lighter border border-transparent"
      }`}
    >
      {label}
    </button>
  );
}

/* ── Financial Summary Cards ── */
function SummaryCards({ totalLost, totalSaved, monthlySpent, avgPerEpisode }: { totalLost: number; totalSaved: number; monthlySpent: number; avgPerEpisode: number }) {
  const cards = [
    { label: "Всего проиграно", value: formatMoney(totalLost), color: "text-red-400", bg: "bg-red-400/10", icon: "📉" },
    { label: "Сэкономлено", value: formatMoney(totalSaved), color: "text-green-400", bg: "bg-green-400/10", icon: "💚" },
    { label: "Расход за месяц", value: formatMoney(monthlySpent), color: "text-yellow-400", bg: "bg-yellow-400/10", icon: "📊" },
    { label: "Среднее за эпизод", value: formatMoney(avgPerEpisode), color: "text-slate-300", bg: "bg-slate-400/10", icon: "📋" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="!p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center text-sm`}>{c.icon}</div>
          </div>
          <p className={`text-lg sm:text-xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-xs text-slate-500 mt-1">{c.label}</p>
        </Card>
      ))}
    </div>
  );
}

/* ── What Could You Buy ── */
function WhatCouldYouBuy({ totalLost }: { totalLost: number }) {
  const affordable = PURCHASABLE_ITEMS.filter((item) => totalLost >= item.price);
  if (affordable.length === 0) return null;
  const maxCount = Math.max(...affordable.map((i) => Math.floor(totalLost / i.price)));

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-1">Что можно было бы купить</h2>
      <p className="text-sm text-slate-500 mb-4">На сумму {formatMoney(totalLost)} можно было приобрести:</p>
      <div className="space-y-3">
        {affordable.map((item) => {
          const count = Math.floor(totalLost / item.price);
          const barPct = (count / maxCount) * 100;
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-xl shrink-0 w-8 text-center">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300 truncate">{item.name}</span>
                  <span className="text-sm text-white font-medium shrink-0 ml-2">×{count}</span>
                </div>
                <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                  <div className="h-full bg-accent/60 rounded-full transition-all duration-700" style={{ width: `${barPct}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{formatCompact(item.price)} за штуку</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Savings Projection ── */
function SavingsProjection({ avgMonthlySpend }: { avgMonthlySpend: number }) {
  const [months, setMonths] = useState(6);
  const projected = avgMonthlySpend * months;
  const milestones = PURCHASABLE_ITEMS.filter((item) => item.price <= projected).sort((a, b) => b.price - a.price);

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-1">Прогноз накоплений</h2>
      <p className="text-sm text-slate-500 mb-4">Если не играть, сколько вы сэкономите</p>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-slate-400">Период без игры</label>
          <span className="text-sm font-medium text-accent">
            {months} {months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}
          </span>
        </div>
        <input
          type="range" min={1} max={24} value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full h-2 bg-dark rounded-full appearance-none cursor-pointer accent-accent
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,197,94,0.4)]"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>1 мес</span><span>12 мес</span><span>24 мес</span>
        </div>
      </div>
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-4">
        <p className="text-sm text-slate-400">Вы сэкономите</p>
        <p className="text-2xl font-bold text-accent">{formatMoney(projected)}</p>
        <p className="text-xs text-slate-500 mt-1">При среднем расходе {formatMoney(avgMonthlySpend)}/мес на игру</p>
      </div>
      {milestones.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">На эти деньги можно:</p>
          <div className="flex flex-wrap gap-2">
            {milestones.slice(0, 5).map((item) => (
              <span key={item.name} className="inline-flex items-center gap-1.5 bg-dark-lighter px-3 py-1.5 rounded-full text-xs text-slate-300">
                <span>{item.icon}</span>{item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── Monthly Chart ── */
function MonthlyChart({ monthlyBreakdown }: { monthlyBreakdown: MonthlyBreakdown[] }) {
  if (!monthlyBreakdown || monthlyBreakdown.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-white mb-1">Расходы по месяцам</h2>
        <p className="text-sm text-slate-500 text-center py-8">Нет данных</p>
      </Card>
    );
  }
  const maxAmount = Math.max(...monthlyBreakdown.map((m) => m.amount), 1);
  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-1">Расходы по месяцам</h2>
      <p className="text-sm text-slate-500 mb-4">Последние 6 месяцев</p>
      <div className="flex items-end gap-2 sm:gap-3 h-40">
        {monthlyBreakdown.map((m) => (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className="text-xs text-slate-400 font-medium">{m.amount > 0 ? formatCompact(m.amount) : "—"}</span>
            <div
              className={`w-full rounded-t-md transition-all duration-700 ${m.amount > 0 ? "bg-red-400/70" : "bg-dark-lighter"}`}
              style={{ height: m.amount > 0 ? `${Math.max((m.amount / maxAmount) * 100, 8)}%` : "4px" }}
            />
            <span className="text-xs text-slate-500">{m.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Daily Heatmap ── */
function DailyHeatmap({ dailyActivity }: { dailyActivity: Array<{ date: string; fullDate?: string; amount: number }> }) {
  const last30 = dailyActivity.slice(-30);
  const maxAmount = Math.max(...last30.map((d) => d.amount), 1);
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);

  function getColor(amount: number): string {
    if (amount === 0) return "bg-green-500/20";
    const ratio = amount / maxAmount;
    if (ratio < 0.33) return "bg-yellow-500/40";
    if (ratio < 0.66) return "bg-orange-500/50";
    return "bg-red-500/60";
  }
  function getBorder(amount: number): string {
    if (amount === 0) return "border-green-500/10";
    const ratio = amount / maxAmount;
    if (ratio < 0.33) return "border-yellow-500/20";
    if (ratio < 0.66) return "border-orange-500/20";
    return "border-red-500/30";
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-1">Тепловая карта</h2>
      <p className="text-sm text-slate-500 mb-4">Расходы за последние 30 дней</p>
      <div className="relative">
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
          {last30.map((day, i) => (
            <div
              key={day.fullDate || i}
              className={`aspect-square rounded-md border ${getColor(day.amount)} ${getBorder(day.amount)} cursor-pointer transition-transform hover:scale-110`}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const parentRect = e.currentTarget.closest(".relative")!.getBoundingClientRect();
                setTooltip({ index: i, x: rect.left - parentRect.left + rect.width / 2, y: rect.top - parentRect.top - 8 });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </div>
        {tooltip !== null && last30[tooltip.index] && (
          <div
            className="absolute z-10 bg-dark-lighter border border-dark-border rounded-lg px-3 py-2 text-xs pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p className="text-white font-medium">{last30[tooltip.index].date}</p>
            <p className="text-slate-400">
              {last30[tooltip.index].amount > 0 ? formatMoney(last30[tooltip.index].amount) : "Без расходов ✓"}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
        <span>Меньше</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/10" />
          <div className="w-4 h-4 rounded bg-yellow-500/40 border border-yellow-500/20" />
          <div className="w-4 h-4 rounded bg-orange-500/50 border border-orange-500/20" />
          <div className="w-4 h-4 rounded bg-red-500/60 border border-red-500/30" />
        </div>
        <span>Больше</span>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [achievements, setAchievements] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"charts" | "finances">("charts");

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      fetch("/api/achievements").then((r) => r.ok ? r.json() : null),
    ])
      .then(([analyticsData, achievementsData]) => {
        setData(analyticsData);
        setAchievements(achievementsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalLost = achievements?.totalLost ?? 0;
  const avgPerEpisode = achievements?.avgPerEpisode ?? 0;

  const avgMonthlySpend = useMemo(() => {
    if (!achievements?.monthlyBreakdown) return data?.monthlySpent ?? 0;
    const nonZero = achievements.monthlyBreakdown.filter((m) => m.amount > 0);
    if (nonZero.length > 0) return Math.round(nonZero.reduce((s, m) => s + m.amount, 0) / nonZero.length);
    return data?.monthlySpent ?? 0;
  }, [achievements, data]);

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

  const hasData = data.totalEpisodes > 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Аналитика</h1>
          <p className="text-slate-400 mt-1">Графики, инсайты и финансовый анализ</p>
        </div>
        <div className="flex gap-2">
          <TabButton active={tab === "charts"} label="Графики" onClick={() => setTab("charts")} />
          <TabButton active={tab === "finances"} label="Финансы" onClick={() => setTab("finances")} />
        </div>
      </div>

      {!hasData && tab === "charts" ? (
        <Card className="text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-white font-medium mb-1">Пока нет данных для анализа</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Начните вести дневник, чтобы здесь появились графики и инсайты
          </p>
        </Card>
      ) : tab === "charts" ? (
        <>
          {/* Daily Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">Активность по дням (30 дней)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyActivity} barGap={1}>
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="count" fill="#ef4444" radius={[2, 2, 0, 0]} name="Эпизоды" />
                    <Bar dataKey="amount" fill="#f97316" radius={[2, 2, 0, 0]} name="Сумма" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 justify-center text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> Эпизоды</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-sm inline-block" /> Сумма (₸)</span>
              </div>
            </Card>
          </motion.div>

          {/* Mood + Triggers */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="h-full">
                <h2 className="text-lg font-semibold text-white mb-4">Настроение: до vs после</h2>
                {data.moodTimeline.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.moodTimeline}>
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(v: number) => MOOD_LABELS[v] || ""} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                        <Tooltip content={<CustomLineTooltip />} />
                        <Line type="monotone" dataKey="before" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} name="До" />
                        <Line type="monotone" dataKey="after" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} name="После" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-8">Недостаточно данных</p>
                )}
                <div className="flex gap-4 mt-2 justify-center text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> До игры</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> После игры</span>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="h-full">
                <h2 className="text-lg font-semibold text-white mb-4">Триггеры</h2>
                {data.triggerData.length > 0 ? (
                  <div className="h-56 flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.triggerData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                            {data.triggerData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-2">
                      {data.triggerData.map((t, i) => (
                        <div key={t.name} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-slate-400">{t.name}</span>
                          <span className="text-white font-medium ml-auto">{t.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-8">Нет данных о триггерах</p>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Time of day Radar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">По времени суток</h2>
              <div className="h-72 max-w-md mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.timeBlocks} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#2a3040" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Insights */}
          {data.insights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <h2 className="text-lg font-semibold text-white mb-4">💡 Инсайты</h2>
                <div className="space-y-3">
                  {data.insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-dark-lighter rounded-lg"
                    >
                      <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-accent text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-slate-300 text-sm">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </>
      ) : (
        /* ═══ FINANCES TAB ═══ */
        <>
          <SummaryCards
            totalLost={totalLost}
            totalSaved={achievements?.totalSaved ?? 0}
            monthlySpent={data.monthlySpent ?? 0}
            avgPerEpisode={avgPerEpisode}
          />

          <WhatCouldYouBuy totalLost={totalLost} />

          <SavingsProjection avgMonthlySpend={avgMonthlySpend} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyChart monthlyBreakdown={achievements?.monthlyBreakdown ?? []} />
            <DailyHeatmap dailyActivity={data.dailyActivity ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
