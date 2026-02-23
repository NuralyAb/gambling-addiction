"use client";

import { useEffect, useState } from "react";
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

// ── Types ──

interface AnalyticsData {
  dailyActivity: Array<{ date: string; count: number; amount: number }>;
  moodTimeline: Array<{ date: string; before: number; after: number }>;
  triggerData: Array<{ name: string; value: number }>;
  timeBlocks: Array<{ name: string; value: number }>;
  insights: string[];
  monthlySpent: number;
  totalEpisodes: number;
}

// ── Constants ──

const PIE_COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

const COST_COMPARISONS = [
  { amount: 5000, label: "Месяц подписки на онлайн-кинотеатр", emoji: "\u{1F3AC}" },
  { amount: 15000, label: "Абонемент в спортзал на месяц", emoji: "\u{1F3CB}" },
  { amount: 30000, label: "Курс онлайн-обучения", emoji: "\u{1F4DA}" },
  { amount: 50000, label: "Авиабилет в Турцию", emoji: "\u{2708}\u{FE0F}" },
  { amount: 80000, label: "Новый смартфон", emoji: "\u{1F4F1}" },
  { amount: 150000, label: "Отпуск на двоих на неделю", emoji: "\u{1F3D6}\u{FE0F}" },
  { amount: 300000, label: "Первый взнос за автомобиль", emoji: "\u{1F697}" },
  { amount: 500000, label: "Ремонт в комнате", emoji: "\u{1F3E0}" },
];

const MOOD_LABELS = ["", "Ужасно", "Плохо", "Норм", "Хорошо", "Отлично"];

// ── Custom Tooltip ──

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-slate-400">
          {p.dataKey === "count" ? "Эпизодов" : "Потрачено"}:{" "}
          <span className="text-white font-medium">
            {p.dataKey === "amount" ? `${p.value.toLocaleString("ru-RU")} \u20BD` : p.value}
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

// ── Page ──

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
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
    return <p className="text-slate-400 text-center py-16">Ошибка загрузки данных</p>;
  }

  const hasData = data.totalEpisodes > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Аналитика</h1>
        <p className="text-slate-400 mt-1">Графики и инсайты на основе вашего дневника</p>
      </div>

      {!hasData ? (
        <Card className="text-center py-16">
          <p className="text-4xl mb-3">{"\u{1F4CA}"}</p>
          <p className="text-white font-medium mb-1">Пока нет данных для анализа</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Начните вести дневник, чтобы здесь появились графики и инсайты
          </p>
        </Card>
      ) : (
        <>
          {/* Daily Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">Активность по дням (30 дней)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyActivity} barGap={1}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="count" fill="#ef4444" radius={[2, 2, 0, 0]} name="Эпизоды" />
                    <Bar dataKey="amount" fill="#f97316" radius={[2, 2, 0, 0]} name="Сумма" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 justify-center text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> Эпизоды
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-orange-500 rounded-sm inline-block" /> Сумма (\u20BD)
                </span>
              </div>
            </Card>
          </motion.div>

          {/* Mood + Triggers row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Mood Before vs After */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="h-full">
                <h2 className="text-lg font-semibold text-white mb-4">Настроение: до vs после</h2>
                {data.moodTimeline.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.moodTimeline}>
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[1, 5]}
                          ticks={[1, 2, 3, 4, 5]}
                          tickFormatter={(v: number) => MOOD_LABELS[v] || ""}
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={55}
                        />
                        <Tooltip content={<CustomLineTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="before"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#3b82f6" }}
                          name="До"
                        />
                        <Line
                          type="monotone"
                          dataKey="after"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#ef4444" }}
                          name="После"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-8">Недостаточно данных</p>
                )}
                <div className="flex gap-4 mt-2 justify-center text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> До игры
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500 rounded-sm inline-block" /> После игры
                  </span>
                </div>
              </Card>
            </motion.div>

            {/* Triggers Donut */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="h-full">
                <h2 className="text-lg font-semibold text-white mb-4">Триггеры</h2>
                {data.triggerData.length > 0 ? (
                  <div className="h-56 flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.triggerData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
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
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
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
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Insights */}
          {data.insights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <h2 className="text-lg font-semibold text-white mb-4">
                  {"\u{1F4A1}"} Инсайты
                </h2>
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

          {/* Cost Calculator */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <h2 className="text-lg font-semibold text-white mb-2">
                {"\u{1F4B0}"} Калькулятор стоимости
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                За этот месяц потрачено на игру:{" "}
                <span className="text-red-400 font-bold text-base">
                  {data.monthlySpent.toLocaleString("ru-RU")} {"\u20BD"}
                </span>
              </p>

              {data.monthlySpent > 0 ? (
                <div className="space-y-2">
                  {COST_COMPARISONS.filter((c) => c.amount <= data.monthlySpent * 1.5).map(
                    (item) => {
                      const canAfford = data.monthlySpent >= item.amount;
                      return (
                        <div
                          key={item.label}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            canAfford
                              ? "bg-red-500/5 border-red-500/20"
                              : "bg-dark-lighter border-dark-border"
                          }`}
                        >
                          <span className="text-xl">{item.emoji}</span>
                          <div className="flex-1">
                            <span className="text-sm text-slate-300">{item.label}</span>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              canAfford ? "text-red-400" : "text-slate-500"
                            }`}
                          >
                            {item.amount.toLocaleString("ru-RU")} {"\u20BD"}
                          </span>
                          {canAfford && (
                            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                              Хватило бы
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-accent font-medium">
                    {"\u{2728}"} За этот месяц вы ничего не потратили на игру!
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Продолжайте в том же духе</p>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
