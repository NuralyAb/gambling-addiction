"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HeroBackground = dynamic(
  () => import("@/components/HeroBackground"),
  { ssr: false }
);

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative max-w-6xl mx-auto px-4 pt-16 pb-28 sm:pt-24 sm:pb-36 text-center min-h-[85vh] flex flex-col items-center justify-center">
          <HeroBackground />
          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="relative z-10"
          >
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-accent text-sm font-medium mb-8 shadow-glow-sm"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Бесплатно и конфиденциально
            </motion.div>

            <motion.h1
              variants={item}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight"
            >
              AI-помощник в борьбе
              <br />
              <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
                с игровой зависимостью
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Мы используем искусственный интеллект, чтобы помочь вам распознать паттерны
              зависимого поведения, отслеживать прогресс и получать персональную поддержку —
              без осуждения, в безопасной среде.
            </motion.p>

            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="group inline-flex items-center px-8 py-3.5 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-hover transition-all duration-200 text-lg shadow-glow hover:shadow-glow-sm"
              >
                Начать бесплатно
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center px-8 py-3.5 rounded-xl border border-white/15 text-slate-300 font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-200 text-lg"
              >
                Как это работает
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4"
          >
            Как SafeBet AI помогает
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-slate-500 text-center max-w-xl mx-auto mb-16"
          >
            Персональные инструменты на базе ИИ для вашего пути к контролю
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={container}
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
          >
            <FeatureCard
              variants={item}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Анализ поведения"
              description="AI отслеживает паттерны вашей активности и предупреждает о рискованном поведении до того, как вы потеряете контроль."
            />
            <FeatureCard
              variants={item}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              title="Персональные рекомендации"
              description="Получайте индивидуальные советы, упражнения и стратегии, основанные на вашей уникальной ситуации и прогрессе."
            />
            <FeatureCard
              variants={item}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="Система поддержки"
              description="Подключите доверенное лицо, которое получит уведомление, если AI обнаружит высокий уровень риска. Вы не одиноки."
            />
          </motion.div>
        </section>

        {/* Stats / Trust */}
        <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="relative rounded-2xl sm:rounded-3xl p-8 md:p-12 text-center overflow-hidden glass border-white/10 shadow-card"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
            <div className="relative">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Безопасное пространство для перемен
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
                Игровая зависимость — это не слабость характера. Это состояние, с которым можно справиться
                при правильной поддержке. SafeBet AI создан, чтобы быть вашим тихим союзником.
              </p>
              <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                <div className="rounded-xl py-4 px-2 bg-white/[0.02] border border-white/5">
                  <div className="font-display text-2xl sm:text-3xl font-bold text-accent">24/7</div>
                  <div className="text-sm text-slate-500 mt-1">Доступность</div>
                </div>
                <div className="rounded-xl py-4 px-2 bg-white/[0.02] border border-white/5">
                  <div className="font-display text-2xl sm:text-3xl font-bold text-accent">100%</div>
                  <div className="text-sm text-slate-500 mt-1">Конфиденциально</div>
                </div>
                <div className="rounded-xl py-4 px-2 bg-white/[0.02] border border-white/5">
                  <div className="font-display text-2xl sm:text-3xl font-bold text-accent">0 &#8381;</div>
                  <div className="text-sm text-slate-500 mt-1">Бесплатно</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Первый шаг — самый важный
            </h2>
            <p className="text-slate-400 mb-10 max-w-md mx-auto">
              Регистрация займёт меньше минуты. Вся информация остаётся конфиденциальной.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3.5 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-hover transition-all duration-200 text-lg shadow-glow hover:shadow-glow-sm"
            >
              Создать аккаунт бесплатно
            </Link>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FeatureCard({
  variants,
  icon,
  title,
  description,
}: {
  variants?: object;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={variants}
      className="group relative rounded-2xl p-6 sm:p-8 glass border-white/10 hover:border-accent/30 transition-all duration-300 shadow-card hover:shadow-card-hover"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-5 group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <h3 className="font-display text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
