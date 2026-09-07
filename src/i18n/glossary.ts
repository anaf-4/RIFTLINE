import type { StatusId, ElementId } from '../core/types';
import type { Locale } from './strings';

export const STATUS_INFO: Record<StatusId, Record<Locale, string>> = {
  vulnerable: {
    ko: '취약: 받는 피해가 50% 증가합니다. 매 턴 종료 시 1씩 감소합니다.',
    en: 'Vulnerable: Damage taken is increased by 50%. Decreases by 1 at the end of each turn.',
  },
  weak: {
    ko: '약화: 주는 피해가 25% 감소합니다. 매 턴 종료 시 1씩 감소합니다.',
    en: 'Weak: Damage dealt is reduced by 25%. Decreases by 1 at the end of each turn.',
  },
  strength: {
    ko: '힘: 공격 카드의 피해량이 수치만큼 증가합니다. 턴이 지나도 사라지지 않습니다.',
    en: 'Strength: Increases damage dealt by attacks by this amount. Does not decay over time.',
  },
  dexterity: {
    ko: '민첩: 방어막 획득량이 수치만큼 증가합니다. 턴이 지나도 사라지지 않습니다.',
    en: 'Dexterity: Increases Block gained by this amount. Does not decay over time.',
  },
  poison: {
    ko: '중독: 매 턴 시작 시 수치만큼 피해를 입고, 그 후 1씩 감소합니다.',
    en: 'Poison: Deals damage equal to its value at the start of each turn, then decreases by 1.',
  },
  bind: {
    ko: '속박: 이동(라인 전환)을 할 수 없습니다. 매 턴 종료 시 1씩 감소합니다.',
    en: 'Bind: Prevents moving between lines. Decreases by 1 at the end of each turn.',
  },
  regen: {
    ko: '재생: 매 턴 종료 시 수치만큼 체력을 회복하고, 그 후 1씩 감소합니다.',
    en: 'Regen: Heals HP equal to its value at the end of each turn, then decreases by 1.',
  },
  thorns: {
    ko: '가시: 근접 공격을 받을 때마다 상대에게 수치만큼 반사 피해를 입힙니다.',
    en: 'Thorns: Whenever you take a melee hit, reflects damage equal to its value back at the attacker.',
  },
};

export const ELEMENT_INFO: Record<ElementId, Record<Locale, string>> = {
  fire: { ko: '화염', en: 'Fire' },
  ice: { ko: '얼음', en: 'Ice' },
  lightning: { ko: '번개', en: 'Lightning' },
};

export const ELEMENT_REACTION_TEXT: Record<Locale, string> = {
  ko: '속성 마커는 최대 5까지 쌓이며 그 자체로는 피해를 주지 않습니다. 적에게 이미 마커가 있는 상태에서 다른 속성을 부여하면 즉시 반응이 발동하고 두 마커는 모두 사라집니다.\n\n화염 → 얼음: 증기 폭발 (피해 8)\n얼음 → 번개: 전도 (취약 2)\n번개 → 화염: 과열 (중독 4)',
  en: "Element marks stack up to 5 and deal no damage on their own. Applying a different element while a mark is already active triggers an instant reaction and clears both marks.\n\nFire → Ice: Steam Burst (8 damage)\nIce → Lightning: Conduction (2 Vulnerable)\nLightning → Fire: Overheat (4 Poison)",
};

export const LINE_INFO: Record<Locale, string> = {
  ko: '전열: 모든 카드를 사용할 수 있지만 받는 피해가 100%입니다.\n후열: 근접·관통 카드를 사용할 수 없지만 받는 피해가 줄어듭니다 (기본 -25%, 균열 나침반 유물 보유 시 -40%).\n\n적도 동일합니다 — 원거리 표시가 없는 적의 공격은 그 적이 후열에 있으면 닿지 않습니다. 견인/축출 카드로 적의 라인을 바꿔 공격을 무력화할 수 있습니다.',
  en: "Front line: You can use every card, but take 100% damage.\nBack line: Melee/Pierce cards are unusable, but incoming damage is reduced (-25% base, -40% with the Rift Compass relic).\n\nThe same applies to enemies — a non-ranged enemy's attack can't connect while that enemy is in the back line. Pull/Push cards can reposition an enemy to neutralize its attack.",
};
