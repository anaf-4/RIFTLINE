import type { CardDef } from '../../core/types';
import { describeCardEffects, type Locale } from '../../i18n/effectText';

export function renderCardText(def: CardDef, upgraded: boolean, locale: Locale = 'ko'): string {
  const effects = upgraded && def.upgrade ? def.upgrade.effects : def.effects;
  const manual = upgraded && def.upgrade ? (locale === 'ko' ? def.upgrade.text : def.upgrade.textEn) : locale === 'ko' ? def.text : def.textEn;
  if (manual) return manual;

  const exhaustAfterUse = upgraded && def.upgrade?.exhaustAfterUse !== undefined ? def.upgrade.exhaustAfterUse : def.exhaustAfterUse;
  return describeCardEffects(effects, locale, { trigger: def.trigger, exhaustAfterUse });
}

export function cardCost(def: CardDef, upgraded: boolean): number {
  if (upgraded && def.upgrade?.cost !== undefined) return def.upgrade.cost;
  return def.cost;
}

export function cardName(def: CardDef, upgraded: boolean, locale: Locale = 'ko'): string {
  if (locale === 'en') {
    if (upgraded && def.upgrade) return def.upgrade.nameEn ?? (def.nameEn ? `${def.nameEn}+` : `${def.name}+`);
    return def.nameEn ?? def.name;
  }
  if (upgraded && def.upgrade) return def.upgrade.name;
  return def.name;
}

export const rangeIcon: Record<string, string> = {
  melee: '⚔',
  ranged: '➹',
  pierce: '⇢',
};

export const typeColor: Record<string, string> = {
  attack: 'var(--card-attack)',
  skill: 'var(--card-skill)',
  power: 'var(--card-power)',
  status: '#555',
  curse: 'var(--card-curse)',
};
