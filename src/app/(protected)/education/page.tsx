"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Quiz {
  question: string;
  options: string[];
  correct: number;
}

interface Lesson {
  id: string;
  icon: React.ReactNode;
  title: string;
  readingTime: number;
  content: React.ReactNode;
  quiz: Quiz[];
}

interface EducationProgress {
  completed: string[];
  quizAnswers: Record<string, number[]>;
}

function getProgress(): EducationProgress {
  if (typeof window === "undefined") return { completed: [], quizAnswers: {} };
  try {
    const raw = localStorage.getItem("education_progress");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: [], quizAnswers: {} };
}

function saveProgress(progress: EducationProgress) {
  localStorage.setItem("education_progress", JSON.stringify(progress));
}

function HouseEdgeCalculator() {
  const [bet, setBet] = useState(1000);
  const [times, setTimes] = useState(100);
  const [edge, setEdge] = useState(5);

  const totalBet = bet * times;
  const expectedLoss = Math.round(totalBet * (edge / 100));

  return (
    <div className="bg-dark rounded-lg p-4 mt-4 space-y-4">
      <p className="text-sm font-medium text-accent">Калькулятор: сколько вы потеряете?</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Ставка (₽)</label>
          <input
            type="number"
            value={bet}
            onChange={(e) => setBet(Math.max(0, Number(e.target.value)))}
            className="w-full bg-dark-lighter border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Кол-во ставок</label>
          <input
            type="number"
            value={times}
            onChange={(e) => setTimes(Math.max(1, Number(e.target.value)))}
            className="w-full bg-dark-lighter border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Преимущество казино (%)</label>
          <input
            type="number"
            value={edge}
            onChange={(e) => setEdge(Math.max(0.1, Math.min(100, Number(e.target.value))))}
            step={0.1}
            className="w-full bg-dark-lighter border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <p className="text-sm text-slate-300">
          Поставив <span className="text-white font-medium">{bet.toLocaleString("ru-RU")} ₽</span> × {times} раз
          = <span className="text-white font-medium">{totalBet.toLocaleString("ru-RU")} ₽</span> оборота
        </p>
        <p className="text-lg font-bold text-red-400 mt-1">
          Ожидаемый проигрыш: {expectedLoss.toLocaleString("ru-RU")} ₽
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Это математический факт, а не вопрос &laquo;удачи&raquo;
        </p>
      </div>
    </div>
  );
}

function StagesTimeline() {
  const stages = [
    { phase: "Фаза выигрыша", color: "bg-green-400", desc: "Первые победы, эйфория, ощущение контроля. «Я умею играть»" },
    { phase: "Фаза проигрыша", color: "bg-yellow-400", desc: "Погоня за отыгрышем, ложь близким, рост ставок" },
    { phase: "Фаза отчаяния", color: "bg-orange-400", desc: "Долги, кредиты, паника, изоляция, мысли «ещё одна ставка всё исправит»" },
    { phase: "Фаза безнадёжности", color: "bg-red-400", desc: "Депрессия, разрушенные отношения, суицидальные мысли. Дно." },
  ];

  return (
    <div className="mt-4 space-y-0">
      {stages.map((s, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${s.color} shrink-0`} />
            {i < stages.length - 1 && <div className="w-0.5 h-full bg-dark-border" />}
          </div>
          <div className="pb-6">
            <p className="text-sm font-medium text-white">{s.phase}</p>
            <p className="text-sm text-slate-400 mt-0.5">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const LESSONS: Lesson[] = [
  {
    id: "dopamine",
    icon: <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5" /></svg>,
    title: "Как работает дофаминовая ловушка",
    readingTime: 8,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          Дофамин — нейромедиатор, который отвечает за <span className="text-white font-medium">предвкушение награды</span>,
          а не за само удовольствие. Мозг выделяет дофамин не когда вы выигрываете, а когда
          вы <em>ожидаете</em> выигрыш.
        </p>
        <div className="bg-dark rounded-lg p-4">
          <p className="text-accent text-xs font-medium mb-2">ЦИКЛ ДОФАМИНОВОЙ ЛОВУШКИ</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
            <span className="bg-dark-lighter px-3 py-1.5 rounded-full border border-dark-border">Триггер</span>
            <svg className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span className="bg-dark-lighter px-3 py-1.5 rounded-full border border-dark-border">Всплеск</span>
            <svg className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span className="bg-dark-lighter px-3 py-1.5 rounded-full border border-dark-border">Ставка</span>
            <svg className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span className="bg-dark-lighter px-3 py-1.5 rounded-full border border-dark-border">Спад</span>
            <svg className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span className="bg-dark-lighter px-3 py-1.5 rounded-full border border-dark-border">Повтор</span>
          </div>
        </div>
        <p>
          <strong className="text-white">Переменное подкрепление</strong> — самый мощный механизм формирования привычки.
          Когда награда приходит непредсказуемо, дофаминовая система работает на максимуме.
          Это тот же механизм, что у крысы, нажимающей рычаг в экспериментах Скиннера.
        </p>
        <p>
          Со временем мозг адаптируется: требуется всё больше стимуляции для того же уровня возбуждения.
          Ставки растут, частота увеличивается, но удовлетворение уменьшается.
          Это <span className="text-white font-medium">толерантность</span> — такая же, как при наркотической зависимости.
        </p>
        <p>
          Хорошая новость: нейропластичность позволяет мозгу восстановиться. Через 90 дней без игры
          дофаминовые рецепторы начинают приходить в норму.
        </p>
      </div>
    ),
    quiz: [
      {
        question: "Когда мозг выделяет больше всего дофамина при игре?",
        options: ["В момент выигрыша", "В ожидании результата", "После проигрыша", "Во время подсчёта денег"],
        correct: 1,
      },
      {
        question: "Что такое переменное подкрепление?",
        options: [
          "Награда приходит каждый раз",
          "Награда приходит непредсказуемо",
          "Награда уменьшается со временем",
          "Награда зависит от навыка",
        ],
        correct: 1,
      },
      {
        question: "Через сколько дней без игры начинается восстановление дофаминовых рецепторов?",
        options: ["7 дней", "30 дней", "90 дней", "365 дней"],
        correct: 2,
      },
    ],
  },
  {
    id: "house-edge",
    icon: <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
    title: "Почему казино всегда выигрывает",
    readingTime: 7,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          Каждая азартная игра имеет встроенное <span className="text-white font-medium">математическое преимущество казино</span> (house edge).
          Это означает, что при достаточном количестве ставок казино <em>гарантированно</em> забирает часть ваших денег.
        </p>
        <div className="bg-dark rounded-lg p-4">
          <p className="text-accent text-xs font-medium mb-3">ПРЕИМУЩЕСТВО КАЗИНО ПО ИГРАМ</p>
          <div className="space-y-2">
            {[
              { game: "Слоты", edge: "2–15%", avg: "8%" },
              { game: "Рулетка (европейская)", edge: "2.7%", avg: "2.7%" },
              { game: "Рулетка (американская)", edge: "5.26%", avg: "5.26%" },
              { game: "Блэкджек", edge: "0.5–2%", avg: "1.5%" },
              { game: "Спортивные ставки", edge: "4–10%", avg: "7%" },
              { game: "Лотерея", edge: "40–50%", avg: "45%" },
            ].map((g) => (
              <div key={g.game} className="flex items-center justify-between">
                <span className="text-slate-400">{g.game}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-dark-lighter rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${parseFloat(g.avg) * 2}%` }}
                    />
                  </div>
                  <span className="text-xs text-red-400 w-14 text-right">{g.edge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p>
          <strong className="text-white">Ожидаемая стоимость (Expected Value)</strong> — это сколько вы в среднем
          выиграете или проиграете за ставку. При house edge 5% каждая ставка в 1000 ₽ «стоит» вам 50 ₽.
          Не за раз — в среднем. Но математика неумолима.
        </p>
        <p>
          <strong className="text-white">Закон больших чисел</strong>: чем больше вы играете, тем ближе ваш
          результат к математическому ожиданию. Короткие серии удач возможны, но в долгосрочной перспективе
          казино выигрывает ВСЕГДА.
        </p>
        <HouseEdgeCalculator />
      </div>
    ),
    quiz: [
      {
        question: "Что такое house edge (преимущество казино)?",
        options: [
          "Максимальная ставка в казино",
          "Встроенное математическое преимущество казино в каждой игре",
          "Разница между вашим и чужим выигрышем",
          "Комиссия за вывод денег",
        ],
        correct: 1,
      },
      {
        question: "У какой игры самое большое преимущество казино?",
        options: ["Блэкджек", "Рулетка", "Лотерея", "Слоты"],
        correct: 2,
      },
    ],
  },
  {
    id: "cognitive-biases",
    icon: <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>,
    title: "Когнитивные искажения игрока",
    readingTime: 10,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          Наш мозг систематически обманывает нас, заставляя верить, что мы можем контролировать случайность.
          Вот главные когнитивные ловушки:
        </p>
        {[
          {
            name: "Ошибка игрока (Gambler's Fallacy)",
            desc: "Вера, что после серии проигрышей «должен» быть выигрыш. На самом деле каждое событие независимо.",
            example: "«Красное выпало 5 раз подряд — значит, сейчас точно будет чёрное!» Нет. Вероятность по-прежнему ~48.6%.",
          },
          {
            name: "Иллюзия контроля",
            desc: "Убеждение, что ваши действия влияют на случайный результат.",
            example: "«Я сам выбрал числа в лотерее — это увеличивает шансы». Нет, шансы одинаковы для любой комбинации.",
          },
          {
            name: "Эффект «горячей руки» (Hot Hand Fallacy)",
            desc: "Вера, что серия успехов продолжится из-за «везения».",
            example: "«Я выиграл 3 раза подряд — я сегодня в ударе!» Удача не накапливается.",
          },
          {
            name: "Эффект «почти выиграл» (Near-Miss Effect)",
            desc: "Проигрыш, похожий на выигрыш, воспринимается как знак скорого успеха.",
            example: "На слотах 2 из 3 символов совпали. Мозг кричит: «Почти!» Но это обычный проигрыш.",
          },
          {
            name: "Невозвратные затраты (Sunk Cost Fallacy)",
            desc: "Продолжение игры, чтобы «отыграть» потерянное.",
            example: "«Я уже проиграл 50 000 — надо играть дальше, чтобы вернуть!» Эти деньги уже потеряны навсегда.",
          },
        ].map((bias) => (
          <div key={bias.name} className="bg-dark rounded-lg p-4">
            <p className="text-white font-medium text-sm">{bias.name}</p>
            <p className="text-slate-400 mt-1">{bias.desc}</p>
            <div className="mt-2 bg-dark-lighter/50 rounded px-3 py-2 border-l-2 border-accent">
              <p className="text-xs text-slate-400">
                <span className="text-accent font-medium">Пример:</span> {bias.example}
              </p>
            </div>
          </div>
        ))}
      </div>
    ),
    quiz: [
      {
        question: "Что такое «ошибка игрока»?",
        options: [
          "Неправильный выбор ставки",
          "Вера, что после серии проигрышей «должен» быть выигрыш",
          "Ошибка в подсчёте карт",
          "Игра в нетрезвом состоянии",
        ],
        correct: 1,
      },
      {
        question: "Почему эффект «почти выиграл» опасен?",
        options: [
          "Он снижает ставки",
          "Он заставляет остановиться",
          "Он воспринимается как знак скорой победы и мотивирует продолжать",
          "Он не опасен",
        ],
        correct: 2,
      },
      {
        question: "«Я уже проиграл 50 000 — надо играть дальше, чтобы вернуть!» — это пример:",
        options: ["Иллюзии контроля", "Эффекта горячей руки", "Ошибки невозвратных затрат", "Ошибки игрока"],
        correct: 2,
      },
    ],
  },
  {
    id: "stages",
    icon: <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898" /></svg>,
    title: "Стадии зависимости",
    readingTime: 6,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          Игровая зависимость развивается постепенно. Понимание стадий помогает определить,
          где вы находитесь, и что ждёт впереди, если не остановиться.
        </p>
        <StagesTimeline />
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
          <p className="text-accent text-sm font-medium">Важно понимать</p>
          <p className="text-slate-400 mt-1">
            Переход между стадиями происходит незаметно. Большинство игроков осознают проблему только
            на стадии отчаяния. Но чем раньше вы остановитесь, тем легче восстановление.
          </p>
        </div>
        <p>
          <strong className="text-white">Восстановление возможно на любой стадии.</strong> Многие люди прошли
          через все четыре фазы и построили новую жизнь. Ваше присутствие здесь — первый шаг.
        </p>
      </div>
    ),
    quiz: [
      {
        question: "Какая фаза идёт первой?",
        options: ["Фаза проигрыша", "Фаза выигрыша", "Фаза отчаяния", "Фаза безнадёжности"],
        correct: 1,
      },
      {
        question: "Что характерно для фазы проигрыша?",
        options: [
          "Эйфория и чувство контроля",
          "Погоня за отыгрышем и ложь близким",
          "Суицидальные мысли",
          "Полное равнодушие к деньгам",
        ],
        correct: 1,
      },
    ],
  },
  {
    id: "halt",
    icon: <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 00-.668-.668 1.667 1.667 0 00-1.167.486l-1.45 1.45" /></svg>,
    title: "Техника HALT",
    readingTime: 5,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          <span className="text-white font-medium">HALT</span> — простой акроним, который помогает распознать
          состояния повышенного риска срыва:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              letter: "H",
              word: "Hungry — Голод",
              icon: "H",
              desc: "Низкий сахар в крови снижает самоконтроль. Регулярное питание — базовая защита.",
              tip: "Держите при себе здоровый перекус",
            },
            {
              letter: "A",
              word: "Angry — Злость",
              icon: "A",
              desc: "Гнев и раздражение толкают к импульсивным действиям. Игра кажется способом «выпустить пар».",
              tip: "10 глубоких вдохов или быстрая прогулка",
            },
            {
              letter: "L",
              word: "Lonely — Одиночество",
              icon: "L",
              desc: "Изоляция — один из главных триггеров. Онлайн-казино всегда «рядом», когда вам одиноко.",
              tip: "Позвоните другу или напишите в чат поддержки",
            },
            {
              letter: "T",
              word: "Tired — Усталость",
              icon: "T",
              desc: "Уставший мозг хуже принимает решения. Вечерняя усталость — опасное время.",
              tip: "Ложитесь спать вовремя, не сидите в телефоне",
            },
          ].map((item) => (
            <div key={item.letter} className="bg-dark rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-accent text-lg font-bold w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">{item.letter}</span>
                <span className="text-white text-sm">{item.word}</span>
              </div>
              <p className="text-slate-400 text-sm">{item.desc}</p>
              <div className="mt-2 bg-accent/5 rounded px-3 py-1.5">
                <p className="text-xs text-accent">Совет: {item.tip}</p>
              </div>
            </div>
          ))}
        </div>
        <p>
          Перед каждой ситуацией, когда хочется поиграть, спросите себя:
          <span className="text-white font-medium"> «Я голоден? Злюсь? Одинок? Устал?»</span>.
          Если да — сначала решите эту проблему.
        </p>
      </div>
    ),
    quiz: [
      {
        question: "Что означает буква «L» в HALT?",
        options: ["Lazy — Ленивый", "Lonely — Одинокий", "Lost — Потерянный", "Late — Опоздавший"],
        correct: 1,
      },
      {
        question: "Почему усталость повышает риск срыва?",
        options: [
          "Потому что казино работает ночью",
          "Потому что уставший мозг хуже принимает решения",
          "Потому что ночью больше акций",
          "Потому что снятся выигрыши",
        ],
        correct: 1,
      },
    ],
  },
  {
    id: "mindfulness",
    icon: <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>,
    title: "Mindfulness и осознанность",
    readingTime: 7,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          Осознанность (mindfulness) — это способность наблюдать свои мысли и чувства без автоматической
          реакции. Для борьбы с зависимостью это один из самых мощных инструментов.
        </p>
        <div className="bg-dark rounded-lg p-4">
          <p className="text-accent text-xs font-medium mb-3">ТЕХНИКА «5-4-3-2-1» (ЗАЗЕМЛЕНИЕ)</p>
          <p className="text-slate-400 mb-2">Когда накрывает желание играть, сфокусируйтесь:</p>
          <div className="space-y-1.5">
            <p><span className="text-white font-medium">5</span> — назовите 5 вещей, которые вы <em>видите</em></p>
            <p><span className="text-white font-medium">4</span> — назовите 4 вещи, которые вы <em>чувствуете на ощупь</em></p>
            <p><span className="text-white font-medium">3</span> — назовите 3 вещи, которые вы <em>слышите</em></p>
            <p><span className="text-white font-medium">2</span> — назовите 2 вещи, которые вы <em>чувствуете на запах</em></p>
            <p><span className="text-white font-medium">1</span> — назовите 1 вещь, которую вы <em>чувствуете на вкус</em></p>
          </div>
        </div>
        <div className="bg-dark rounded-lg p-4">
          <p className="text-accent text-xs font-medium mb-3">СЁРФИНГ ПОБУЖДЕНИЙ (URGE SURFING)</p>
          <p className="text-slate-400 mb-2">
            Побуждение к игре — как волна: оно нарастает, достигает пика и отступает.
            Средняя длительность — <span className="text-white">15-20 минут</span>.
          </p>
          <div className="flex items-end gap-1 h-16 mt-3">
            {[1, 2, 3, 5, 7, 9, 10, 9, 7, 5, 3, 2, 1, 1, 0].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-accent/30 transition-all"
                style={{ height: `${h * 10}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0 мин</span>
            <span>Пик</span>
            <span>20 мин</span>
          </div>
          <p className="text-slate-400 mt-2">
            Не боритесь с волной — наблюдайте за ней. Скажите себе: «Это просто побуждение. Оно пройдёт.»
          </p>
        </div>
        <div className="bg-dark rounded-lg p-4">
          <p className="text-accent text-xs font-medium mb-2">ДЫХАТЕЛЬНОЕ УПРАЖНЕНИЕ «4-7-8»</p>
          <p className="text-slate-400">
            Вдох на <span className="text-white">4</span> сек — Задержка на <span className="text-white">7</span> сек — Выдох на <span className="text-white">8</span> сек.
            Повторите 4 раза.
          </p>
        </div>
      </div>
    ),
    quiz: [
      {
        question: "Сколько в среднем длится побуждение к игре?",
        options: ["1-2 минуты", "15-20 минут", "1-2 часа", "Весь день"],
        correct: 1,
      },
      {
        question: "Что такое «сёрфинг побуждений»?",
        options: [
          "Играть понемногу, «сёрфить» между казино",
          "Наблюдать за побуждением без реакции, пока оно не пройдёт",
          "Заменять одно побуждение другим",
          "Записывать побуждения в дневник",
        ],
        correct: 1,
      },
    ],
  },
  {
    id: "finances",
    icon: <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
    title: "Финансовое восстановление",
    readingTime: 8,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          Финансовые последствия — одна из самых болезненных сторон игровой зависимости.
          Но восстановление возможно. Вот пошаговый план:
        </p>
        <div className="space-y-3">
          {[
            {
              step: 1,
              title: "Полная инвентаризация",
              desc: "Выпишите ВСЕ долги, кредиты, задолженности. Знание точной суммы — первый шаг. Не прячьтесь от цифр.",
            },
            {
              step: 2,
              title: "Закройте доступ к деньгам",
              desc: "Передайте финансовый контроль доверенному лицу. Удалите банковские приложения. Установите лимиты на карты.",
            },
            {
              step: 3,
              title: "Составьте бюджет",
              desc: "Фиксированные расходы → обязательные платежи по долгам → еда и транспорт → небольшая сумма на себя. Ничего «лишнего».",
            },
            {
              step: 4,
              title: "Стратегия погашения долгов",
              desc: "Метод «снежного кома»: сначала самый маленький долг, потом следующий. Или метод «лавины»: сначала долг с самым высоким процентом.",
            },
            {
              step: 5,
              title: "Подушка безопасности",
              desc: "Даже 1000 ₽ в месяц на отдельный счёт. Через год это 12 000 ₽ — начало финансовой свободы.",
            },
            {
              step: 6,
              title: "Обратитесь за помощью",
              desc: "Если долги критичны — юрист по банкротству, бесплатная горячая линия. Вы не одиноки.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{item.title}</p>
                <p className="text-slate-400 text-sm mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
          <p className="text-accent text-sm font-medium">Помните</p>
          <p className="text-slate-400 mt-1">
            Деньги, потерянные в игре, уже не вернуть. Но каждый день без игры — это день, когда
            вы не теряете новые деньги. Фокусируйтесь на будущем, а не на прошлом.
          </p>
        </div>
      </div>
    ),
    quiz: [
      {
        question: "Какой первый шаг финансового восстановления?",
        options: [
          "Взять кредит для погашения долгов",
          "Полная инвентаризация всех долгов",
          "Найти способ быстро заработать",
          "Попросить деньги у родственников",
        ],
        correct: 1,
      },
      {
        question: "Что такое метод «снежного кома»?",
        options: [
          "Копить деньги в банке",
          "Погашать долги случайным образом",
          "Сначала закрыть самый маленький долг, потом следующий",
          "Сначала закрыть самый большой долг",
        ],
        correct: 2,
      },
    ],
  },
  {
    id: "new-life",
    icon: <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
    title: "Построение новой жизни",
    readingTime: 7,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          Отказ от игры — это не только «перестать играть». Это возможность построить жизнь, в которой
          игра будет не нужна. Вот что можно делать вместо азартных игр:
        </p>
        <div className="bg-dark rounded-lg p-4">
          <p className="text-accent text-xs font-medium mb-3">ЗАМЕНА ПРИВЫЧКИ</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { old: "Адреналин от ставки", newH: "Спорт, скалодром, картинг" },
              { old: "Уход от скуки", newH: "Хобби: музыка, рисование, готовка" },
              { old: "Социальное взаимодействие", newH: "Настольные игры, волонтёрство, клубы" },
              { old: "Способ расслабиться", newH: "Медитация, прогулки, баня" },
              { old: "Надежда на быстрые деньги", newH: "Изучение инвестирования, новая профессия" },
              { old: "Чувство контроля", newH: "Шахматы, стратегические игры, программирование" },
            ].map((r, i) => (
              <div key={i} className="bg-dark-lighter/50 rounded-lg p-3">
                <p className="text-xs text-red-400 line-through">{r.old}</p>
                <p className="text-xs text-accent mt-1">{r.newH}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-dark rounded-lg p-4">
          <p className="text-accent text-xs font-medium mb-3">ВОССТАНОВЛЕНИЕ ОТНОШЕНИЙ</p>
          <div className="space-y-2">
            <p>
              <span className="text-white font-medium">Честность.</span> Признайте свою зависимость перед
              близкими. Это страшно, но необходимо для доверия.
            </p>
            <p>
              <span className="text-white font-medium">Терпение.</span> Доверие восстанавливается медленно.
              Не требуйте немедленного прощения.
            </p>
            <p>
              <span className="text-white font-medium">Действия, не слова.</span> Покажите изменения делами:
              пришли вовремя, оплатили счёт, провели время с семьёй.
            </p>
            <p>
              <span className="text-white font-medium">Группа поддержки.</span> Gamblers Anonymous,
              группы в Telegram, индивидуальная терапия — всё помогает.
            </p>
          </div>
        </div>
        <p>
          <strong className="text-white">Каждый день без игры — это не отказ от чего-то.
          Это выбор в пользу чего-то лучшего.</strong>
        </p>
      </div>
    ),
    quiz: [
      {
        question: "Что лучше всего заменяет «адреналин от ставки»?",
        options: [
          "Просмотр телевизора",
          "Активный спорт и физические нагрузки",
          "Компьютерные игры с донатами",
          "Просто терпеть",
        ],
        correct: 1,
      },
      {
        question: "Что важнее всего для восстановления доверия близких?",
        options: [
          "Обещания, что больше не будете играть",
          "Последовательные действия, не слова",
          "Подарки и извинения",
          "Попросить их забыть прошлое",
        ],
        correct: 1,
      },
    ],
  },
];

function LessonQuiz({
  quiz,
  lessonId,
  onComplete,
}: {
  quiz: Quiz[];
  lessonId: string;
  onComplete: () => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const allCorrect = quiz.every((q, i) => answers[i] === q.correct);

  const handleSubmit = () => {
    setSubmitted(true);
    if (allCorrect) {
      onComplete();
    }
  };

  const handleRetry = () => {
    setAnswers(Array(quiz.length).fill(null));
    setSubmitted(false);
  };

  return (
    <div className="mt-6 border-t border-dark-border pt-6">
      <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        Проверьте себя
      </p>
      <div className="space-y-5">
        {quiz.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm text-slate-300 mb-2">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                let optClass = "bg-dark-lighter/50 border border-dark-border hover:border-accent/30";
                if (submitted) {
                  if (oi === q.correct) {
                    optClass = "bg-green-500/10 border border-green-500/30";
                  } else if (answers[qi] === oi && oi !== q.correct) {
                    optClass = "bg-red-500/10 border border-red-500/30";
                  }
                } else if (answers[qi] === oi) {
                  optClass = "bg-accent/10 border border-accent/30";
                }

                return (
                  <button
                    key={oi}
                    onClick={() => {
                      if (submitted) return;
                      const next = [...answers];
                      next[qi] = oi;
                      setAnswers(next);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${optClass} ${
                      submitted ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <span className="text-slate-300">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        {!submitted ? (
          <Button size="sm" disabled={!allAnswered} onClick={handleSubmit}>
            Проверить ответы
          </Button>
        ) : allCorrect ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
            <span>Отлично! Все ответы верны. Урок пройден!</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-red-400">Есть ошибки. Попробуйте ещё раз.</p>
            <Button size="sm" variant="secondary" onClick={handleRetry}>
              Повторить
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function EducationPage() {
  const [progress, setProgress] = useState<EducationProgress>({ completed: [], quizAnswers: {} });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const completedCount = progress.completed.length;

  const markComplete = useCallback(
    (lessonId: string) => {
      if (progress.completed.includes(lessonId)) return;
      const next = {
        ...progress,
        completed: [...progress.completed, lessonId],
      };
      setProgress(next);
      saveProgress(next);
    },
    [progress]
  );

  const toggleLesson = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Обучающие модули</h1>
        <p className="text-slate-400 mt-1">Изучите механизмы зависимости и инструменты восстановления</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Прогресс обучения</span>
          <span className="text-sm font-medium text-white">{completedCount}/{LESSONS.length}</span>
        </div>
        <div className="w-full h-3 bg-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / LESSONS.length) * 100}%` }}
          />
        </div>
        {completedCount === LESSONS.length && (
          <p className="text-accent text-sm mt-2 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            Поздравляем! Все уроки пройдены!
          </p>
        )}
      </Card>

      <div className="space-y-3">
        {LESSONS.map((lesson, index) => {
          const isCompleted = progress.completed.includes(lesson.id);
          const isExpanded = expandedId === lesson.id;

          return (
            <div
              key={lesson.id}
              className={`bg-dark-card border rounded-xl overflow-hidden transition-colors ${
                isCompleted ? "border-accent/20" : "border-dark-border"
              }`}
            >
              <button
                onClick={() => toggleLesson(lesson.id)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-dark-lighter/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-dark-lighter/50 border border-dark-border flex items-center justify-center shrink-0 [&>svg]:w-6 [&>svg]:h-6">
                  {lesson.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Урок {index + 1}</span>
                    {isCompleted && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                        Пройден
                      </span>
                    )}
                  </div>
                  <p className="text-white font-medium mt-0.5 truncate">{lesson.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">~{lesson.readingTime} мин чтения</p>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 border-t border-dark-border">
                  <div className="pt-5">{lesson.content}</div>
                  <LessonQuiz
                    quiz={lesson.quiz}
                    lessonId={lesson.id}
                    onComplete={() => markComplete(lesson.id)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
