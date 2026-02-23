"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// ─── Breathing Exercise ─────────────────────────────────────────────────────

type BreathPhase = "idle" | "inhale" | "hold" | "exhale";

const PHASE_DURATION: Record<Exclude<BreathPhase, "idle">, number> = {
  inhale: 4000,
  hold: 4000,
  exhale: 4000,
};

const PHASE_LABEL: Record<BreathPhase, string> = {
  idle: "Нажмите, чтобы начать",
  inhale: "Вдох...",
  hold: "Задержите...",
  exhale: "Выдох...",
};

const PHASE_SCALE: Record<BreathPhase, number> = {
  idle: 0.55,
  inhale: 1,
  hold: 1,
  exhale: 0.55,
};

function BreathingExercise() {
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [cycles, setCycles] = useState(0);
  const [running, setRunning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const advancePhase = useCallback(() => {
    setPhase((prev) => {
      if (prev === "inhale") return "hold";
      if (prev === "hold") return "exhale";
      return "inhale";
    });
  }, []);

  useEffect(() => {
    if (!running || phase === "idle") return;

    if (phase === "exhale") {
      timeoutRef.current = setTimeout(() => {
        setCycles((c) => c + 1);
        advancePhase();
      }, PHASE_DURATION.exhale);
    } else {
      timeoutRef.current = setTimeout(advancePhase, PHASE_DURATION[phase]);
    }

    return clearTimer;
  }, [phase, running, advancePhase, clearTimer]);

  const toggle = useCallback(() => {
    if (running) {
      clearTimer();
      setRunning(false);
      setPhase("idle");
    } else {
      setCycles(0);
      setRunning(true);
      setPhase("inhale");
    }
  }, [running, clearTimer]);

  const scale = PHASE_SCALE[phase];
  const activeDuration =
    phase === "idle" ? 400 : PHASE_DURATION[phase];

  return (
    <Card className="text-center relative overflow-hidden">
      <h2 className="text-lg font-semibold text-white mb-1">
        Дыхательное упражнение
      </h2>
      <p className="text-sm text-slate-400 mb-8">
        Сфокусируйтесь на дыхании. Это поможет снять напряжение.
      </p>

      <div className="flex justify-center mb-8">
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Outermost ambient glow */}
          <div
            className="absolute inset-0 rounded-full transition-all ease-in-out"
            style={{
              transform: `scale(${scale * 1.15})`,
              transitionDuration: `${activeDuration}ms`,
              background:
                "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
            }}
          />
          {/* Pulsing ring */}
          <div
            className="absolute rounded-full border transition-all ease-in-out"
            style={{
              width: 210,
              height: 210,
              left: "50%",
              top: "50%",
              marginLeft: -105,
              marginTop: -105,
              transform: `scale(${scale})`,
              transitionDuration: `${activeDuration}ms`,
              borderColor:
                phase !== "idle"
                  ? "rgba(6,182,212,0.15)"
                  : "rgba(6,182,212,0.05)",
              boxShadow:
                phase !== "idle"
                  ? `0 0 ${50 * scale}px ${25 * scale}px rgba(6,182,212,0.08)`
                  : "none",
            }}
          />
          {/* Main circle */}
          <div
            className="absolute rounded-full transition-all ease-in-out"
            style={{
              width: 180,
              height: 180,
              left: "50%",
              top: "50%",
              marginLeft: -90,
              marginTop: -90,
              transform: `scale(${scale})`,
              transitionDuration: `${activeDuration}ms`,
              background:
                "radial-gradient(circle at 35% 35%, rgba(6,182,212,0.28), rgba(6,182,212,0.06))",
              border: "2px solid rgba(6,182,212,0.3)",
              boxShadow: [
                "0 0 40px rgba(6,182,212,0.12)",
                "inset 0 0 40px rgba(6,182,212,0.06)",
                phase !== "idle"
                  ? `0 0 ${60 * scale}px rgba(6,182,212,0.18)`
                  : "",
              ]
                .filter(Boolean)
                .join(", "),
            }}
          />
          {/* Inner highlight */}
          <div
            className="absolute rounded-full transition-all ease-in-out"
            style={{
              width: 90,
              height: 90,
              left: "50%",
              top: "50%",
              marginLeft: -45,
              marginTop: -45,
              transform: `scale(${scale})`,
              transitionDuration: `${activeDuration}ms`,
              background:
                "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
            }}
          />
          {/* Phase text */}
          <span className="relative z-10 text-xl font-medium text-accent select-none pointer-events-none">
            {PHASE_LABEL[phase]}
          </span>
        </div>
      </div>

      {running && cycles > 0 && (
        <p className="text-sm text-slate-500 mb-4">
          Циклов завершено: {cycles}
        </p>
      )}

      <Button
        variant={running ? "secondary" : "primary"}
        size="lg"
        onClick={toggle}
        className="w-full max-w-xs mx-auto"
      >
        {running ? "Остановить" : "Начать дыхание"}
      </Button>
    </Card>
  );
}

// ─── Urge Timer ─────────────────────────────────────────────────────────────

const URGE_TIMER_SECONDS = 15 * 60;

function UrgeTimer() {
  const [secondsLeft, setSecondsLeft] = useState(URGE_TIMER_SECONDS);
  const [active, setActive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || secondsLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, secondsLeft]);

  const elapsed = URGE_TIMER_SECONDS - secondsLeft;
  const progress = (elapsed / URGE_TIMER_SECONDS) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const finished = secondsLeft === 0;

  const reset = useCallback(() => {
    setSecondsLeft(URGE_TIMER_SECONDS);
    setActive(true);
  }, []);

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-2">
        Таймер желания
      </h2>

      {finished ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-3">🎉</div>
          <p className="text-accent font-medium text-lg mb-1">
            Вы справились!
          </p>
          <p className="text-slate-400 text-sm mb-4">
            Желание должно ослабеть. Вы сильнее, чем думаете.
          </p>
          <Button variant="secondary" size="sm" onClick={reset}>
            Запустить заново
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-6">
            Желание играть обычно проходит через 10-20 минут. Подождите.
          </p>

          <div className="text-center mb-5">
            <span className="text-4xl font-mono font-bold text-white tabular-nums">
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </span>
          </div>

          <div className="h-2 bg-dark rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-accent/80 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-right">
            {Math.round(progress)}% времени прошло
          </p>
        </>
      )}
    </Card>
  );
}

// ─── Motivation Block ───────────────────────────────────────────────────────

function MotivationBlock() {
  const [streak, setStreak] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/achievements/streak")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.streak === "number") setStreak(data.streak);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const savedEstimate = streak * 500;

  if (!loaded) return null;

  const dayWord =
    streak === 1 ? "день" : streak >= 2 && streak <= 4 ? "дня" : "дней";

  return (
    <Card className="text-center">
      <div className="text-4xl mb-3">💪</div>
      <h2 className="text-lg font-semibold text-white mb-2">Ваш прогресс</h2>

      <div className="flex items-center justify-center gap-6 mb-4">
        <div>
          <div className="text-3xl font-bold text-accent">{streak}</div>
          <div className="text-xs text-slate-400">{dayWord} без игры</div>
        </div>
        {streak > 0 && <div className="w-px h-10 bg-dark-border" />}
        {streak > 0 && (
          <div>
            <div className="text-3xl font-bold text-white">
              ~{new Intl.NumberFormat("ru-RU").format(savedEstimate)}₽
            </div>
            <div className="text-xs text-slate-400">сэкономлено</div>
          </div>
        )}
      </div>

      <p className="text-slate-300 text-sm leading-relaxed">
        {streak > 0
          ? `Вы не играете уже ${streak} ${dayWord}. Не сдавайтесь!`
          : "Каждый день без игры — это победа. Начните прямо сейчас."}
      </p>
    </Card>
  );
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

function QuickActions() {
  const [trusted, setTrusted] = useState<{
    name: string | null;
    tg: string | null;
    email: string | null;
  } | null>(null);
  const [showTrusted, setShowTrusted] = useState(false);

  const fetchTrusted = useCallback(() => {
    setShowTrusted(true);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setTrusted({
          name: data.trusted_person_name || null,
          tg: data.trusted_person_tg || null,
          email: data.trusted_person_email || null,
        });
      })
      .catch(() => {
        setTrusted({ name: null, tg: null, email: null });
      });
  }, []);

  const actions = [
    {
      icon: "🤖",
      label: "Поговорить с AI",
      sub: "Поддержка и советы",
      href: "/support",
    },
    {
      icon: "📖",
      label: "Записать в дневник",
      sub: "Запишите свои чувства",
      href: "/diary",
    },
    {
      icon: "📞",
      label: "Позвонить на горячую линию",
      sub: "8-800-200-01-22",
      href: "tel:88002000122",
      external: true,
    },
  ];

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-4">
        Быстрые действия
      </h2>

      <div className="space-y-3">
        {actions.map((a) => {
          const inner = (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-dark-lighter/50 hover:bg-dark-lighter transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-dark flex items-center justify-center text-lg shrink-0">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{a.label}</div>
                <div className="text-xs text-slate-500">{a.sub}</div>
              </div>
              <svg
                className="w-4 h-4 text-slate-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          );

          return a.external ? (
            <a key={a.label} href={a.href}>
              {inner}
            </a>
          ) : (
            <Link key={a.label} href={a.href}>
              {inner}
            </Link>
          );
        })}

        {/* Trusted person */}
        {!showTrusted ? (
          <button onClick={fetchTrusted} className="w-full text-left">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-dark-lighter/50 hover:bg-dark-lighter transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-dark flex items-center justify-center text-lg shrink-0">
                🤝
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  Написать доверенному лицу
                </div>
                <div className="text-xs text-slate-500">
                  Свяжитесь с близким человеком
                </div>
              </div>
              <svg
                className="w-4 h-4 text-slate-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-lg bg-dark-lighter/50 border border-dark-border">
            {trusted === null ? (
              <p className="text-sm text-slate-400 text-center">Загрузка...</p>
            ) : trusted.name ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">
                  🤝 {trusted.name}
                </div>
                {trusted.tg && (
                  <a
                    href={`https://t.me/${trusted.tg.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    Telegram: @{trusted.tg.replace("@", "")}
                  </a>
                )}
                {trusted.email && (
                  <a
                    href={`mailto:${trusted.email}`}
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    Email: {trusted.email}
                  </a>
                )}
                {!trusted.tg && !trusted.email && (
                  <p className="text-xs text-slate-500">Контакты не указаны</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">
                  Доверенное лицо не указано
                </p>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    Указать в профиле
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Grounding Exercise (5-4-3-2-1) ────────────────────────────────────────

const GROUNDING_STEPS = [
  {
    count: 5,
    sense: "видите",
    icon: "👁️",
    prompt: "Назовите 5 вещей, которые вы видите",
  },
  {
    count: 4,
    sense: "чувствуете",
    icon: "✋",
    prompt: "Назовите 4 вещи, которые можете потрогать",
  },
  {
    count: 3,
    sense: "слышите",
    icon: "👂",
    prompt: "Назовите 3 звука, которые слышите",
  },
  {
    count: 2,
    sense: "чувствуете запах",
    icon: "👃",
    prompt: "Назовите 2 запаха, которые чувствуете",
  },
  {
    count: 1,
    sense: "чувствуете вкус",
    icon: "👅",
    prompt: "Назовите 1 вкус, который ощущаете",
  },
];

function GroundingExercise() {
  const [stepIndex, setStepIndex] = useState(0);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (stepIndex < GROUNDING_STEPS.length) {
      setChecked(new Array(GROUNDING_STEPS[stepIndex].count).fill(false));
    }
  }, [stepIndex]);

  const toggleItem = useCallback(
    (idx: number) => {
      setChecked((prev) => {
        const next = [...prev];
        next[idx] = !next[idx];

        if (next.every(Boolean)) {
          setTimeout(() => {
            if (stepIndex < GROUNDING_STEPS.length - 1) {
              setStepIndex((s) => s + 1);
            } else {
              setFinished(true);
            }
          }, 600);
        }

        return next;
      });
    },
    [stepIndex],
  );

  const reset = useCallback(() => {
    setStepIndex(0);
    setFinished(false);
  }, []);

  const totalItems = GROUNDING_STEPS.reduce((s, g) => s + g.count, 0);
  const completedItems =
    GROUNDING_STEPS.slice(0, stepIndex).reduce((s, g) => s + g.count, 0) +
    checked.filter(Boolean).length;
  const overallProgress = (completedItems / totalItems) * 100;

  if (finished) {
    return (
      <Card className="text-center">
        <div className="text-4xl mb-3">🌟</div>
        <h2 className="text-lg font-semibold text-white mb-2">Отлично!</h2>
        <p className="text-slate-400 text-sm mb-4">
          Вы вернулись в настоящий момент. Как вы себя чувствуете?
        </p>
        <Button variant="secondary" size="sm" onClick={reset}>
          Начать заново
        </Button>
      </Card>
    );
  }

  const step = GROUNDING_STEPS[stepIndex];

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-1">
        Заземление 5-4-3-2-1
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        Эта техника помогает вернуться в настоящий момент.
      </p>

      {/* Overall progress */}
      <div className="h-1.5 bg-dark rounded-full overflow-hidden mb-6">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {GROUNDING_STEPS.map((g, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              i < stepIndex
                ? "bg-accent/20 text-accent"
                : i === stepIndex
                  ? "bg-accent text-dark ring-2 ring-accent/30"
                  : "bg-dark-lighter text-slate-500"
            }`}
          >
            {i < stepIndex ? "✓" : g.count}
          </div>
        ))}
      </div>

      {/* Current step */}
      <div className="text-center mb-5">
        <div className="text-3xl mb-2">{step.icon}</div>
        <p className="text-white font-medium">{step.prompt}</p>
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-1 gap-2">
        {checked.map((isChecked, idx) => (
          <button
            key={idx}
            onClick={() => toggleItem(idx)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 text-left ${
              isChecked
                ? "bg-accent/10 border border-accent/20"
                : "bg-dark-lighter/50 border border-transparent hover:border-dark-border"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                isChecked
                  ? "bg-accent border-accent text-dark"
                  : "border-slate-600"
              }`}
            >
              {isChecked && (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span
              className={`text-sm ${isChecked ? "text-accent" : "text-slate-400"}`}
            >
              {step.sense} — #{idx + 1}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function SOSPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm font-medium text-red-400">
            SOS — Помощь
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Вы справитесь</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
          Это желание временное. Используйте инструменты ниже, чтобы переждать
          момент.
        </p>
      </div>

      <BreathingExercise />
      <UrgeTimer />
      <MotivationBlock />
      <GroundingExercise />
      <QuickActions />

      {/* Footer reassurance */}
      <div className="text-center pt-2 pb-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Помните: каждый раз, когда вы не поддаётесь желанию — вы становитесь
          сильнее. Вы не одиноки.
        </p>
      </div>
    </div>
  );
}
