import type { EnemyDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { act1Enemies } from './act1';
import { act2Enemies } from './act2';
import { act3Enemies } from './act3';
import { act4Enemies } from './act4';

export const allEnemies: EnemyDef[] = [...act1Enemies, ...act2Enemies, ...act3Enemies, ...act4Enemies];

export const enemyMap: Record<string, EnemyDef> = Object.fromEntries(allEnemies.map((e) => [e.id, e]));

export function getEnemyDef(id: string): EnemyDef {
  const def = enemyMap[id];
  if (!def) throw new Error(`Unknown enemy id: ${id}`);
  return def;
}

function normalPool(act: 1 | 2 | 3 | 4): EnemyDef[] {
  return allEnemies.filter((e) => e.act === act && !e.isBoss && !e.isElite);
}

function elitePool(act: 1 | 2 | 3 | 4): EnemyDef[] {
  return allEnemies.filter((e) => e.act === act && e.isElite);
}

function bossPool(act: 1 | 2 | 3 | 4): EnemyDef[] {
  return allEnemies.filter((e) => e.act === act && e.isBoss);
}

export function generateEncounter(
  act: 1 | 2 | 3 | 4,
  kind: 'combat' | 'elite' | 'boss',
  rng: Rng
): string[] {
  if (kind === 'boss') {
    const pool = bossPool(act);
    return [rng.pick(pool).id];
  }
  if (kind === 'elite') {
    const pool = elitePool(act);
    return [rng.pick(pool).id];
  }
  const pool = normalPool(act);
  const count = rng.next() < 0.55 ? 1 : 2;
  const picks: string[] = [];
  for (let i = 0; i < count; i++) picks.push(rng.pick(pool).id);
  // 전열 카드가 무용지물이 되지 않도록 최소 하나는 전열 배치 보장
  const hasFront = picks.some((id) => getEnemyDef(id).line === 'front');
  if (!hasFront) {
    const frontPool = pool.filter((e) => e.line === 'front');
    if (frontPool.length > 0) picks[0] = rng.pick(frontPool).id;
  }
  return picks;
}

export { act1Enemies, act2Enemies, act3Enemies, act4Enemies };
