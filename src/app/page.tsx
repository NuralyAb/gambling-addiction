import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-muted border border-accent/20 rounded-full text-accent text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Бесплатно и конфиденциально
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            AI-помощник в борьбе
            <br />
            <span className="text-accent">с игровой зависимостью</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Мы используем искусственный интеллект, чтобы помочь вам распознать паттерны
            зависимого поведения, отслеживать прогресс и получать персональную поддержку —
            без осуждения, в безопасной среде.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3.5 bg-accent text-dark font-semibold rounded-lg hover:bg-accent-hover transition-colors text-lg"
            >
              Начать бесплатно
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center px-8 py-3.5 border border-dark-border text-slate-300 font-medium rounded-lg hover:bg-dark-lighter transition-colors text-lg"
            >
              Как это работает
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Как SafeBet AI помогает
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Анализ поведения"
              description="AI отслеживает паттерны вашей активности и предупреждает о рискованном поведении до того, как вы потеряете контроль."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              title="Персональные рекомендации"
              description="Получайте индивидуальные советы, упражнения и стратегии, основанные на вашей уникальной ситуации и прогрессе."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="Система поддержки"
              description="Подключите доверенное лицо, которое получит уведомление, если AI обнаружит высокий уровень риска. Вы не одиноки."
            />
          </div>
        </section>

        {/* Stats / Trust */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Безопасное пространство для перемен
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8">
              Игровая зависимость — это не слабость характера. Это состояние, с которым можно справиться
              при правильной поддержке. SafeBet AI создан, чтобы быть вашим тихим союзником.
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-sm text-slate-500 mt-1">Доступность</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">100%</div>
                <div className="text-sm text-slate-500 mt-1">Конфиденциально</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent">0 &#8381;</div>
                <div className="text-sm text-slate-500 mt-1">Бесплатно</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Первый шаг — самый важный
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Регистрация займёт меньше минуты. Вся информация остаётся конфиденциальной.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3.5 bg-accent text-dark font-semibold rounded-lg hover:bg-accent-hover transition-colors text-lg"
          >
            Создать аккаунт бесплатно
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-accent/30 transition-colors">
      <div className="w-12 h-12 bg-accent-muted rounded-lg flex items-center justify-center text-accent mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
