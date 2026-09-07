import type { CardDef } from '../../core/types';

const BASE = 'assets/cards/';

const ART = {
  cleave: BASE + 'card_cleave.png',
  shieldblock: BASE + 'card_shieldblock.png',
  fireball: BASE + 'card_fireball.png',
  daggerthrow: BASE + 'card_daggerthrow.png',
  whirlwind: BASE + 'card_whirlwind.png',
  healinglight: BASE + 'card_healinglight.png',
  rage: BASE + 'card_rage.png',
  icespear: BASE + 'card_icespear.png',
  darkgrasp: BASE + 'card_darkgrasp.png',
  lightningstorm: BASE + 'card_lightningstorm.png',
  holyburst: BASE + 'card_holyburst.png',
  deathstrike: BASE + 'card_deathstrike.png',
};

/** 카드 하나하나에 전용 일러스트를 그릴 수 없어, 효과 패턴에 따라 12종 삽화를 재사용해 배정한다. */
export function getCardArt(def: CardDef): string {
  if (def.type === 'curse') return ART.darkgrasp;

  const hasOp = (op: string, status?: string, element?: string) =>
    def.effects.some((e) => e.op === op && (status ? e.status === status : true) && (element ? e.element === element : true));

  if (def.effects.some((e) => e.condition?.type === 'enemyHpBelow')) return ART.deathstrike;
  if (hasOp('elementMark', undefined, 'fire')) return ART.fireball;
  if (hasOp('elementMark', undefined, 'ice')) return ART.icespear;
  if (hasOp('elementMark', undefined, 'lightning')) return ART.lightningstorm;
  if (hasOp('heal')) return ART.healinglight;
  if (def.type === 'power') return def.class === 'scribe' ? ART.holyburst : ART.rage;
  if (hasOp('damage', undefined) && def.effects.some((e) => e.target === 'enemy_all')) return ART.whirlwind;
  if (hasOp('applyStatus', 'weak') || hasOp('applyStatus', 'vulnerable')) return ART.darkgrasp;
  if (def.type === 'skill' && hasOp('block')) return ART.shieldblock;
  if (def.type === 'attack' && def.range === 'ranged') return ART.daggerthrow;
  if (def.type === 'attack') return ART.cleave;
  if (def.class === 'scribe') return ART.holyburst;
  return ART.shieldblock;
}
