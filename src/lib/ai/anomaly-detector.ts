/**
 * Statistical Anomaly Detection Module (Z-Score Method)
 *
 * Detects unusual patterns in user behavior by computing standard deviations
 * from the mean. Flags data points with |Z| > 2 as anomalies.
 *
 * Runs entirely server-side — zero external API calls.
 */

// ── Core statistics ──

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

function zScore(value: number, avg: number, sd: number): number {
  if (sd === 0) return 0;
  return (value - avg) / sd;
}

// ── Anomaly detection for a time series ──

export interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnomalyResult {
  date: string;
  value: number;
  label?: string;
  zScore: number;
  isAnomaly: boolean;
  severity: "normal" | "warning" | "critical";
}

const Z_THRESHOLD_WARNING = 1.5;
const Z_THRESHOLD_CRITICAL = 2.5;

function detectAnomalies(data: DataPoint[]): AnomalyResult[] {
  if (data.length < 3) {
    return data.map((d) => ({
      ...d,
      zScore: 0,
      isAnomaly: false,
      severity: "normal" as const,
    }));
  }

  const values = data.map((d) => d.value);
  const avg = mean(values);
  const sd = stdDev(values);

  return data.map((d) => {
    const z = zScore(d.value, avg, sd);
    const absZ = Math.abs(z);
    let severity: "normal" | "warning" | "critical" = "normal";
    if (absZ >= Z_THRESHOLD_CRITICAL) severity = "critical";
    else if (absZ >= Z_THRESHOLD_WARNING) severity = "warning";

    return {
      ...d,
      zScore: Math.round(z * 100) / 100,
      isAnomaly: absZ >= Z_THRESHOLD_WARNING,
      severity,
    };
  });
}

// ── Multi-dimensional behavior analysis ──

export interface BehaviorData {
  dailySpending: DataPoint[];     // amount spent per day
  dailyEpisodes: DataPoint[];     // episode count per day
  hourlyActivity: DataPoint[];    // activity by hour (0-23)
  blockAttempts: DataPoint[];     // block events per day
}

export interface AnomalyReport {
  spending: {
    anomalies: AnomalyResult[];
    stats: { mean: number; stdDev: number; total: number };
  };
  episodes: {
    anomalies: AnomalyResult[];
    stats: { mean: number; stdDev: number; total: number };
  };
  timePatterns: {
    anomalies: AnomalyResult[];
    peakHour: number | null;
    nightRatio: number;
  };
  blockAttempts: {
    anomalies: AnomalyResult[];
    stats: { mean: number; stdDev: number; total: number };
  };
  summary: {
    totalAnomalies: number;
    criticalCount: number;
    warningCount: number;
    overallRisk: "low" | "moderate" | "high";
    alerts: string[];
  };
}

export function analyzeAnomalies(data: BehaviorData): AnomalyReport {
  const spendingResults = detectAnomalies(data.dailySpending);
  const episodeResults = detectAnomalies(data.dailyEpisodes);
  const hourResults = detectAnomalies(data.hourlyActivity);
  const blockResults = detectAnomalies(data.blockAttempts);

  const spendingValues = data.dailySpending.map((d) => d.value);
  const episodeValues = data.dailyEpisodes.map((d) => d.value);
  const blockValues = data.blockAttempts.map((d) => d.value);

  // Time pattern: find peak hour and night ratio
  const hourValues = data.hourlyActivity;
  let peakHour: number | null = null;
  if (hourValues.length > 0) {
    const maxHour = hourValues.reduce((max, d) => (d.value > max.value ? d : max), hourValues[0]);
    peakHour = parseInt(maxHour.label || maxHour.date);
  }

  const nightHours = hourValues.filter((d) => {
    const h = parseInt(d.label || d.date);
    return h >= 22 || h < 6;
  });
  const nightTotal = nightHours.reduce((s, d) => s + d.value, 0);
  const allTotal = hourValues.reduce((s, d) => s + d.value, 0);
  const nightRatio = allTotal > 0 ? Math.round((nightTotal / allTotal) * 100) / 100 : 0;

  // Aggregate anomaly counts
  const allAnomalies = [
    ...spendingResults.filter((r) => r.isAnomaly),
    ...episodeResults.filter((r) => r.isAnomaly),
    ...hourResults.filter((r) => r.isAnomaly),
    ...blockResults.filter((r) => r.isAnomaly),
  ];

  const criticalCount = allAnomalies.filter((a) => a.severity === "critical").length;
  const warningCount = allAnomalies.filter((a) => a.severity === "warning").length;

  // Generate alerts
  const alerts: string[] = [];

  const spendingAnomalies = spendingResults.filter((r) => r.isAnomaly && r.zScore > 0);
  if (spendingAnomalies.length > 0) {
    const worst = spendingAnomalies.sort((a, b) => b.zScore - a.zScore)[0];
    alerts.push(
      `Аномально высокие расходы ${worst.date}: Z-score ${worst.zScore} (${worst.severity === "critical" ? "критично" : "внимание"})`
    );
  }

  const episodeAnomalies = episodeResults.filter((r) => r.isAnomaly && r.zScore > 0);
  if (episodeAnomalies.length > 0) {
    alerts.push(
      `Всплеск эпизодов обнаружен (${episodeAnomalies.length} аномальных дней)`
    );
  }

  const blockAnomalies = blockResults.filter((r) => r.isAnomaly && r.zScore > 0);
  if (blockAnomalies.length > 0) {
    alerts.push(
      `Рост попыток доступа к заблокированным сайтам (${blockAnomalies.length} аномальных дней)`
    );
  }

  if (nightRatio > 0.4) {
    alerts.push(`${Math.round(nightRatio * 100)}% активности приходится на ночное время (22:00–06:00)`);
  }

  // Recent escalation: check last 3 days vs rest
  if (data.dailySpending.length >= 7) {
    const recent3 = data.dailySpending.slice(-3);
    const earlier = data.dailySpending.slice(0, -3);
    const recentAvg = mean(recent3.map((d) => d.value));
    const earlierAvg = mean(earlier.map((d) => d.value));
    if (recentAvg > earlierAvg * 2 && recentAvg > 0) {
      alerts.push("Расходы за последние 3 дня в 2+ раза выше среднего — возможная эскалация");
    }
  }

  let overallRisk: "low" | "moderate" | "high" = "low";
  if (criticalCount >= 2 || alerts.length >= 3) overallRisk = "high";
  else if (criticalCount >= 1 || warningCount >= 2 || alerts.length >= 2) overallRisk = "moderate";

  return {
    spending: {
      anomalies: spendingResults,
      stats: {
        mean: Math.round(mean(spendingValues)),
        stdDev: Math.round(stdDev(spendingValues)),
        total: Math.round(spendingValues.reduce((s, v) => s + v, 0)),
      },
    },
    episodes: {
      anomalies: episodeResults,
      stats: {
        mean: Math.round(mean(episodeValues) * 100) / 100,
        stdDev: Math.round(stdDev(episodeValues) * 100) / 100,
        total: episodeValues.reduce((s, v) => s + v, 0),
      },
    },
    timePatterns: {
      anomalies: hourResults,
      peakHour,
      nightRatio,
    },
    blockAttempts: {
      anomalies: blockResults,
      stats: {
        mean: Math.round(mean(blockValues) * 100) / 100,
        stdDev: Math.round(stdDev(blockValues) * 100) / 100,
        total: blockValues.reduce((s, v) => s + v, 0),
      },
    },
    summary: {
      totalAnomalies: allAnomalies.length,
      criticalCount,
      warningCount,
      overallRisk,
      alerts,
    },
  };
}

export const MODULE_META = {
  name: "NoBet Anomaly Detector",
  version: "1.0.0",
  method: "Z-Score Statistical Analysis",
  thresholds: { warning: Z_THRESHOLD_WARNING, critical: Z_THRESHOLD_CRITICAL },
  independent: true,
  externalAPIs: 0,
};
