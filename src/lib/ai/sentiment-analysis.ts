/**
 * NLP Sentiment Analysis Module
 *
 * Uses the AFINN-165 lexicon via the `sentiment` npm package
 * to analyze diary entry text entirely locally — zero external API calls.
 *
 * Provides per-entry scores and aggregated trend analysis.
 */

import Sentiment from "sentiment";

const analyzer = new Sentiment();

// Russian language additions for gambling context
const RUSSIAN_GAMBLING_LEXICON: Record<string, number> = {
  // Negative (gambling-related)
  "проиграл": -4, "проиграла": -4, "проигрыш": -4, "проигрыши": -4,
  "слив": -3, "слил": -3, "слила": -3, "слито": -3,
  "долг": -4, "долги": -4, "задолженность": -4,
  "ставка": -2, "ставки": -2, "поставил": -2,
  "казино": -3, "слоты": -3, "рулетка": -3, "букмекер": -2,
  "зависимость": -3, "зависим": -3, "аддикция": -3,
  "соблазн": -2, "желание": -1, "позыв": -2, "тяга": -3,
  "сорвался": -4, "сорвалась": -4, "срыв": -4,
  "стыд": -3, "стыдно": -3, "вина": -3, "виноват": -3,
  "отчаяние": -4, "безнадёжно": -4, "безнадежно": -4,
  "депрессия": -4, "тревога": -3, "паника": -4,
  "бессонница": -2, "не спал": -2, "не спала": -2,
  "скрываю": -3, "обман": -3, "соврал": -3, "солгал": -3,
  "кредит": -3, "займ": -3, "занял": -3,
  "потерял": -3, "потеряла": -3, "потеря": -3,
  "злость": -3, "злюсь": -3, "раздражение": -2,
  "одиночество": -3, "одинок": -3, "одинока": -3,
  "алкоголь": -2, "пил": -2, "выпил": -2, "пьяный": -3,
  "ужасно": -4, "плохо": -3, "тяжело": -2, "больно": -3,
  "реклама": -1, "спам": -1,

  // Positive (recovery-related)
  "устоял": 4, "устояла": 4, "удержался": 4, "удержалась": 4,
  "выдержал": 4, "выдержала": 4, "справился": 4, "справилась": 4,
  "свобода": 3, "свободен": 3, "свободна": 3,
  "прогресс": 3, "достижение": 3, "победа": 4,
  "контроль": 2, "самоконтроль": 3,
  "поддержка": 3, "помощь": 2, "терапия": 2, "психолог": 2,
  "спорт": 2, "тренировка": 2, "прогулка": 2, "медитация": 3,
  "семья": 2, "друзья": 2, "близкие": 2,
  "спокойствие": 3, "радость": 4, "счастье": 4, "гордость": 4,
  "надежда": 3, "вера": 2, "мотивация": 3,
  "хорошо": 3, "отлично": 4, "замечательно": 4, "прекрасно": 4,
  "день": 1, "чистый": 2, "серия": 2,
  "сэкономил": 3, "сэкономила": 3, "накопил": 3,
  "благодарен": 3, "благодарна": 3, "спасибо": 2,
};

export interface SentimentResult {
  score: number;          // raw AFINN score (can be negative)
  comparative: number;    // score / number of words
  positive: string[];     // positive words found
  negative: string[];     // negative words found
  label: "positive" | "negative" | "neutral";
}

export function analyzeText(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, comparative: 0, positive: [], negative: [], label: "neutral" };
  }

  const result = analyzer.analyze(text, { extras: RUSSIAN_GAMBLING_LEXICON });

  let label: "positive" | "negative" | "neutral";
  if (result.comparative > 0.05) label = "positive";
  else if (result.comparative < -0.05) label = "negative";
  else label = "neutral";

  return {
    score: result.score,
    comparative: Math.round(result.comparative * 1000) / 1000,
    positive: result.positive,
    negative: result.negative,
    label,
  };
}

// ── Trend analysis across multiple entries ──

export interface SentimentTrend {
  entries: Array<{
    date: string;
    score: number;
    comparative: number;
    label: "positive" | "negative" | "neutral";
  }>;
  averageScore: number;
  trend: "improving" | "declining" | "stable";
  recentVsPrevious: number; // difference in avg score
  dominantMood: "positive" | "negative" | "neutral";
  negativeStreak: number;   // consecutive negative entries
  warningSignals: string[];
}

export function analyzeTrend(
  entries: Array<{ date: string; text: string }>
): SentimentTrend {
  if (entries.length === 0) {
    return {
      entries: [],
      averageScore: 0,
      trend: "stable",
      recentVsPrevious: 0,
      dominantMood: "neutral",
      negativeStreak: 0,
      warningSignals: [],
    };
  }

  const analyzed = entries.map((e) => {
    const result = analyzeText(e.text);
    return {
      date: e.date,
      score: result.score,
      comparative: result.comparative,
      label: result.label,
    };
  });

  const scores = analyzed.map((a) => a.score);
  const averageScore = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100;

  // Split into halves for trend
  const mid = Math.floor(analyzed.length / 2);
  const olderHalf = analyzed.slice(0, mid);
  const recentHalf = analyzed.slice(mid);

  const olderAvg = olderHalf.length > 0
    ? olderHalf.reduce((s, a) => s + a.score, 0) / olderHalf.length
    : 0;
  const recentAvg = recentHalf.length > 0
    ? recentHalf.reduce((s, a) => s + a.score, 0) / recentHalf.length
    : 0;

  const diff = recentAvg - olderAvg;
  let trend: "improving" | "declining" | "stable";
  if (diff > 1) trend = "improving";
  else if (diff < -1) trend = "declining";
  else trend = "stable";

  // Dominant mood
  const labelCounts = { positive: 0, negative: 0, neutral: 0 };
  analyzed.forEach((a) => labelCounts[a.label]++);
  const dominantMood = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0][0] as "positive" | "negative" | "neutral";

  // Negative streak (from most recent)
  let negativeStreak = 0;
  for (let i = analyzed.length - 1; i >= 0; i--) {
    if (analyzed[i].label === "negative") negativeStreak++;
    else break;
  }

  // Warning signals
  const warningSignals: string[] = [];
  if (negativeStreak >= 3) {
    warningSignals.push(`${negativeStreak} негативных записей подряд`);
  }
  if (trend === "declining") {
    warningSignals.push("Эмоциональный фон ухудшается");
  }
  if (dominantMood === "negative" && analyzed.length >= 5) {
    warningSignals.push("Преобладают негативные эмоции в записях");
  }
  if (recentAvg < -3) {
    warningSignals.push("Сильно негативный тон в последних записях");
  }

  return {
    entries: analyzed,
    averageScore,
    trend,
    recentVsPrevious: Math.round(diff * 100) / 100,
    dominantMood,
    negativeStreak,
    warningSignals,
  };
}

export const MODULE_META = {
  name: "NoBet NLP Sentiment Analyzer",
  version: "1.0.0",
  lexicon: "AFINN-165 + Russian gambling vocabulary (80+ terms)",
  independent: true,
  externalAPIs: 0,
};
