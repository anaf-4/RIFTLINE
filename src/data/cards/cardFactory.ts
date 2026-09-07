import type { CardDef, CardEffect, CardType, CardRange, Rarity, ClassId } from '../../core/types';

export interface CardSpec {
  id: string;
  name: string;
  nameEn: string;
  cls: ClassId | 'common' | 'curse';
  type: CardType;
  rarity: Rarity;
  cost: number;
  range: CardRange;
  effects: CardEffect[];
  upgradeEffects?: CardEffect[];
  upgradeCost?: number;
  exhaustAfterUse?: boolean;
  trigger?: 'onPlay' | 'endOfTurn';
  playable?: boolean;
}

export function card(spec: CardSpec): CardDef {
  return {
    id: spec.id,
    name: spec.name,
    nameEn: spec.nameEn,
    class: spec.cls,
    type: spec.type,
    rarity: spec.rarity,
    cost: spec.cost,
    range: spec.range,
    effects: spec.effects,
    exhaustAfterUse: spec.exhaustAfterUse,
    trigger: spec.trigger,
    playable: spec.playable,
    upgrade: spec.upgradeEffects
      ? {
          name: `${spec.name}+`,
          nameEn: `${spec.nameEn}+`,
          effects: spec.upgradeEffects,
          cost: spec.upgradeCost,
          exhaustAfterUse: spec.exhaustAfterUse,
        }
      : undefined,
  };
}

/** effects의 수치형 값들을 일괄 상향해 강화 버전 효과를 만든다. */
export function bump(effects: CardEffect[], delta: number, opsFilter?: CardEffect['op'][]): CardEffect[] {
  return effects.map((e) => {
    if (opsFilter && !opsFilter.includes(e.op)) return { ...e };
    if (e.value === undefined) return { ...e };
    return { ...e, value: e.value + delta };
  });
}
