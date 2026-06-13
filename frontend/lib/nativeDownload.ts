/**
 * Capacitor plugin wrapper for AniverseDownloadPlugin.java
 * 
 * This file provides type-safe access to the native Android download plugin.
 * Import and call these functions from anywhere in the Next.js codebase.
 */

import { registerPlugin } from '@capacitor/core';

export interface AniverseDownloadPlugin {
  startDownload(options: {
    url: string;
    filename: string;
    animeSlug: string;
    epId: string;
    title: string;
    cover?: string;
    epNum?: number;
    epTitle?: string;
    animeTitle?: string;
  }): Promise<void>;

  listDownloads(options: { animeSlug?: string }): Promise<{ files: Array<{ name: string; path: string; size: number }> }>;

  deleteDownload(options: { path: string }): Promise<{ deleted: boolean }>;
}

const AniverseDownload = registerPlugin<AniverseDownloadPlugin>('AniverseDownload');

export default AniverseDownload;

/**
 * Check if running inside the native Android APK wrapper.
 * Use this to branch between native downloads vs browser downloads.
 */
export const isNativeAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Capacitor sets this on native
  return !!(window as any).Capacitor?.isNativePlatform?.();
};
