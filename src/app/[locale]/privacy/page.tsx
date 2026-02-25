"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

const sections = [
  { id: "data-collection", title: "Какие данные мы собираем" },
  { id: "data-usage", title: "Как мы используем данные" },
  { id: "ai-processing", title: "AI и обработка данных" },
  { id: "data-storage", title: "Хранение данных" },
  { id: "retention", title: "Сроки хранения и логи" },
  { id: "user-rights", title: "Права пользователя" },
  { id: "trusted-person", title: "Доверенное лицо" },
  { id: "chrome-extension", title: "Chrome расширение" },
  { id: "contacts", title: "Контакты" },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-dark">
      <header className="border-b border-dark-border bg-dark/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-accent transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            На главную
          </Link>
          <div className="h-4 w-px bg-dark-border" />
          <span className="text-sm text-slate-500">Политика конфиденциальности</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-muted border border-accent/20 rounded-full text-accent text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Ваши данные под защитой
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Политика конфиденциальности
          </h1>
          <p className="text-slate-400 max-w-2xl">
            NoBet серьёзно относится к защите ваших персональных данных. В этом документе
            мы подробно объясняем, какие данные мы собираем, как их используем и как вы можете
            управлять своей информацией.
          </p>
          <p className="text-sm text-slate-500 mt-4">
            Последнее обновление: февраль 2026
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sticky sidebar — desktop only */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-24">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Содержание
              </p>
              <ul className="space-y-1">
                {sections.map(({ id, title }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
                        activeSection === id
                          ? "text-accent bg-accent-muted font-medium"
                          : "text-slate-400 hover:text-slate-200 hover:bg-dark-lighter"
                      }`}
                    >
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* 1. Какие данные мы собираем */}
            <section id="data-collection">
              <Card>
                <SectionHeading number={1} title="Какие данные мы собираем" />
                <p className="text-slate-400 mb-4">
                  Мы собираем только те данные, которые необходимы для работы платформы
                  и предоставления вам персонализированной поддержки.
                </p>
                <div className="space-y-4">
                  <DataCategory
                    title="Данные аккаунта"
                    items={[
                      "Email-адрес (для авторизации и связи)",
                      "Имя (для персонализации обращения)",
                      "Город (для локализации рекомендаций)",
                      "Телефон (опционально, для экстренной связи)",
                      "Telegram username (для уведомлений через бот)",
                    ]}
                  />
                  <DataCategory
                    title="Данные дневника"
                    items={[
                      "Записи о настроении (шкала и текстовые заметки)",
                      "Триггеры — ситуации, провоцирующие желание играть",
                      "Суммы проигрышей/выигрышей (если вы решите их указать)",
                      "Дата и время каждой записи",
                    ]}
                  />
                  <DataCategory
                    title="Результаты тестов"
                    items={[
                      "Ответы на тест PGSI (Problem Gambling Severity Index)",
                      "Итоговые баллы и уровень риска",
                      "История прохождения тестов",
                    ]}
                  />
                  <DataCategory
                    title="Данные Chrome расширения"
                    items={[
                      "Список заблокированных сайтов (настроенных вами)",
                      "События блокировки (дата, время, URL заблокированного сайта)",
                      "Количество попыток посещения заблокированных ресурсов",
                    ]}
                  />
                  <DataCategory
                    title="Сообщения чата"
                    items={[
                      "Текстовые сообщения, отправленные AI-ассистенту",
                      "Ответы AI (для улучшения качества рекомендаций)",
                    ]}
                  />
                </div>
              </Card>
            </section>

            {/* 2. Как мы используем данные */}
            <section id="data-usage">
              <Card>
                <SectionHeading number={2} title="Как мы используем данные" />
                <p className="text-slate-400 mb-4">
                  Ваши данные используются исключительно для предоставления вам качественной
                  поддержки в борьбе с игровой зависимостью.
                </p>
                <div className="space-y-4">
                  <UsageItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                    title="AI-анализ поведения"
                    description="Мы анализируем ваши записи дневника, результаты тестов и данные расширения, чтобы выявлять паттерны рискованного поведения и отслеживать динамику вашего состояния."
                  />
                  <UsageItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    }
                    title="Персональные рекомендации"
                    description="На основе анализа ваших данных AI генерирует индивидуальные советы, упражнения и стратегии преодоления зависимости, адаптированные под вашу ситуацию."
                  />
                  <UsageItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    }
                    title="Уведомления доверенному лицу"
                    description="Если вы подключили доверенное лицо и AI обнаруживает высокий уровень риска, система отправляет ограниченное уведомление — без раскрытия деталей ваших записей."
                  />
                  <UsageItem
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                    title="Мы НЕ используем ваши данные для"
                    description="Продажи третьим лицам, рекламных целей, формирования кредитных рейтингов или любых целей, не связанных с помощью в борьбе с игровой зависимостью."
                  />
                </div>
              </Card>
            </section>

            {/* 3. AI и обработка данных */}
            <section id="ai-processing">
              <Card>
                <SectionHeading number={3} title="AI и обработка данных" />
                <p className="text-slate-400 mb-4">
                  NoBet использует несколько уровней искусственного интеллекта для
                  предоставления максимально качественной поддержки.
                </p>
                <div className="space-y-4">
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center text-accent shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Локальные AI-модели</h4>
                        <p className="text-slate-400 text-sm">
                          Анализ поведения, расчёт уровня риска и генерация базовых рекомендаций
                          выполняются нашими собственными моделями на серверах платформы. Ваши
                          данные не покидают нашу инфраструктуру при этих операциях.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center text-accent shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">OpenAI (чат с AI-ассистентом)</h4>
                        <p className="text-slate-400 text-sm mb-3">
                          Для диалогового AI-ассистента мы используем API OpenAI. Перед отправкой запросов
                          в OpenAI применяется <span className="text-accent font-medium">анонимизация</span>:
                          идентифицирующие данные не передаются. OpenAI не использует данные запросов
                          через API для обучения моделей.
                        </p>
                        <div className="bg-dark-lighter rounded p-3 border border-dark-border">
                          <p className="text-slate-300 text-xs font-medium mb-2">Удаляемые поля перед отправкой в OpenAI:</p>
                          <ul className="text-slate-400 text-xs space-y-1">
                            <li>• user_id, email, имя, телефон — никогда не передаются</li>
                            <li>• В тексте сообщений: email, номера телефонов, адреса — маскируются регулярными выражениями</li>
                            <li>• В контекст попадает только: role (user/assistant) и обезличенный content</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center text-accent shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Принцип минимизации</h4>
                        <p className="text-slate-400 text-sm">
                          Мы передаём внешним сервисам только тот минимум информации, который
                          необходим для выполнения конкретного запроса. Все решения о действиях
                          (уведомления, рекомендации) принимаются на нашей стороне.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* 4. Хранение данных */}
            <section id="data-storage">
              <Card>
                <SectionHeading number={4} title="Хранение данных" />
                <p className="text-slate-400 mb-4">
                  Мы используем современные технологии для безопасного хранения ваших данных.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <StorageFeature
                    title="Supabase + PostgreSQL"
                    description="Все данные хранятся в облачной базе данных Supabase на основе PostgreSQL — одной из самых надёжных и проверенных СУБД."
                  />
                  <StorageFeature
                    title="Шифрование"
                    description="Данные шифруются при передаче (TLS/SSL) и при хранении. Пароли хешируются с использованием bcrypt и никогда не хранятся в открытом виде."
                  />
                  <StorageFeature
                    title="Row Level Security (RLS)"
                    description="Каждый пользователь имеет доступ только к своим данным. Политики безопасности на уровне строк базы данных гарантируют изоляцию данных."
                  />
                  <StorageFeature
                    title="Регулярные бэкапы"
                    description="Автоматическое резервное копирование базы данных обеспечивает сохранность ваших данных в случае технических сбоев."
                  />
                </div>
              </Card>
            </section>

            {/* 4a. Сроки хранения и логи */}
            <section id="retention">
              <Card>
                <SectionHeading number={5} title="Сроки хранения и логи" />
                <p className="text-slate-400 mb-4">
                  Политика хранения данных и логирования.
                </p>
                <div className="space-y-4">
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <h4 className="text-white font-medium text-sm mb-2">Сроки хранения данных</h4>
                    <ul className="text-slate-400 text-sm space-y-1.5">
                      <li>• <span className="text-slate-300">Профиль, дневник, чат, тесты:</span> пока действует аккаунт; при удалении — удаление в течение 30 дней</li>
                      <li>• <span className="text-slate-300">События блокировки (расширение):</span> 90 дней</li>
                      <li>• <span className="text-slate-300">Экспорты данных:</span> не храним — генерируются по запросу</li>
                    </ul>
                  </div>
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <h4 className="text-white font-medium text-sm mb-2">Политика хранения логов</h4>
                    <ul className="text-slate-400 text-sm space-y-1.5">
                      <li>• <span className="text-slate-300">Серверные логи (ошибки, запросы):</span> 30 дней</li>
                      <li>• <span className="text-slate-300">Логи аудита (действия админов):</span> 1 год</li>
                      <li>• Логи не содержат содержимого сообщений чата и записей дневника</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </section>

            {/* 6. Права пользователя */}
            <section id="user-rights">
              <Card>
                <SectionHeading number={6} title="Права пользователя" />
                <p className="text-slate-400 mb-4">
                  В соответствии с принципами GDPR и лучшими практиками защиты данных, вы имеете
                  полный контроль над своей информацией.
                </p>
                <div className="space-y-3">
                  <RightItem
                    title="Право на доступ"
                    description="Вы можете в любой момент просмотреть все данные, которые мы храним о вас, через личный кабинет."
                  />
                  <RightItem
                    title="Право на экспорт"
                    description="Вы можете экспортировать все свои данные (дневник, тесты, историю чата) в машиночитаемом формате."
                  />
                  <RightItem
                    title="Право на удаление"
                    description="Вы можете полностью удалить свой аккаунт и все связанные данные. Удаление необратимо и выполняется в течение 30 дней."
                  />
                  <RightItem
                    title="Право на исправление"
                    description="Вы можете отредактировать или дополнить свои персональные данные в настройках профиля."
                  />
                  <RightItem
                    title="Право на ограничение обработки"
                    description="Вы можете отключить AI-анализ или уведомления доверенного лица в любой момент через настройки."
                  />
                </div>
              </Card>
            </section>

            {/* 7. Доверенное лицо */}
            <section id="trusted-person">
              <Card>
                <SectionHeading number={7} title="Доверенное лицо" />
                <p className="text-slate-400 mb-6">
                  Функция доверенного лица позволяет подключить близкого человека, который будет
                  получать уведомления при обнаружении высокого уровня риска. Вот что доверенное лицо
                  может и не может видеть:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-dark rounded-lg p-4 border border-accent/20">
                    <h4 className="text-accent font-medium mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Что видит
                    </h4>
                    <ul className="space-y-2">
                      {[
                        "Общий уровень риска (низкий / средний / высокий)",
                        "Факт срабатывания тревоги",
                        "Ваше имя (которое вы указали при регистрации)",
                        "Общие рекомендации — как поддержать вас",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                          <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-dark rounded-lg p-4 border border-red-500/20">
                    <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Что НЕ видит
                    </h4>
                    <ul className="space-y-2">
                      {[
                        "Содержимое вашего дневника",
                        "Детали тестов и конкретные ответы",
                        "Историю сообщений с AI-ассистентом",
                        "Какие сайты вы пытались посетить",
                        "Суммы проигрышей/выигрышей",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                          <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </section>

            {/* 8. Chrome расширение */}
            <section id="chrome-extension">
              <Card>
                <SectionHeading number={8} title="Chrome расширение" />
                <p className="text-slate-400 mb-4">
                  Наше расширение для браузера Chrome помогает блокировать доступ к игорным сайтам.
                  Вот как оно работает с вашими данными:
                </p>
                <div className="space-y-3">
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <h4 className="text-white font-medium text-sm mb-2">Что собирает расширение</h4>
                    <ul className="space-y-1.5 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        URL-адреса заблокированных сайтов (только из вашего списка блокировки)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        Временные метки попыток посещения заблокированных ресурсов
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        Статистика блокировок (количество попыток за период)
                      </li>
                    </ul>
                  </div>
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <h4 className="text-white font-medium text-sm mb-2">Что НЕ собирает расширение</h4>
                    <ul className="space-y-1.5 text-sm text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        Историю просмотров (мы не видим, какие сайты вы посещаете)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        Содержимое веб-страниц
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        Пароли, данные форм или cookies
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        Данные других расширений
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-slate-500">
                    Расширение передаёт данные на сервер NoBet только при наличии активной
                    авторизации. Вы можете удалить расширение в любой момент — все локальные
                    данные будут удалены автоматически.
                  </p>
                </div>
              </Card>
            </section>

            {/* 9. Контакты */}
            <section id="contacts">
              <Card>
                <SectionHeading number={9} title="Контакты" />
                <p className="text-slate-400 mb-6">
                  Если у вас есть вопросы о политике конфиденциальности или вы хотите
                  воспользоваться своими правами, свяжитесь с нами:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center text-accent">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <a href="mailto:privacy@nobet.kz" className="text-accent hover:underline text-sm">
                          privacy@nobet.kz
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="bg-dark rounded-lg p-4 border border-dark-border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center text-accent">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Telegram</p>
                        <a href="https://t.me/nobet_support" className="text-accent hover:underline text-sm">
                          @nobet_support
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-accent-muted border border-accent/20 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <span className="text-accent font-medium">Горячая линия помощи:</span>{" "}
                    Если вам нужна срочная поддержка, позвоните{" "}
                    <a href="tel:88002000122" className="text-accent hover:underline font-medium">
                      8-800-2000-122
                    </a>{" "}
                    (бесплатно, круглосуточно по России).
                  </p>
                </div>
              </Card>
            </section>

            {/* Footer note */}
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">
                Данная политика конфиденциальности может обновляться. Мы уведомим вас
                о существенных изменениях по email.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-accent hover:underline text-sm mt-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-muted text-accent text-sm font-bold shrink-0">
        {number}
      </span>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
  );
}

function DataCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-dark rounded-lg p-4 border border-dark-border">
      <h4 className="text-white font-medium text-sm mb-2">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
            <span className="text-accent mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UsageItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-accent-muted rounded-lg flex items-center justify-center text-accent shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-medium mb-1">{title}</h4>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );
}

function StorageFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-dark rounded-lg p-4 border border-dark-border">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h4 className="text-white font-medium text-sm">{title}</h4>
      </div>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function RightItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-dark-lighter transition-colors">
      <div className="w-6 h-6 bg-accent-muted rounded flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h4 className="text-white font-medium text-sm">{title}</h4>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
