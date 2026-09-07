import type { EnemyDef } from '../../core/types';

export const act2Enemies: EnemyDef[] = [
  {
    id: 'crystal_stalker',
    name: '결정 추적자',
    nameEn: 'Crystal Stalker',
    act: 2,
    line: 'front',
    hp: [80, 90],
    canMove: true,
    intents: [
      { type: 'attack', value: 14, weight: 45 },
      { type: 'move', weight: 25 },
      { type: 'attack', value: 8, times: 2, weight: 30 },
    ],
  },
  {
    id: 'warped_shade',
    name: '뒤틀린 그림자',
    nameEn: 'Warped Shade',
    act: 2,
    line: 'back',
    hp: [70, 85],
    canMove: false,
    intents: [
      { type: 'attack', value: 11, weight: 40, ranged: true },
      { type: 'debuff', status: 'weak', value: 2, weight: 30 },
      { type: 'debuff', status: 'vulnerable', value: 2, weight: 30 },
    ],
  },
  {
    id: 'thorn_construct',
    name: '가시 골렘',
    nameEn: 'Thorn Golem',
    act: 2,
    line: 'front',
    hp: [90, 100],
    canMove: false,
    intents: [
      { type: 'block', value: 14, weight: 30 },
      { type: 'attack', value: 18, weight: 45 },
      { type: 'buff', status: 'thorns', value: 3, weight: 25 },
    ],
  },
  {
    id: 'spore_swarm',
    name: '포자 무리',
    nameEn: 'Spore Swarm',
    act: 2,
    line: 'back',
    hp: [60, 75],
    canMove: false,
    intents: [
      { type: 'attack', value: 8, weight: 40, ranged: true },
      { type: 'debuff', status: 'poison', value: 5, weight: 60 },
    ],
  },
  {
    id: 'crystal_warden',
    name: '결정 파수꾼',
    nameEn: 'Crystal Warden',
    act: 2,
    line: 'front',
    hp: [190, 210],
    canMove: false,
    isElite: true,
    intents: [
      { type: 'attack', value: 26, weight: 40 },
      { type: 'buff', status: 'strength', value: 3, weight: 20 },
      { type: 'attack', value: 13, times: 2, weight: 40 },
    ],
  },
  {
    id: 'erosion_heart',
    name: '침식의 심장',
    nameEn: 'Heart of Erosion',
    act: 2,
    line: 'front',
    hp: [400, 400],
    canMove: false,
    isBoss: true,
    phase2At: 0.5,
    intents: [
      { type: 'attack', value: 28, weight: 35 },
      { type: 'attack', value: 14, times: 2, weight: 30 },
      { type: 'debuff', status: 'poison', value: 6, weight: 20 },
      { type: 'buff', status: 'strength', value: 4, weight: 15 },
    ],
  },
];

export const act2EnemyMap: Record<string, EnemyDef> = Object.fromEntries(
  act2Enemies.map((e) => [e.id, e])
);
