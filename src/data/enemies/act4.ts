import type { EnemyDef } from '../../core/types';

// 4막 「균열 너머」 — 전 클래스로 3막 보스를 처치해야 해금되는 히든 보스
export const act4Enemies: EnemyDef[] = [
  {
    id: 'the_unmade',
    name: '형상 없는 것',
    nameEn: 'The Unmade',
    act: 4,
    line: 'front',
    hp: [800, 800],
    canMove: false,
    isBoss: true,
    phase2At: 0.4,
    intents: [
      { type: 'attack', value: 40, weight: 30 },
      { type: 'attack', value: 18, times: 3, weight: 25 },
      { type: 'buff', status: 'strength', value: 5, weight: 20 },
      { type: 'debuff', status: 'vulnerable', value: 3, weight: 15 },
      { type: 'debuff', status: 'weak', value: 3, weight: 10 },
    ],
  },
];

export const act4EnemyMap: Record<string, EnemyDef> = Object.fromEntries(
  act4Enemies.map((e) => [e.id, e])
);
