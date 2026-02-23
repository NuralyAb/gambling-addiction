"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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
  const activeDuration = phase === "idle" ? 400 : PHASE_DURATION[phase];

  return (
    <Card className="text-center relative overflow-hidden">
      <h2 className="text-lg font-semibold text-white mb-1">Дыхательное упражнение</h2>
      <p className="text-sm text-slate-400 mb-8">Сфокусируйтесь на дыхании. Это поможет снять напряжение.</p>

      <div className="flex justify-center mb-8">
        <div className="relative w-56 h-56 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full transition-all ease-in-out"
            style={{
              transform: `scale(${scale * 1.15})`,
              transitionDuration: `${activeDuration}ms`,
              background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="absolute rounded-full border transition-all ease-in-out"
            style={{
              width: 210, height: 210, left: "50%", top: "50%", marginLeft: -105, marginTop: -105,
              transform: `scale(${scale})`, transitionDuration: `${activeDuration}ms`,
              borderColor: phase !== "idle" ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.05)",
              boxShadow: phase !== "idle" ? `0 0 ${50 * scale}px ${25 * scale}px rgba(6,182,212,0.08)` : "none",
            }}
          />
          <div className="absolute rounded-full transition-all ease-in-out"
            style={{
              width: 180, height: 180, left: "50%", top: "50%", marginLeft: -90, marginTop: -90,
              transform: `scale(${scale})`, transitionDuration: `${activeDuration}ms`,
              background: "radial-gradient(circle at 35% 35%, rgba(6,182,212,0.28), rgba(6,182,212,0.06))",
              border: "2px solid rgba(6,182,212,0.3)",
              boxShadow: [
                "0 0 40px rgba(6,182,212,0.12)",
                "inset 0 0 40px rgba(6,182,212,0.06)",
                phase !== "idle" ? `0 0 ${60 * scale}px rgba(6,182,212,0.18)` : "",
              ].filter(Boolean).join(", "),
            }}
          />
          <div className="absolute rounded-full transition-all ease-in-out"
            style={{
              width: 90, height: 90, left: "50%", top: "50%", marginLeft: -45, marginTop: -45,
              transform: `scale(${scale})`, transitionDuration: `${activeDuration}ms`,
              background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
            }}
          />
          <span className="relative z-10 text-xl font-medium text-accent select-none pointer-events-none">
            {PHASE_LABEL[phase]}
          </span>
        </div>
      </div>

      {running && cycles > 0 && (
        <p className="text-sm text-slate-500 mb-4">Циклов завершено: {cycles}</p>
      )}

      <Button variant={running ? "secondary" : "primary"} size="lg" onClick={toggle} className="w-full max-w-xs mx-auto">
        {running ? "Остановить" : "Начать дыхание"}
      </Button>
    </Card>
  );
}

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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
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
      <h2 className="text-lg font-semibold text-white mb-2">Таймер желания</h2>

      {finished ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-accent font-medium text-lg mb-1">Вы справились!</p>
          <p className="text-slate-400 text-sm mb-4">Желание должно ослабеть. Вы сильнее, чем думаете.</p>
          <Button variant="secondary" size="sm" onClick={reset}>Запустить заново</Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-6">Желание играть обычно проходит через 10-20 минут. Подождите.</p>
          <div className="text-center mb-5">
            <span className="text-4xl font-mono font-bold text-white tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
          <div className="h-2 bg-dark rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full bg-accent/80 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500 text-right">{Math.round(progress)}% времени прошло</p>
        </>
      )}
    </Card>
  );
}

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

  const dayWord = streak === 1 ? "день" : streak >= 2 && streak <= 4 ? "дня" : "дней";

  return (
    <Card className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/15 to-cyan-500/15 border border-accent/20 flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
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
              ~{new Intl.NumberFormat("ru-RU").format(savedEstimate)} ₸
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

const GROUNDING_STEPS = [
  {
    count: 5,
    sense: "видите",
    prompt: "Назовите 5 вещей, которые вы видите",
    icon: (
      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    count: 4,
    sense: "чувствуете",
    prompt: "Назовите 4 вещи, которые можете потрогать",
    icon: (
      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 00-.668-.668 1.667 1.667 0 00-1.167.486l-1.45 1.45" />
      </svg>
    ),
  },
  {
    count: 3,
    sense: "слышите",
    prompt: "Назовите 3 звука, которые слышите",
    icon: (
      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
  },
  {
    count: 2,
    sense: "чувствуете запах",
    prompt: "Назовите 2 запаха, которые чувствуете",
    icon: (
      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    count: 1,
    sense: "чувствуете вкус",
    prompt: "Назовите 1 вкус, который ощущаете",
    icon: (
      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
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
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Отлично!</h2>
        <p className="text-slate-400 text-sm mb-4">Вы вернулись в настоящий момент. Как вы себя чувствуете?</p>
        <Button variant="secondary" size="sm" onClick={reset}>Начать заново</Button>
      </Card>
    );
  }

  const step = GROUNDING_STEPS[stepIndex];

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-1">Заземление 5-4-3-2-1</h2>
      <p className="text-sm text-slate-400 mb-4">Эта техника помогает вернуться в настоящий момент.</p>

      <div className="h-1.5 bg-dark rounded-full overflow-hidden mb-6">
        <div className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${overallProgress}%` }} />
      </div>

      <div className="flex items-center justify-center gap-2 mb-5">
        {GROUNDING_STEPS.map((g, i) => (
          <div key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              i < stepIndex
                ? "bg-accent/20 text-accent"
                : i === stepIndex
                  ? "bg-accent text-dark ring-2 ring-accent/30"
                  : "bg-dark-lighter text-slate-500"
            }`}
          >
            {i < stepIndex ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : g.count}
          </div>
        ))}
      </div>

      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
          {step.icon}
        </div>
        <p className="text-white font-medium">{step.prompt}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {checked.map((isChecked, idx) => (
          <button key={idx} onClick={() => toggleItem(idx)}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left ${
              isChecked
                ? "bg-accent/10 border border-accent/20"
                : "bg-dark-lighter/50 border border-transparent hover:border-dark-border"
            }`}
          >
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
              isChecked ? "bg-accent border-accent text-dark" : "border-slate-600"
            }`}>
              {isChecked && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${isChecked ? "text-accent" : "text-slate-400"}`}>
              {step.sense} — #{idx + 1}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

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
      icon: (
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
      label: "Поговорить с AI",
      sub: "Поддержка и советы",
      href: "/support",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
      label: "Записать в дневник",
      sub: "Запишите свои чувства",
      href: "/diary",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      ),
      label: "Горячая линия",
      sub: "8-800-200-01-22",
      href: "tel:88002000122",
      external: true,
    },
  ];

  const trustedIcon = (
    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-4">Быстрые действия</h2>
      <div className="space-y-2">
        {actions.map((a) => {
          const inner = (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-dark-lighter/50 hover:bg-dark-lighter transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{a.label}</div>
                <div className="text-xs text-slate-500">{a.sub}</div>
              </div>
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          );
          return a.external ? (
            <a key={a.label} href={a.href}>{inner}</a>
          ) : (
            <Link key={a.label} href={a.href}>{inner}</Link>
          );
        })}

        {!showTrusted ? (
          <button onClick={fetchTrusted} className="w-full text-left">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-dark-lighter/50 hover:bg-dark-lighter transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                {trustedIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">Написать доверенному лицу</div>
                <div className="text-xs text-slate-500">Свяжитесь с близким человеком</div>
              </div>
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-dark-lighter/50 border border-dark-border">
            {trusted === null ? (
              <p className="text-sm text-slate-400 text-center animate-pulse">Загрузка...</p>
            ) : trusted.name ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {trustedIcon}
                  <span className="text-sm font-medium text-white">{trusted.name}</span>
                </div>
                {trusted.tg && (
                  <a href={`https://t.me/${trusted.tg.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline">
                    Telegram: @{trusted.tg.replace("@", "")}
                  </a>
                )}
                {trusted.email && (
                  <a href={`mailto:${trusted.email}`} className="flex items-center gap-2 text-sm text-accent hover:underline">
                    Email: {trusted.email}
                  </a>
                )}
                {!trusted.tg && !trusted.email && (
                  <p className="text-xs text-slate-500">Контакты не указаны</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">Доверенное лицо не указано</p>
                <Link href="/profile"><Button variant="ghost" size="sm">Указать в профиле</Button></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SOSPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm font-medium text-red-400">SOS — Помощь</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Вы справитесь</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
          Это желание временное. Используйте инструменты ниже, чтобы переждать момент.
        </p>
      </div>

      <BreathingExercise />
      <UrgeTimer />
      <MotivationBlock />
      <GroundingExercise />
      <QuickActions />

      <div className="text-center pt-2 pb-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Помните: каждый раз, когда вы не поддаётесь желанию — вы становитесь сильнее. Вы не одиноки.
        </p>
      </div>
    </div>
  );
}
