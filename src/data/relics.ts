import type { RelicDef } from '../core/types';

export const relics: RelicDef[] = [
  // 수치형
  {
    id: 'broken_pauldron',
    name: '부서진 견갑', nameEn: 'Broken Pauldron',
    text: '전투 시작 시 방어도 6을 얻는다. (파수병 시작 유물)',
    textEn: 'Gain 6 Block at the start of combat. (Warden starting relic)',
    rarity: 'common',
    hook: 'combatStart',
    hookEffects: [{ op: 'block', value: 6 }],
  },
  {
    id: 'ember_wick',
    name: '잔불 심지', nameEn: 'Ember Wick',
    text: '전투 시작 시 무작위 적에게 화염 마커 1을 부여한다. (술사 시작 유물)',
    textEn: 'Apply 1 Fire marker to a random enemy at the start of combat. (Ember starting relic)',
    rarity: 'common',
    hook: 'combatStart',
    hookEffects: [{ op: 'elementMark', element: 'fire', value: 1 }],
  },
  {
    id: 'worn_toe',
    name: '닳은 발끝', nameEn: 'Worn Toe',
    text: '이동할 때마다 카드 1장을 뽑는다. (밀사 시작 유물)',
    textEn: 'Draw a card whenever you move to the front line. (Courier starting relic)',
    rarity: 'common',
    hook: 'onMoveFront',
    hookEffects: [{ op: 'draw', value: 1 }],
  },
  {
    id: 'vitality_core',
    name: '생명의 핵', nameEn: 'Vitality Core',
    text: '최대 HP가 8 증가한다.',
    textEn: '+8 max HP.',
    rarity: 'common',
  },
  {
    id: 'twin_greaves',
    name: '이중 각반', nameEn: 'Twin Greaves',
    text: '턴당 이동 횟수가 1 증가한다.',
    textEn: '+1 move per turn.',
    rarity: 'uncommon',
  },
  {
    id: 'rift_compass',
    name: '균열 나침반', nameEn: 'Rift Compass',
    text: '후열에 있을 때 받는 피해가 75% → 60%로 감소한다.',
    textEn: 'Back-line damage reduction improves from 75% to 60%.',
    rarity: 'uncommon',
  },
  {
    id: 'charge_signal',
    name: '돌격 신호', nameEn: 'Charge Signal',
    text: '전열로 이동할 때 힘 1을 얻는다.',
    textEn: 'Gain 1 Strength when you move to the front line.',
    rarity: 'common',
    hook: 'onMoveFront',
    hookEffects: [{ op: 'applyStatus', target: 'self', status: 'strength', value: 1 }],
  },
  {
    id: 'iron_ration',
    name: '철제 배급', nameEn: 'Iron Ration',
    text: '전투 시작 시 방어도 4를 얻는다.',
    textEn: 'Gain 4 Block at the start of combat.',
    rarity: 'common',
    hook: 'combatStart',
    hookEffects: [{ op: 'block', value: 4 }],
  },
  {
    id: 'bloodstone',
    name: '핏빛 돌', nameEn: 'Bloodstone',
    text: '적을 처치할 때마다 체력 2를 회복한다.',
    textEn: 'Restore 2 HP whenever you kill an enemy.',
    rarity: 'uncommon',
    hook: 'onKill',
    hookEffects: [{ op: 'heal', value: 2 }],
  },
  {
    id: 'focus_lens',
    name: '집중의 렌즈', nameEn: 'Focusing Lens',
    text: '매 턴 시작 시 에너지 대신 방어도 2를 얻는다.',
    textEn: 'Gain 2 Block at the start of every turn.',
    rarity: 'common',
    hook: 'turnStart',
    hookEffects: [{ op: 'block', value: 2 }],
  },
  {
    id: 'draining_husk',
    name: '메마른 껍질', nameEn: 'Draining Husk',
    text: '매 턴 종료 시 체력 1을 회복한다.',
    textEn: 'Restore 1 HP at the end of every turn.',
    rarity: 'common',
    hook: 'turnEnd',
    hookEffects: [{ op: 'heal', value: 1 }],
  },
  {
    id: 'momentum_charm',
    name: '탄력의 부적', nameEn: 'Charm of Momentum',
    text: '매 턴 시작 시 카드 1장을 추가로 뽑는다.',
    textEn: 'Draw an additional card at the start of every turn.',
    rarity: 'rare',
    hook: 'turnStart',
    hookEffects: [{ op: 'draw', value: 1 }],
  },
  {
    id: 'giant_marrow',
    name: '거인의 골수', nameEn: "Giant's Marrow",
    text: '최대 HP가 15 증가한다.',
    textEn: '+15 max HP.',
    rarity: 'uncommon',
  },
  {
    id: 'potion_belt',
    name: '물약 벨트', nameEn: 'Potion Belt',
    text: '포션 슬롯이 1 증가한다.',
    textEn: '+1 potion slot.',
    rarity: 'uncommon',
  },
  {
    id: 'warlords_banner',
    name: '전쟁군주의 깃발', nameEn: "Warlord's Banner",
    text: '전투 시작 시 힘 1을 영구적으로 얻는다.',
    textEn: 'Permanently gain 1 Strength at the start of combat.',
    rarity: 'rare',
    hook: 'combatStart',
    hookEffects: [{ op: 'applyStatus', target: 'self', status: 'strength', value: 1 }],
  },
  // 판 뒤집기형 (보스 전용)
  {
    id: 'overcharged_core',
    name: '과충전 코어', nameEn: 'Overcharged Core',
    text: '에너지 최대치 +1. 매 턴 카드를 1장 적게 뽑는다.',
    textEn: '+1 max Energy. Draw 1 fewer card each turn.',
    rarity: 'boss',
    hook: 'combatStart',
    hookEffects: [{ op: 'modifyStat', stat: 'energyMax', value: 1 }],
  },
  {
    id: 'unstable_rift',
    name: '불안정한 균열', nameEn: 'Unstable Rift',
    text: '최대 HP가 20 감소하지만, 전투 시작 시 힘 3을 얻는다.',
    textEn: '-20 max HP, but gain 3 Strength at the start of combat.',
    rarity: 'boss',
    hook: 'combatStart',
    hookEffects: [{ op: 'applyStatus', target: 'self', status: 'strength', value: 3 }],
  },
];

export const relicMap: Record<string, RelicDef> = Object.fromEntries(relics.map((r) => [r.id, r]));

export function startingRelicFor(className: string): string {
  if (className === 'ember') return 'ember_wick';
  if (className === 'courier') return 'worn_toe';
  return 'broken_pauldron';
}
