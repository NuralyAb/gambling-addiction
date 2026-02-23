"use client";

import Card from "@/components/ui/Card";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.4, ease: "easeOut" },
  }),
};

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <>{count}{suffix}</>;
}

const aiModules = [
  {
    title: "Локальная нейросеть",
    tech: "brain.js",
    description: "Предсказание рисков рецидива на основе поведенческих паттернов",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    color: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/30",
    accentColor: "text-emerald-400",
    bgGlow: "bg-emerald-500/10",
  },
  {
    title: "NLP-анализ настроения",
    tech: "sentiment (AFINN-165)",
    description: "Анализ эмоционального состояния через текст дневника",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/30",
    accentColor: "text-blue-400",
    bgGlow: "bg-blue-500/10",
  },
  {
    title: "Детектор аномалий",
    tech: "Z-score алгоритм",
    description: "Выявление необычных паттернов в расходах и частоте игры",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/30",
    accentColor: "text-amber-400",
    bgGlow: "bg-amber-500/10",
  },
  {
    title: "AI-чат поддержка",
    tech: "OpenAI GPT-4o",
    description: "Эмпатичная психологическая поддержка в реальном времени",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    color: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/30",
    accentColor: "text-purple-400",
    bgGlow: "bg-purple-500/10",
  },
];

const neuralFeatures = [
  { name: "Частота эпизодов", icon: "📊" },
  { name: "Паттерны расходов", icon: "💰" },
  { name: "Тренды настроения", icon: "😔" },
  { name: "Временные паттерны", icon: "🕐" },
  { name: "Разнообразие триггеров", icon: "⚡" },
  { name: "Длина серии воздержания", icon: "📈" },
];

const techStack = [
  { tech: "brain.js", purpose: "Нейросеть для предсказания рисков", independent: true },
  { tech: "sentiment (AFINN-165)", purpose: "NLP-анализ текста дневника", independent: true },
  { tech: "Z-score алгоритм", purpose: "Детектор аномалий", independent: true },
  { tech: "OpenAI GPT-4o", purpose: "AI-чат поддержка", independent: false },
];

export default function AboutAIPage() {
  return (
    <main className="min-h-screen bg-dark">
      {/* Back Link */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-accent transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться на главную
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-muted border border-accent/20 rounded-full text-accent text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Для жюри и экспертов
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          AI-технологии{" "}
          <span className="text-accent">SafeBet</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Наша платформа использует <span className="text-slate-200 font-medium">4 независимых AI-модуля</span> для
          комплексного анализа поведения, предсказания рисков и персонализированной поддержки
          людей с игровой зависимостью. <span className="text-accent font-medium">3 из 4 модулей работают полностью
          локально</span>, без внешних API-вызовов.
        </motion.p>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { value: 4, label: "AI-модуля", suffix: "" },
            { value: 3, label: "Независимых", suffix: "" },
            { value: 6, label: "Входных фичей", suffix: "" },
            { value: 0, label: "Внешних API*", suffix: "" },
          ].map((stat, i) => (
            <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-4">
              <div className="text-2xl md:text-3xl font-bold text-accent">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
        <motion.p
          className="text-xs text-slate-600 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          * Для нейросети, NLP и детектора аномалий — 0 внешних API-вызовов
        </motion.p>
      </section>

      {/* Section 2: Architecture Overview */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white mb-4">
            Архитектура AI
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 max-w-2xl mx-auto">
            Четыре специализированных модуля работают совместно, обеспечивая многоуровневый
            анализ и поддержку пользователя
          </motion.p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {aiModules.map((mod, i) => (
            <motion.div key={i} variants={scaleIn} custom={i}>
              <Card className={`relative overflow-hidden border ${mod.borderColor} hover:border-opacity-60 transition-all duration-300 group`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 ${mod.bgGlow} rounded-xl flex items-center justify-center ${mod.accentColor} shrink-0`}>
                      {mod.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{mod.title}</h3>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono ${mod.bgGlow} ${mod.accentColor} mb-2`}>
                        {mod.tech}
                      </span>
                      <p className="text-slate-400 text-sm leading-relaxed">{mod.description}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Connection diagram */}
        <motion.div
          className="mt-10 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8 w-full max-w-2xl">
            <p className="text-center text-sm text-slate-500 mb-4 uppercase tracking-wider font-medium">Поток данных</p>
            <div className="flex flex-col items-center gap-3">
              <div className="px-4 py-2 bg-slate-700/50 rounded-lg text-slate-300 text-sm font-medium w-full text-center">
                Данные пользователя (эпизоды, дневник, поведение)
              </div>
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium text-center">brain.js</div>
                <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-medium text-center">sentiment</div>
                <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-medium text-center">Z-score</div>
                <div className="px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 text-xs font-medium text-center">GPT-4o</div>
              </div>
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <div className="px-4 py-2 bg-accent-muted border border-accent/20 rounded-lg text-accent text-sm font-medium w-full text-center">
                Персонализированная поддержка и раннее предупреждение
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 3: Independent Neural Network (EMPHASIZED) */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-4">
            <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              Ключевая технология — Независимая модель
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Независимая AI-модель
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Нейронная сеть, обученная на поведенческих признаках — работает{" "}
            <span className="text-accent font-semibold">полностью на сервере</span>,
            без каких-либо внешних API-вызовов
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Architecture diagram */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-emerald-500/20 h-full">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Архитектура нейросети
              </h3>

              {/* Feature inputs */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Входные признаки (Features)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {neuralFeatures.map((f, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-dark-lighter rounded-lg text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * i }}
                      >
                        <span className="text-base">{f.icon}</span>
                        <span className="text-slate-300 text-xs">{f.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>

                {/* Neural network block */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                    <span className="text-emerald-400 font-bold">brain.js Neural Network</span>
                  </div>
                  <p className="text-emerald-400/70 text-xs">Многослойный перцептрон · Обучение на серверной стороне</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center py-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* Output */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-lighter rounded-xl p-4 text-center border border-dark-border">
                    <div className="text-2xl font-bold text-accent mb-1">0–100</div>
                    <div className="text-xs text-slate-500">Вероятность риска</div>
                  </div>
                  <div className="bg-dark-lighter rounded-xl p-4 text-center border border-dark-border">
                    <div className="text-2xl font-bold text-accent mb-1">0–1</div>
                    <div className="text-xs text-slate-500">Коэффициент уверенности</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right: Technical details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <Card className="border-emerald-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Почему это важно
              </h3>
              <ul className="space-y-3">
                {[
                  { text: "Полная независимость — нейросеть работает в Node.js на сервере", accent: true },
                  { text: "Нулевые внешние API-вызовы для предсказания рисков", accent: true },
                  { text: "Обучение на поведенческих данных конкретного пользователя", accent: false },
                  { text: "Быстрый инференс — результат за миллисекунды", accent: false },
                  { text: "Данные никогда не покидают сервер", accent: true },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.accent ? "bg-emerald-500/20 text-emerald-400" : "bg-dark-lighter text-slate-400"}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className={`text-sm ${item.accent ? "text-slate-200" : "text-slate-400"}`}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border-emerald-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Технические детали
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-dark-border">
                  <span className="text-sm text-slate-400">Библиотека</span>
                  <span className="text-sm text-emerald-400 font-mono">brain.js</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dark-border">
                  <span className="text-sm text-slate-400">Тип сети</span>
                  <span className="text-sm text-slate-200">Многослойный перцептрон</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dark-border">
                  <span className="text-sm text-slate-400">Среда выполнения</span>
                  <span className="text-sm text-slate-200">Node.js (серверная)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dark-border">
                  <span className="text-sm text-slate-400">Входные фичи</span>
                  <span className="text-sm text-slate-200">6 поведенческих признаков</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-dark-border">
                  <span className="text-sm text-slate-400">Выходные данные</span>
                  <span className="text-sm text-slate-200">Вероятность (0–100) + уверенность</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400">Внешние API</span>
                  <span className="text-sm text-emerald-400 font-bold">Нет (0 вызовов)</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Section 4: NLP Analysis */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            NLP-анализ текста
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Локальный анализ эмоционального состояния пользователя через текст дневника
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
          >
            <Card className="border-blue-500/20 h-full">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Лексикон AFINN-165</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Используем словарь AFINN-165 с оценками тональности слов от -5 до +5.
                Каждое слово в дневнике анализируется и получает эмоциональный вес.
                Работает <span className="text-blue-400 font-medium">полностью локально</span> — без API.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-blue-500/20 h-full">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Тренды настроения</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Система отслеживает динамику эмоционального состояния со временем.
                Строится график тональности записей, позволяющий увидеть
                <span className="text-blue-400 font-medium"> паттерны ухудшения настроения</span> до рецидива.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-blue-500/20 h-full">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Раннее предупреждение</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                При обнаружении устойчивого снижения тональности записей система генерирует
                <span className="text-blue-400 font-medium"> раннее предупреждение</span>. Это позволяет
                выявить эмоциональное ухудшение ещё до того, как оно перерастёт в рецидив.
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Demo of sentiment analysis */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blue-500/20">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-medium">Пример анализа</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-2">Запись в дневнике:</p>
                <div className="bg-dark-lighter rounded-lg p-4 text-sm text-slate-300 italic leading-relaxed border border-dark-border">
                  &ldquo;Сегодня был тяжёлый день. Чувствую сильное желание играть.
                  Но я вспомнил о своих целях и решил записать свои мысли вместо этого.&rdquo;
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Результат NLP-анализа:</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Тональность</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-dark-lighter rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-amber-500 rounded-full" />
                      </div>
                      <span className="text-amber-400 text-sm font-mono">-2</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Позитивные слова</span>
                    <span className="text-emerald-400 text-sm font-mono">цели, решил</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Негативные слова</span>
                    <span className="text-red-400 text-sm font-mono">тяжёлый, желание</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Оценка</span>
                    <span className="text-amber-400 text-sm font-medium">Смешанные эмоции</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Section 5: Anomaly Detection */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Детектор аномалий
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Статистический метод Z-score для обнаружения необычных паттернов поведения
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-amber-500/20 h-full">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Как работает Z-score
              </h3>

              <div className="space-y-4">
                <div className="bg-dark-lighter rounded-xl p-4 border border-dark-border">
                  <p className="text-amber-400 font-mono text-sm mb-2">Z = (X - μ) / σ</p>
                  <p className="text-slate-400 text-xs">
                    где X — текущее значение, μ — среднее, σ — стандартное отклонение
                  </p>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed">
                  Алгоритм вычисляет, насколько текущее поведение отклоняется от нормальных паттернов
                  пользователя. Значение |Z| &gt; 2 считается аномальным и вызывает автоматический алерт.
                </p>

                <div className="space-y-2">
                  {[
                    { label: "Расходы на игру", desc: "Необычно высокие суммы" },
                    { label: "Частота сессий", desc: "Резкое увеличение количества" },
                    { label: "Время суток", desc: "Игра в нетипичные часы" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-dark-lighter rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <div>
                        <span className="text-slate-200 text-sm font-medium">{item.label}</span>
                        <span className="text-slate-500 text-sm"> — {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-amber-500/20 h-full">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Визуализация обнаружения
              </h3>

              {/* Visual Z-score demo */}
              <div className="space-y-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Пример: расходы за неделю</p>
                <div className="space-y-2">
                  {[
                    { day: "Пн", value: 500, z: 0.1, anomaly: false },
                    { day: "Вт", value: 450, z: -0.2, anomaly: false },
                    { day: "Ср", value: 600, z: 0.5, anomaly: false },
                    { day: "Чт", value: 520, z: 0.2, anomaly: false },
                    { day: "Пт", value: 2800, z: 3.1, anomaly: true },
                    { day: "Сб", value: 480, z: -0.1, anomaly: false },
                    { day: "Вс", value: 550, z: 0.3, anomaly: false },
                  ].map((d, i) => (
                    <motion.div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${d.anomaly ? "bg-red-500/10 border border-red-500/30" : "bg-dark-lighter"}`}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <span className="text-slate-500 text-xs w-6">{d.day}</span>
                      <div className="flex-1 h-2 bg-dark rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${d.anomaly ? "bg-red-500" : "bg-amber-500/60"}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.min((d.value / 3000) * 100, 100)}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 * i, duration: 0.5 }}
                        />
                      </div>
                      <span className={`text-xs font-mono w-14 text-right ${d.anomaly ? "text-red-400" : "text-slate-400"}`}>
                        {d.value} ₸
                      </span>
                      <span className={`text-xs font-mono w-12 text-right ${d.anomaly ? "text-red-400 font-bold" : "text-slate-600"}`}>
                        Z={d.z}
                      </span>
                      {d.anomaly && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                          АНОМАЛИЯ
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="bg-dark-lighter rounded-lg p-3 border border-dark-border">
                  <p className="text-xs text-slate-400">
                    <span className="text-amber-400 font-medium">Автоматическая реакция:</span> при обнаружении аномалии
                    система отправляет уведомление пользователю и доверенному лицу, а также повышает уровень риска.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Section 6: AI Chat Support */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            AI-чат поддержка
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Эмпатичный AI-ассистент на базе GPT-4o для психологической поддержки 24/7
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-purple-500/20 h-full">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                Возможности чата
              </h3>
              <ul className="space-y-3">
                {[
                  { title: "Мотивационное интервьюирование", desc: "Системный промпт настроен на техники MI для мягкой поддержки" },
                  { title: "Контекстуальная беседа", desc: "Сохраняется история чата для понимания ситуации пользователя" },
                  { title: "Кризисное реагирование", desc: "Распознаёт сигналы кризиса и предлагает немедленную помощь" },
                  { title: "Персонализация", desc: "Учитывает прогресс и историю пользователя для релевантных советов" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-purple-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <span className="text-slate-200 text-sm font-medium">{item.title}</span>
                      <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-purple-500/20 h-full">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Безопасность данных
              </h3>
              <div className="space-y-3">
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-slate-200 text-sm font-medium">Анонимизация</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Перед отправкой в OpenAI все персональные данные удаляются.
                    Имена, email и другие идентификаторы не передаются во внешние сервисы.
                  </p>
                </div>
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-slate-200 text-sm font-medium">Ограниченный контекст</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    В GPT-4o передаётся только текст беседы — без аналитических данных,
                    финансовой информации или других чувствительных метрик.
                  </p>
                </div>
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-slate-200 text-sm font-medium">Системный промпт</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Специализированный системный промпт обучает модель действовать как
                    сертифицированный консультант по зависимостям, используя методы мотивационного интервьюирования.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Section 7: AI Ethics */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Этика AI
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Ответственный подход к использованию AI в чувствительной области здравоохранения
          </motion.p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              ),
              title: "Минимизация данных",
              desc: "Собираем только те данные, которые необходимы для работы AI. Никаких избыточных метрик.",
              accent: "accent",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ),
              title: "Данные не продаются",
              desc: "Данные пользователей никогда не продаются третьим лицам. Это фундаментальный принцип.",
              accent: "red-400",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              ),
              title: "Человек в контуре",
              desc: "Доверенное лицо подключается как дополнительный уровень поддержки. AI не заменяет человека.",
              accent: "blue-400",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: "Прозрачность",
              desc: "Эта страница — доказательство нашей прозрачности. Мы открыто объясняем все AI-технологии.",
              accent: "amber-400",
            },
          ].map((item, i) => (
            <motion.div key={i} variants={scaleIn} custom={i}>
              <Card className="h-full hover:border-accent/20 transition-colors">
                <div className={`w-12 h-12 bg-${item.accent === "accent" ? "accent-muted" : `${item.accent.split("-")[0]}-500/10`} rounded-xl flex items-center justify-center text-${item.accent} mb-4`}>
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Section 8: Tech Stack Table */}
      <section className="max-w-6xl mx-auto px-4 py-16 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Технический стек
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Полный обзор AI-технологий, используемых в SafeBet AI
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left text-xs text-slate-500 uppercase tracking-wider font-medium px-6 py-4">Технология</th>
                    <th className="text-left text-xs text-slate-500 uppercase tracking-wider font-medium px-6 py-4">Назначение</th>
                    <th className="text-center text-xs text-slate-500 uppercase tracking-wider font-medium px-6 py-4">Независимая?</th>
                  </tr>
                </thead>
                <tbody>
                  {techStack.map((row, i) => (
                    <motion.tr
                      key={i}
                      className="border-b border-dark-border last:border-0 hover:bg-dark-lighter/50 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <td className="px-6 py-4">
                        <span className="text-white font-medium text-sm">{row.tech}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-sm">{row.purpose}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.independent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Да
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-500/10 text-slate-400 rounded-full text-xs font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Внешний API
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Final note */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-accent/20 inline-block max-w-2xl">
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-accent-muted rounded-xl flex items-center justify-center text-accent shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Итого</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  SafeBet AI использует <span className="text-accent font-medium">3 полностью независимых AI-модуля</span> (brain.js,
                  sentiment, Z-score), работающих локально без внешних API, и <span className="text-purple-400 font-medium">1 внешний
                  модуль</span> (GPT-4o) для чат-поддержки с полной анонимизацией данных.
                  Это обеспечивает баланс между мощностью AI и конфиденциальностью пользователей.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>
    </main>
  );
}
