// 카드 수치 감사 — 문서 3장 코스트 기준선과 비교해 이상치를 찾는다. 커밋하지 않는다.
import { allCards } from '../../data/cards';
import type { CardEffect } from '../types';

const DMG_BASELINE: Record<number, [number, number]> = { 0: [3, 4], 1: [6, 9], 2: [14, 16], 3: [22, 24] };
const BLOCK_BASELINE: Record<number, [number, number]> = { 0: [4, 4], 1: [8, 10], 2: [16, 18], 3: [24, 27] };
const TOLERANCE = 1.3; // 조건부 최대 +30%

function primaryValue(effects: CardEffect[], op: 'damage' | 'damageMulti' | 'block'): number | null {
  const found = effects.find((e) => e.op === op);
  if (!found || found.value === undefined) return null;
  if (op === 'damageMulti') return found.value * (found.times ?? 1);
  return found.value;
}

let flagged = 0;
for (const def of allCards) {
  if (def.type === 'curse' || def.type === 'status' || def.cost < 0) continue;
  const effects = def.effects;
  const dmg = primaryValue(effects, 'damage') ?? primaryValue(effects, 'damageMulti');
  const block = primaryValue(effects, 'block');
  const hasExtra = effects.length > 1 || !!effects[0]?.condition;

  if (dmg !== null) {
    const [lo, hi] = DMG_BASELINE[def.cost] ?? [0, 999];
    const maxAllowed = hi * (hasExtra ? TOLERANCE : 1.05);
    if (dmg > maxAllowed) {
      console.log(`[DMG 과다] ${def.id} (${def.class}, cost${def.cost}): ${dmg} > 허용 ${maxAllowed.toFixed(1)} (기준 ${lo}-${hi})`);
      flagged++;
    } else if (dmg < lo * 0.6 && def.cost > 0) {
      console.log(`[DMG 부족] ${def.id} (${def.class}, cost${def.cost}): ${dmg} < 기준 ${lo}`);
      flagged++;
    }
  }
  if (block !== null) {
    const [lo, hi] = BLOCK_BASELINE[def.cost] ?? [0, 999];
    const maxAllowed = hi * (hasExtra ? TOLERANCE : 1.05);
    if (block > maxAllowed) {
      console.log(`[BLOCK 과다] ${def.id} (${def.class}, cost${def.cost}): ${block} > 허용 ${maxAllowed.toFixed(1)} (기준 ${lo}-${hi})`);
      flagged++;
    }
  }

  // 강화 버전도 점검 (강화는 +30% 정도까지 자연스러움 → 기준을 완화)
  if (def.upgrade) {
    const uDmg = primaryValue(def.upgrade.effects, 'damage') ?? primaryValue(def.upgrade.effects, 'damageMulti');
    const uBlock = primaryValue(def.upgrade.effects, 'block');
    const cost = def.upgrade.cost ?? def.cost;
    if (uDmg !== null) {
      const [, hi] = DMG_BASELINE[cost] ?? [0, 999];
      const maxAllowed = hi * 1.45;
      if (uDmg > maxAllowed) {
        console.log(`[강화 DMG 과다] ${def.id}+ (cost${cost}): ${uDmg} > 허용 ${maxAllowed.toFixed(1)}`);
        flagged++;
      }
    }
    if (uBlock !== null) {
      const [, hi] = BLOCK_BASELINE[cost] ?? [0, 999];
      const maxAllowed = hi * 1.45;
      if (uBlock > maxAllowed) {
        console.log(`[강화 BLOCK 과다] ${def.id}+ (cost${cost}): ${uBlock} > 허용 ${maxAllowed.toFixed(1)}`);
        flagged++;
      }
    }
  }
}
console.log(`\n총 카드 ${allCards.length}장 중 ${flagged}건 플래그됨`);
