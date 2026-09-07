import type { EnemyDef } from '../../core/types';

export const act1Enemies: EnemyDef[] = [
  {
    id: 'rift_hound',
    name: '균열 사냥개',
    nameEn: 'Rift Hound',
    act: 1,
    line: 'front',
    hp: [42, 48],
    canMove: false,
    intents: [
      { type: 'attack', value: 9, weight: 50 },
      { type: 'attack', value: 5, times: 2, weight: 30 },
      { type: 'buff', status: 'strength', value: 2, weight: 20 },
    ],
  },
  {
    id: 'rift_crawler',
    name: '균열 포복자',
    nameEn: 'Rift Crawler',
    act: 1,
    line: 'back',
    hp: [35, 42],
    canMove: true,
    intents: [
      { type: 'attack', value: 7, weight: 55, ranged: true },
      { type: 'move', weight: 25 },
      { type: 'debuff', status: 'weak', value: 1, weight: 20 },
    ],
  },
  {
    id: 'broken_sentinel',
    name: '부서진 파수상',
    nameEn: 'Broken Sentinel',
    act: 1,
    line: 'front',
    hp: [50, 60],
    canMove: false,
    intents: [
      { type: 'attack', value: 12, weight: 40 },
      { type: 'block', value: 10, weight: 30 },
      { type: 'attack', value: 6, times: 2, weight: 30 },
    ],
  },
  {
    id: 'rift_swarm',
    name: '균열 무리',
    nameEn: 'Rift Swarm',
    act: 1,
    line: 'back',
    hp: [30, 36],
    canMove: false,
    intents: [
      { type: 'attack', value: 4, weight: 50, ranged: true },
      { type: 'debuff', status: 'poison', value: 3, weight: 50 },
    ],
  },
  {
    id: 'warden_breaker',
    name: '파쇄자',
    nameEn: 'Breaker',
    act: 1,
    line: 'front',
    hp: [110, 130],
    canMove: false,
    isElite: true,
    intents: [
      { type: 'attack', value: 18, weight: 45 },
      { type: 'debuff', status: 'vulnerable', value: 2, weight: 20 },
      { type: 'attack', value: 9, times: 2, weight: 35 },
    ],
  },
  {
    id: 'hollow_knight',
    name: '공동의 기사',
    nameEn: 'Hollow Knight',
    act: 1,
    line: 'front',
    hp: [250, 250],
    canMove: false,
    isBoss: true,
    phase2At: 0.5,
    intents: [
      { type: 'attack', value: 20, weight: 40 },
      { type: 'attack', value: 10, times: 2, weight: 30 },
      { type: 'buff', status: 'strength', value: 3, weight: 15 },
      { type: 'debuff', status: 'vulnerable', value: 2, weight: 15 },
    ],
  },
];

export const act1EnemyMap: Record<string, EnemyDef> = Object.fromEntries(
  act1Enemies.map((e) => [e.id, e])
);
