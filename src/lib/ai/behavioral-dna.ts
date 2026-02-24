/**
 * Behavioral DNA Profile — архетипы игрока
 * Классификация на основе паттернов поведения для персонализированных интервенций.
 */

export type Archetype =
  | "impulsive_chaser"
  | "strategic_illusionist"
  | "night_escapist"
  | "emotional_gambler"
  | "financial_saboteur"
  | "unknown";

export interface ArchetypeResult {
  archetype: Archetype;
  label: string;
  description: string;
  insight: string;
  confidence: number;
}

interface Features {
  episodeFrequency: number;
  spendingTrend: number;
  moodScore: number;
  nightActivityRatio: number;
  triggerDiversity: number;
  streakDays: number;
  triggers?: string[];
}

const EMOTIONAL_TRIGGERS = ["stress", "boredom", "loneliness", "sadness", "anger", "anxiety"];

export function getBehavioralArchetype(features: Features): ArchetypeResult {
  const {
    episodeFrequency,
    spendingTrend,
    moodScore,
    nightActivityRatio,
    triggerDiversity,
    streakDays,
    triggers = [],
  } = features;

  const hasEmotionalTriggers =
    triggers.some((t) => EMOTIONAL_TRIGGERS.includes(t.toLowerCase())) ||
    (moodScore > 0 && moodScore <= 2.5);

  const scores: { archetype: Archetype; score: number }[] = [];

  // Impulsive Chaser: высокий spending trend, частые эпизоды, chase losses
  if (spendingTrend > 1.5 && episodeFrequency >= 2) {
    scores.push({ archetype: "impulsive_chaser", score: 0.8 + (spendingTrend - 1.5) * 0.2 });
  } else if (spendingTrend > 1.2) {
    scores.push({ archetype: "impulsive_chaser", score: 0.5 });
  }

  // Strategic Illusionist: много триггеров, средний mood, «контроль»
  if (triggerDiversity >= 4 && moodScore >= 2.5 && moodScore <= 4) {
    scores.push({ archetype: "strategic_illusionist", score: 0.7 });
  }

  // Night Escapist: ночная активность + низкое настроение
  if (nightActivityRatio > 0.3 && moodScore <= 2.5) {
    scores.push({ archetype: "night_escapist", score: 0.85 });
  } else if (nightActivityRatio > 0.2) {
    scores.push({ archetype: "night_escapist", score: 0.5 });
  }

  // Emotional Gambler: эмоциональные триггеры, низкое настроение
  if (hasEmotionalTriggers && episodeFrequency >= 1) {
    scores.push({ archetype: "emotional_gambler", score: 0.85 });
  } else if (hasEmotionalTriggers) {
    scores.push({ archetype: "emotional_gambler", score: 0.6 });
  }

  // Financial Self-Saboteur: рост расходов + низкая серия
  if (spendingTrend > 1.3 && streakDays < 7) {
    scores.push({ archetype: "financial_saboteur", score: 0.7 });
  }

  if (scores.length === 0) {
    return {
      archetype: "unknown",
      label: "Недостаточно данных",
      description: "Заполните дневник и эпизоды для определения профиля.",
      insight: "Система анализирует ваши паттерны по мере накопления данных.",
      confidence: 0,
    };
  }

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];

  const profiles: Record<Archetype, { label: string; description: string; insight: string }> = {
    impulsive_chaser: {
      label: "Импульсивный погонщик",
      description: "Склонность увеличивать ставки после проигрыша, погоня за убытками.",
      insight: "Вы играете, когда чувствуете, что «должны отыграться». Пауза перед следующей ставкой помогает выйти из импульса.",
    },
    strategic_illusionist: {
      label: "Стратегический иллюзионист",
      description: "Вера в систему, контроль и «стратегию», которая должна сработать.",
      insight: "Вы играете, когда чувствуете контроль. Помните: казино всегда имеет преимущество — house edge.",
    },
    night_escapist: {
      label: "Ночной беглец",
      description: "Активность в ночные часы как способ уйти от мыслей или одиночества.",
      insight: "Вы играете, когда не можете уснуть или чувствуете себя одиноко. Установите «комендантский час» для устройств.",
    },
    emotional_gambler: {
      label: "Эмоциональный игрок",
      description: "Игра как реакция на стресс, скуку, одиночество или плохое настроение.",
      insight: "Вы играете, когда чувствуете контроль потерянным. Подготовьте альтернативное действие на случай триггера.",
    },
    financial_saboteur: {
      label: "Финансовый саботажник",
      description: "Рост расходов на фоне нестабильной серии воздержания.",
      insight: "Паттерн «срыв → больше трат» усиливает цикл. Передайте контроль доверенному лицу в периоды риска.",
    },
    unknown: {
      label: "Не определено",
      description: "",
      insight: "",
    },
  };

  const profile = profiles[top.archetype];
  return {
    archetype: top.archetype,
    label: profile.label,
    description: profile.description,
    insight: profile.insight,
    confidence: Math.min(1, top.score),
  };
}
