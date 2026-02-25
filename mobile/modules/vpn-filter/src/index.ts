import { requireNativeModule, Platform } from 'expo-modules-core';

interface VpnFilterModuleType {
  isRunning(): boolean;
  getBlockedToday(): number;
  getTotalBlocked(): number;
  getRecentBlockedDomains(): string[];
  getMode(): string;
  setMode(mode: string): void;
  canDeactivateStrict(): boolean;
  getStrictRemainingMs(): number;
  getDomainCount(): number;
  updateDomains(domains: string[]): boolean;
  startVpn(): Promise<boolean>;
  stopVpn(): boolean;
  forceStopVpn(): boolean;
}

const isAndroid = Platform.OS === 'android';

let VpnFilterNative: VpnFilterModuleType | null = null;

try {
  if (isAndroid) {
    VpnFilterNative = requireNativeModule('VpnFilter');
  }
} catch {
  // Not available (Expo Go)
}

// ── Public API ──

export function isAvailable(): boolean {
  return isAndroid && VpnFilterNative !== null;
}

export function isRunning(): boolean {
  if (!VpnFilterNative) return false;
  try {
    return VpnFilterNative.isRunning();
  } catch {
    return false;
  }
}

export async function startVpn(): Promise<boolean> {
  if (!VpnFilterNative) return false;
  try {
    return await VpnFilterNative.startVpn();
  } catch {
    return false;
  }
}

export function stopVpn(): boolean {
  if (!VpnFilterNative) return false;
  try {
    return VpnFilterNative.stopVpn();
  } catch {
    return false;
  }
}

export function forceStopVpn(): boolean {
  if (!VpnFilterNative) return false;
  try {
    return VpnFilterNative.forceStopVpn();
  } catch {
    return false;
  }
}

export function getBlockedToday(): number {
  if (!VpnFilterNative) return 0;
  try {
    return VpnFilterNative.getBlockedToday();
  } catch {
    return 0;
  }
}

export function getTotalBlocked(): number {
  if (!VpnFilterNative) return 0;
  try {
    return VpnFilterNative.getTotalBlocked();
  } catch {
    return 0;
  }
}

export function getRecentBlockedDomains(): string[] {
  if (!VpnFilterNative) return [];
  try {
    return VpnFilterNative.getRecentBlockedDomains();
  } catch {
    return [];
  }
}

export type VpnMode = 'soft' | 'strict';

export function getMode(): VpnMode {
  if (!VpnFilterNative) return 'soft';
  try {
    return VpnFilterNative.getMode() as VpnMode;
  } catch {
    return 'soft';
  }
}

export function setMode(mode: VpnMode): void {
  if (!VpnFilterNative) return;
  try {
    VpnFilterNative.setMode(mode);
  } catch {}
}

export function canDeactivateStrict(): boolean {
  if (!VpnFilterNative) return true;
  try {
    return VpnFilterNative.canDeactivateStrict();
  } catch {
    return true;
  }
}

export function getStrictRemainingMs(): number {
  if (!VpnFilterNative) return 0;
  try {
    return VpnFilterNative.getStrictRemainingMs();
  } catch {
    return 0;
  }
}

export function getDomainCount(): number {
  if (!VpnFilterNative) return 0;
  try {
    return VpnFilterNative.getDomainCount();
  } catch {
    return 0;
  }
}

export function updateDomains(domains: string[]): boolean {
  if (!VpnFilterNative) return false;
  try {
    return VpnFilterNative.updateDomains(domains);
  } catch {
    return false;
  }
}
