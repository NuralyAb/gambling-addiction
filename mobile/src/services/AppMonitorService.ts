/**
 * AppMonitorService — watches for gambling app usage via UsageStats.
 * Sends a local notification if a gambling app is detected.
 */

import { AppState, AppStateStatus } from 'react-native';
import {
  isAvailable,
  hasPermission,
  checkGamblingApps,
} from 'usage-stats';
import * as Notifications from 'expo-notifications';

let _monitorInterval: ReturnType<typeof setInterval> | null = null;
let _lastAlertTime = 0;

async function checkForGamblingApps() {
  if (!isAvailable() || !hasPermission()) return;

  try {
    const apps = await checkGamblingApps(10); // Last 10 minutes
    if (apps.length > 0) {
      const now = Date.now();
      // Throttle: alert at most once every 5 minutes
      if (now - _lastAlertTime < 5 * 60 * 1000) return;
      _lastAlertTime = now;

      const appName = apps[0].appName || apps[0].packageName;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ SafeBet — Обнаружено приложение',
          body: `Вы открыли "${appName}". Помните о своей цели!`,
          priority: 'high' as never,
        },
        trigger: null,
      });
    }
  } catch {
    // Ignore errors in monitoring
  }
}

function handleAppStateChange(state: AppStateStatus) {
  if (state === 'active') {
    checkForGamblingApps();
  }
}

export function initMonitoring(): void {
  if (!isAvailable()) return;

  // Check on app foreground
  AppState.addEventListener('change', handleAppStateChange);

  // Periodic check every 5 minutes while app is open
  if (_monitorInterval) clearInterval(_monitorInterval);
  _monitorInterval = setInterval(() => {
    checkForGamblingApps();
  }, 5 * 60 * 1000);
}

export function stopMonitoring(): void {
  if (_monitorInterval) {
    clearInterval(_monitorInterval);
    _monitorInterval = null;
  }
}
