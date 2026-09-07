import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface Platform {
  save(key: string, value: string): Promise<void>;
  load(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
  isMobile(): boolean;
}

declare global {
  interface Window {
    riftlineElectron?: {
      save(key: string, value: string): Promise<void>;
      load(key: string): Promise<string | null>;
      remove(key: string): Promise<void>;
    };
  }
}

const webPlatform: Platform = {
  async save(key, value) {
    localStorage.setItem(key, value);
  },
  async load(key) {
    return localStorage.getItem(key);
  },
  async remove(key) {
    localStorage.removeItem(key);
  },
  isMobile() {
    return /Android|iPhone/i.test(navigator.userAgent);
  },
};

const capacitorPlatform: Platform = {
  async save(key, value) {
    await Preferences.set({ key, value });
  },
  async load(key) {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async remove(key) {
    await Preferences.remove({ key });
  },
  isMobile() {
    return true;
  },
};

function detectPlatform(): Platform {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    return capacitorPlatform;
  }
  if (typeof window !== 'undefined' && window.riftlineElectron) {
    const bridge = window.riftlineElectron;
    return {
      save: bridge.save,
      load: bridge.load,
      remove: bridge.remove,
      isMobile: () => false,
    };
  }
  return webPlatform;
}

export const platform: Platform = typeof window !== 'undefined' ? detectPlatform() : webPlatform;
