import { requireNativeModule, Platform } from 'expo-modules-core';

interface UsageStatsEntry {
  packageName: string;
  appName: string;
  lastTimeUsed: number;
  totalTimeInForeground: number;
}

interface UsageStatsModuleType {
  hasPermission(): boolean;
  openUsageAccessSettings(): void;
  getRecentApps(minutes: number): Promise<UsageStatsEntry[]>;
  checkGamblingApps(minutes: number, gamblingPackages: string[]): Promise<UsageStatsEntry[]>;
}

// Only available on Android
const isAndroid = Platform.OS === 'android';

let UsageStatsNative: UsageStatsModuleType | null = null;

try {
  if (isAndroid) {
    UsageStatsNative = requireNativeModule('UsageStats');
  }
} catch {
  // Module not available (e.g., in Expo Go)
}

// ── Gambling app packages ──

export const GAMBLING_PACKAGES = [
  'com.betcity',
  'ru.olimpbet',
  'com.fonbet',
  'com.winline',
  'com.parimatch',
  'com.mostbet',
  'com.melbetapp',
  'com.melbet',
  'com.onewin',
  'com.1win',
  'com.vavada',
  'com.pokerstars',
  'com.ggpoker',
  'com.pinup',
  'com.pin.up',
  'com.leonbets',
  'com.betboom',
  'com.ligastavok',
  'com.liga.stavok',
  'com.marathonbet',
  'com.bwin',
  'com.bet365',
  'com.casino888',
  'com.betwinner',
  'com.betway',
  'com.joycasino',
  'com.azino',
  'com.vulkan',
  'com.stake',
  'com.rollbit',
  'com.roobet',
  'com.gamdom',
  'com.duelbits',
  '1xbet',
  'fonbet',
  'olimpbet',
  'winline',
  'parimatch',
  'mostbet',
  'melbet',
  'vavada',
  'pokerstars',
  'ggpoker',
  'casino',
  'slots',
  'poker',
  'betting',
  'bookmaker',
];

// ── Public API ──

export function isAvailable(): boolean {
  return isAndroid && UsageStatsNative !== null;
}

export function hasPermission(): boolean {
  if (!UsageStatsNative) return false;
  try {
    return UsageStatsNative.hasPermission();
  } catch {
    return false;
  }
}

export function openUsageAccessSettings(): void {
  if (!UsageStatsNative) return;
  try {
    UsageStatsNative.openUsageAccessSettings();
  } catch {}
}

export async function getRecentApps(minutes: number = 15): Promise<UsageStatsEntry[]> {
  if (!UsageStatsNative) return [];
  try {
    return await UsageStatsNative.getRecentApps(minutes);
  } catch {
    return [];
  }
}

export async function checkGamblingApps(minutes: number = 15): Promise<UsageStatsEntry[]> {
  if (!UsageStatsNative) return [];
  try {
    return await UsageStatsNative.checkGamblingApps(minutes, GAMBLING_PACKAGES);
  } catch {
    return [];
  }
}

export type { UsageStatsEntry };
