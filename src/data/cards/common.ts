import type { CardDef } from '../../core/types';
import { card } from './cardFactory';

// 공용 카드 — 모든 클래스가 보상/상점에서 얻을 수 있다
export const commonCards: CardDef[] = [
  card({
    id: 'common_secondwind', name: '재정비', nameEn: 'Second Wind', cls: 'common', type: 'skill', rarity: 'common',
    cost: 1, range: null,
    effects: [{ op: 'draw', value: 2 }],
    upgradeEffects: [{ op: 'draw', value: 3 }],
  }),
  card({
    id: 'common_retreat', name: '후퇴', nameEn: 'Retreat', cls: 'common', type: 'skill', rarity: 'common',
    cost: 1, range: null,
    effects: [{ op: 'move', to: 'back' }, { op: 'block', value: 6 }],
    upgradeEffects: [{ op: 'move', to: 'back' }, { op: 'block', value: 9 }],
  }),
  card({
    id: 'common_focus', name: '집중', nameEn: 'Focus', cls: 'common', type: 'skill', rarity: 'uncommon',
    cost: 0, range: null, exhaustAfterUse: true,
    effects: [{ op: 'energy', value: 1 }],
    upgradeEffects: [{ op: 'energy', value: 1 }],
    upgradeCost: 0,
  }),
  card({
    id: 'common_potionofstrength', name: '괴력의 비약', nameEn: 'Draught of Might', cls: 'common', type: 'power', rarity: 'uncommon',
    cost: 1, range: null,
    effects: [{ op: 'applyStatus', target: 'self', status: 'strength', value: 1 }],
    upgradeEffects: [{ op: 'applyStatus', target: 'self', status: 'strength', value: 2 }],
  }),
  card({
    id: 'common_potionofguard', name: '수호의 비약', nameEn: 'Draught of Guarding', cls: 'common', type: 'power', rarity: 'uncommon',
    cost: 1, range: null,
    effects: [{ op: 'applyStatus', target: 'self', status: 'dexterity', value: 1 }],
    upgradeEffects: [{ op: 'applyStatus', target: 'self', status: 'dexterity', value: 2 }],
  }),
  card({
    id: 'common_scavenge', name: '노획', nameEn: 'Scavenge', cls: 'common', type: 'skill', rarity: 'common',
    cost: 1, range: null,
    effects: [{ op: 'block', value: 7 }, { op: 'draw', value: 1 }],
    upgradeEffects: [{ op: 'block', value: 10 }, { op: 'draw', value: 1 }],
  }),
  card({
    id: 'common_adrenaline', name: '아드레날린', nameEn: 'Adrenaline', cls: 'common', type: 'skill', rarity: 'uncommon',
    cost: 0, range: null, exhaustAfterUse: true,
    effects: [{ op: 'energy', value: 2 }, { op: 'draw', value: 1 }],
    upgradeEffects: [{ op: 'energy', value: 2 }, { op: 'draw', value: 2 }],
  }),
  card({
    id: 'common_panichealing', name: '응급 처치', nameEn: 'Emergency Treatment', cls: 'common', type: 'skill', rarity: 'common',
    cost: 1, range: null,
    effects: [{ op: 'heal', value: 7 }],
    upgradeEffects: [{ op: 'heal', value: 11 }],
  }),
  card({
    id: 'common_ironstomach', name: '무쇠 위장', nameEn: 'Iron Stomach', cls: 'common', type: 'power', rarity: 'common',
    cost: 1, range: null,
    effects: [{ op: 'modifyStat', stat: 'maxHp', value: 4 }],
    upgradeEffects: [{ op: 'modifyStat', stat: 'maxHp', value: 6 }],
  }),
  card({
    id: 'common_hoard', name: '비상금', nameEn: "Nest Egg", cls: 'common', type: 'skill', rarity: 'common',
    cost: 0, range: null, exhaustAfterUse: true,
    effects: [{ op: 'block', value: 5 }],
    upgradeEffects: [{ op: 'block', value: 8 }],
  }),
  card({
    id: 'common_survivalinstinct', name: '생존 본능', nameEn: 'Survival Instinct', cls: 'common', type: 'skill', rarity: 'uncommon',
    cost: 1, range: null,
    effects: [{ op: 'block', value: 8 }, { op: 'draw', value: 1 }],
    upgradeEffects: [{ op: 'block', value: 11 }, { op: 'draw', value: 1 }],
  }),
  card({
    id: 'common_deepbreath', name: '심호흡', nameEn: 'Deep Breath', cls: 'common', type: 'skill', rarity: 'common',
    cost: 0, range: null,
    effects: [{ op: 'draw', value: 1 }],
    upgradeEffects: [{ op: 'draw', value: 2 }],
  }),
  card({
    id: 'common_forcedmarch', name: '강행군', nameEn: 'Forced March', cls: 'common', type: 'skill', rarity: 'common',
    cost: 1, range: null,
    effects: [{ op: 'move', to: 'toggle' }, { op: 'block', value: 5 }],
    upgradeEffects: [{ op: 'move', to: 'toggle' }, { op: 'block', value: 8 }],
  }),
  card({
    id: 'common_grit', name: '근성', nameEn: 'Grit', cls: 'common', type: 'power', rarity: 'common',
    cost: 1, range: null,
    effects: [{ op: 'applyStatus', target: 'self', status: 'regen', value: 2 }],
    upgradeEffects: [{ op: 'applyStatus', target: 'self', status: 'regen', value: 4 }],
  }),
  card({
    id: 'common_windfall', name: '뜻밖의 횡재', nameEn: 'Windfall', cls: 'common', type: 'skill', rarity: 'rare',
    cost: 2, range: null,
    effects: [{ op: 'draw', value: 3 }, { op: 'energy', value: 1 }],
    upgradeEffects: [{ op: 'draw', value: 4 }, { op: 'energy', value: 1 }],
  }),
];
