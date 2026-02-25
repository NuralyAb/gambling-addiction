/**
 * VpnFilterService — JS-side wrapper around the native VPN module.
 *
 * Called from App.tsx on startup. Handles auto-start logic and
 * exposes helpers used by the HomeScreen VPN toggle.
 */

import {
  isAvailable,
  isRunning,
  startVpn as nativeStartVpn,
  stopVpn as nativeStopVpn,
  getBlockedToday,
  getTotalBlocked,
  getRecentBlockedDomains,
  getMode,
  setMode,
  canDeactivateStrict,
  getStrictRemainingMs,
} from 'vpn-filter';

export {
  isAvailable,
  isRunning,
  getBlockedToday,
  getTotalBlocked,
  getRecentBlockedDomains,
  getMode,
  setMode,
  canDeactivateStrict,
  getStrictRemainingMs,
};

export type VpnMode = 'soft' | 'strict';

/**
 * Called once on app startup.
 * If the VPN was previously active (soft mode), restart it automatically.
 */
export function initVpnFilter(): void {
  // Nothing to do on non-Android — module returns safe defaults
  if (!isAvailable()) return;

  // If VPN should be on but isn't (e.g. after reboot), auto-start
  // We don't auto-start here — user must explicitly enable in HomeScreen
  // because VPN permission dialog requires user interaction.
}

/**
 * Start the VPN filter. Shows Android permission dialog if needed.
 * Returns true if started successfully.
 */
export async function enableVpn(): Promise<boolean> {
  if (!isAvailable()) return false;
  try {
    return await nativeStartVpn();
  } catch {
    return false;
  }
}

/**
 * Stop the VPN filter.
 * Returns false in strict mode (cannot stop until timer expires).
 */
export function disableVpn(): boolean {
  if (!isAvailable()) return true;
  if (getMode() === 'strict' && !canDeactivateStrict()) return false;
  return nativeStopVpn();
}

/**
 * Toggle VPN on/off. Returns the new state.
 */
export async function toggleVpn(): Promise<boolean> {
  if (isRunning()) {
    disableVpn();
    return false;
  } else {
    return await enableVpn();
  }
}

/**
 * Returns a formatted string for remaining strict-mode lockout.
 */
export function getStrictRemainingFormatted(): string {
  const ms = getStrictRemainingMs();
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}
