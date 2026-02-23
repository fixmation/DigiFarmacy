/**
 * Platform detection utility
 * Detects if running on web, mobile (Capacitor), or Android
 */

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface PlatformInfo {
  isWeb: boolean;
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isCapacitor: boolean;
  platform: 'web' | 'android' | 'ios' | 'unknown';
}

let platformInfo: PlatformInfo | null = null;

/**
 * Get current platform information
 */
export const getPlatformInfo = async (): Promise<PlatformInfo> => {
  if (platformInfo) {
    return platformInfo;
  }

  const isCapacitor = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  platformInfo = {
    isCapacitor,
    isWeb: !isCapacitor && platform === 'web',
    isMobile: isCapacitor,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    platform: (platform as 'web' | 'android' | 'ios') || 'unknown',
  };

  return platformInfo;
};

/**
 * Check if Google Play Billing is available (Android only)
 */
export const isGooglePlayAvailable = async (): Promise<boolean> => {
  const info = await getPlatformInfo();
  return info.isAndroid;
};

/**
 * Get app version
 */
export const getAppVersion = async (): Promise<string> => {
  try {
    const info = await App.getInfo();
    return info.version;
  } catch (error) {
    console.error('Failed to get app version:', error);
    return 'unknown';
  }
};

/**
 * Get app ID
 */
export const getAppId = async (): Promise<string> => {
  try {
    const info = await App.getInfo();
    return info.id;
  } catch (error) {
    console.error('Failed to get app ID:', error);
    return 'com.digifarmacy.app';
  }
};
