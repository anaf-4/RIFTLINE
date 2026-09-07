import type { CardEffect } from '../core/types';

export interface PotionDef {
  id: string;
  name: string;
  nameEn: string;
  text: string;
  textEn: string;
  rarity: 'common' | 'uncommon' | 'rare';
  effects: CardEffect[];
}

export const potions: PotionDef[] = [
  {
    id: 'minor_healing',
    name: '소형 치유 물약', nameEn: 'Minor Healing Potion',
    text: '체력 15를 회복한다.', textEn: 'Restore 15 HP.',
    rarity: 'common',
    effects: [{ op: 'heal', value: 15 }],
  },
  {
    id: 'stoneskin',
    name: '돌비늘 물약', nameEn: 'Stoneskin Potion',
    text: '방어도 12를 얻는다.', textEn: 'Gain 12 Block.',
    rarity: 'common',
    effects: [{ op: 'block', value: 12 }],
  },
  {
    id: 'quicksilver',
    name: '수은 물약', nameEn: 'Quicksilver Potion',
    text: '에너지 2를 얻는다.', textEn: 'Gain 2 Energy.',
    rarity: 'uncommon',
    effects: [{ op: 'energy', value: 2 }],
  },
  {
    id: 'giant_draught',
    name: '거인의 영약', nameEn: "Giant's Draught",
    text: '힘 3을 얻는다 (전투 한정).', textEn: 'Gain 3 Strength (this combat only).',
    rarity: 'uncommon',
    effects: [{ op: 'applyStatus', target: 'self', status: 'strength', value: 3 }],
  },
  {
    id: 'swift_tincture',
    name: '신속의 팅크제', nameEn: 'Swift Tincture',
    text: '다음 턴 이동 횟수 +1 (즉시 이동 가능).', textEn: '+1 move this turn.',
    rarity: 'common',
    effects: [{ op: 'modifyStat', stat: 'movesPerTurn', value: 1 }],
  },
  {
    id: 'elixir_of_focus',
    name: '집중의 비약', nameEn: 'Elixir of Focus',
    text: '카드 3장을 뽑는다.', textEn: 'Draw 3 cards.',
    rarity: 'rare',
    effects: [{ op: 'draw', value: 3 }],
  },
];

export const potionMap: Record<string, PotionDef> = Object.fromEntries(
  potions.map((p) => [p.id, p])
);
