import { useGameStore } from '../store/gameStore';
import { t as translate, type StringKey } from './strings';
import type { Locale } from './strings';

export function useLocale(): Locale {
  return useGameStore((s) => s.meta.settings.language);
}

export function useT() {
  const locale = useLocale();
  return (key: StringKey, ...args: unknown[]) => translate(locale, key, ...args);
}
