"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const QUESTIONS = [
  "Ставили ли вы всё большие суммы денег на азартные игры?",
  "Возвращались ли вы на следующий день, чтобы отыграться?",
  "Брали ли вы деньги в долг или продавали вещи, чтобы играть?",
  "Были ли у вас проблемы из-за азартных игр?",
  "Испытывали ли вы стресс от потерь в азартных играх?",
  "Критиковали ли вас близкие за игру?",
  "Чувствовали ли вы, что у вас есть проблема с азартными играми?",
  "Мешала ли вам игра в выполнении обязательств?",
  "Испытывали ли вы вину после игры?",
];

const OPTIONS = [
  { label: "Никогда", value: 0 },
  { label: "Иногда", value: 1 },
  { label: "Чаще всего", value: 2 },
  { label: "Почти всегда", value: 3 },
];

interface TestResult {
  totalScore: number;
  riskCategory: string;
  riskPercent: number;
}

function getRiskInfo(category: string) {
  switch (category) {
    case "none":
      return {
        title: "Проблем не выявлено",
        color: "text-accent",
        bg: "bg-accent/10 border-accent/20",
        barColor: "bg-accent",
        description:
          "По результатам теста у вас нет признаков игровой зависимости. Это отличный результат! Продолжайте контролировать свои привычки.",
        recommendations: [
          "Продолжайте осознанно относиться к финансовым решениям",
          "Установите лимиты на развлечения заранее",
          "Используйте наше расширение для профилактики",
        ],
      };
    case "low":
      return {
        title: "Низкий уровень риска",
        color: "text-yellow-400",
        bg: "bg-yellow-400/10 border-yellow-400/20",
        barColor: "bg-yellow-400",
        description:
          "У вас есть минимальные признаки рискованного поведения. Сейчас самое время обратить на это внимание и принять меры.",
        recommendations: [
          "Отслеживайте время и деньги, потраченные на азартные игры",
          "Установите жёсткие лимиты и не превышайте их",
          "Расскажите доверенному лицу о ваших привычках",
          "Используйте AI-помощник для самоконтроля",
        ],
      };
    case "moderate":
      return {
        title: "Умеренный уровень риска",
        color: "text-orange-400",
        bg: "bg-orange-400/10 border-orange-400/20",
        barColor: "bg-orange-400",
        description:
          "Результат указывает на умеренные проблемы с азартными играми. Важно обратить внимание на это сейчас, пока ситуация не усугубилась.",
        recommendations: [
          "Серьёзно задумайтесь о сокращении или прекращении игры",
          "Обратитесь за поддержкой — это не слабость, а мудрость",
          "Добавьте доверенное лицо в профиле для подстраховки",
          "Регулярно проходите тест для отслеживания динамики",
          "Позвоните на горячую линию: 8-800-2000-122",
        ],
      };
    case "high":
      return {
        title: "Высокий уровень риска",
        color: "text-red-400",
        bg: "bg-red-400/10 border-red-400/20",
        barColor: "bg-red-400",
        description:
          "Результат указывает на серьёзные проблемы с игровой зависимостью. Это не приговор — многие люди успешно справились с помощью поддержки. Первый шаг уже сделан.",
        recommendations: [
          "Обратитесь к специалисту — психологу или аддиктологу",
          "Позвоните на горячую линию: 8-800-2000-122 (бесплатно, 24/7)",
          "Добавьте доверенное лицо, которое поможет вам контролировать ситуацию",
          "Установите наше браузерное расширение для блокировки игровых сайтов",
          "Используйте AI-помощник ежедневно для поддержки",
        ],
      };
    default:
      return {
        title: "Результат",
        color: "text-slate-300",
        bg: "bg-slate-500/10 border-slate-500/20",
        barColor: "bg-slate-400",
        description: "",
        recommendations: [],
      };
  }
}

export default function PGSITestPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(-1));
  const [direction, setDirection] = useState(1);
  const [result, setResult] = useState<TestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const isAnswered = answers[currentQuestion] !== -1;

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const goNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setDirection(1);
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentQuestion > 0) {
      setDirection(-1);
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/pgsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка сохранения");
        return;
      }

      setResult(data);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setSaving(false);
    }
  };

  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;
  const allAnswered = answers.every((a) => a !== -1);

  // Result screen
  if (result) {
    const info = getRiskInfo(result.riskCategory);

    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center">
            {/* Score circle */}
            <div className="mb-6">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#2a3040"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={info.color}
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 52 * (1 - result.totalScore / 27),
                    }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className={`text-3xl font-bold ${info.color}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {result.totalScore}
                  </motion.span>
                  <span className="text-xs text-slate-500">из 27</span>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div
                className={`inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-medium mb-4 ${info.bg} ${info.color}`}
              >
                {info.title}
              </div>

              <p className="text-slate-400 mb-8 leading-relaxed">
                {info.description}
              </p>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              className="text-left mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-white font-semibold mb-3">Рекомендации:</h3>
              <ul className="space-y-2">
                {info.recommendations.map((rec, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-3 text-sm text-slate-400"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${info.barColor}`} />
                    {rec}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button
                className="w-full"
                onClick={() => router.push("/dashboard")}
              >
                Перейти в личный кабинет
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Test screen
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Тест PGSI
        </h1>
        <p className="text-slate-400 text-sm">
          Problem Gambling Severity Index — стандартизированный международный
          опросник для оценки уровня риска игровой зависимости
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Вопрос {currentQuestion + 1} из {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-dark-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <Card>
              <div className="mb-6">
                <span className="text-xs font-medium text-accent bg-accent-muted px-2 py-1 rounded">
                  Вопрос {currentQuestion + 1}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white mb-6 leading-relaxed">
                {QUESTIONS[currentQuestion]}
              </h2>

              <div className="space-y-3">
                {OPTIONS.map((option) => {
                  const isSelected = answers[currentQuestion] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? "bg-accent/10 border-accent/40 text-white"
                          : "bg-dark-lighter border-dark-border text-slate-400 hover:border-slate-600 hover:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-accent bg-accent"
                              : "border-slate-600"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-dark rounded-full"
                            />
                          )}
                        </div>
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-slate-600 ml-auto">
                          {option.value} {option.value === 1 ? "балл" : option.value > 1 && option.value < 5 ? "балла" : "баллов"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          onClick={goPrev}
          disabled={currentQuestion === 0}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </Button>

        {isLastQuestion && allAnswered ? (
          <Button onClick={handleSubmit} loading={saving}>
            Получить результат
          </Button>
        ) : (
          <Button
            onClick={goNext}
            disabled={!isAnswered || isLastQuestion}
          >
            Далее
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
