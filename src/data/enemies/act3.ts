import type { EnemyDef } from '../../core/types';

export const act3Enemies: EnemyDef[] = [
  {
    id: 'void_wraith',
    name: '공허의 망령',
    nameEn: 'Void Wraith',
    act: 3,
    line: 'back',
    hp: [130, 145],
    canMove: false,
    intents: [
      { type: 'attack', value: 22, weight: 35 },
      { type: 'debuff', status: 'weak', value: 2, weight: 25 },
      { type: 'debuff', status: 'vulnerable', value: 2, weight: 20 },
      { type: 'attack', value: 11, times: 2, weight: 20 },
    ],
  },
  {
    id: 'gravity_horror',
    name: '중력 공포',
    nameEn: 'Gravity Horror',
    act: 3,
    line: 'front',
    hp: [140, 150],
    canMove: false,
    intents: [
      { type: 'attack', value: 30, weight: 40 },
      { type: 'block', value: 20, weight: 30 },
      { type: 'debuff', status: 'bind', value: 2, weight: 30 },
    ],
  },
  {
    id: 'ember_wisp',
    name: '불씨 도깨비',
    nameEn: 'Ember Wisp',
    act: 3,
    line: 'back',
    hp: [110, 125],
    canMove: true,
    intents: [
      { type: 'attack', value: 14, weight: 40 },
      { type: 'debuff', status: 'poison', value: 8, weight: 40 },
      { type: 'move', weight: 20 },
    ],
  },
  {
    id: 'iron_colossus',
    name: '강철 거상',
    nameEn: 'Iron Colossus',
    act: 3,
    line: 'front',
    hp: [150, 165],
    canMove: false,
    intents: [
      { type: 'attack', value: 35, weight: 45 },
      { type: 'attack', value: 16, times: 2, weight: 35 },
      { type: 'buff', status: 'strength', value: 3, weight: 20 },
    ],
  },
  {
    id: 'rift_behemoth',
    name: '균열 거수',
    nameEn: 'Rift Behemoth',
    act: 3,
    line: 'front',
    hp: [300, 320],
    canMove: false,
    isElite: true,
    intents: [
      { type: 'attack', value: 38, weight: 40 },
      { type: 'attack', value: 18, times: 2, weight: 30 },
      { type: 'debuff', status: 'vulnerable', value: 2, weight: 30 },
    ],
  },
  {
    id: 'hollow_sovereign',
    name: '공동의 군주',
    nameEn: 'Hollow Sovereign',
    act: 3,
    line: 'front',
    hp: [600, 600],
    canMove: false,
    isBoss: true,
    phase2At: 0.5,
    intents: [
      { type: 'attack', value: 34, weight: 30 },
      { type: 'attack', value: 17, times: 2, weight: 30 },
      { type: 'buff', status: 'strength', value: 5, weight: 20 },
      { type: 'debuff', status: 'vulnerable', value: 3, weight: 20 },
    ],
  },
];

export const act3EnemyMap: Record<string, EnemyDef> = Object.fromEntries(
  act3Enemies.map((e) => [e.id, e])
);
