// 콘솔에서 단독 실행 가능한 자동 플레이 시뮬레이터.
// core 로직만 사용, DOM/React 의존 없음. 밸런싱 정밀 분석용이 아니라 크래시/무한루프 스모크 테스트용.
import { createRng } from '../rng';
import {
  createNewRun,
  travelTo,
  reachableNodes,
  currentNode,
  finishCombatWin,
  generateRewardOptions,
  generateRelicReward,
  addCardToDeck,
  addRelic,
  enterAct,
  restHeal,
} from '../run';
import { playCard, endPlayerTurn, canPlayCard, validTargetsForCard } from '../combat';
import { eventMap } from '../../data/events';
import type { ClassId, RunState } from '../types';

function playOneTurn(run: RunState, rng: ReturnType<typeof createRng>): RunState {
  let r = run;
  if (!r.combat) return r;

  let guard = 0;
  while (r.combat.turnPhase === 'player' && guard < 20) {
    guard++;
    const playable = r.combat.hand.filter((c) => canPlayCard(r.combat!, c.uid).ok);
    if (playable.length === 0) break;
    const choice = playable[0];
    const targets = validTargetsForCard(r.combat, choice.uid);
    try {
      const combat = playCard(r.combat, choice.uid, rng, { chosenTargetUid: targets[0] });
      r = { ...r, combat };
    } catch {
      break;
    }
  }
  if (r.combat.turnPhase === 'player') {
    const combat = endPlayerTurn(r.combat, rng);
    r = { ...r, combat };
  }
  return r;
}

function runCombatToEnd(run: RunState, rng: ReturnType<typeof createRng>, maxTurns: number): RunState {
  let r = run;
  let turns = 0;
  while (r.combat && r.combat.turnPhase !== 'won' && r.combat.turnPhase !== 'lost') {
    r = playOneTurn(r, rng);
    turns++;
    if (turns > maxTurns) break;
  }
  return r;
}

export function simulateRun(
  className: ClassId,
  ascension: number,
  seed: number,
  maxTurnsPerFight = 60
): { win: boolean; act: number; log: string[] } {
  const rng = createRng(seed);
  let { run } = createNewRun(className, ascension, seed);
  const log: string[] = [];

  let guardNodes = 0;
  while (guardNodes < 200) {
    guardNodes++;
    const reachable = reachableNodes(run);
    if (reachable.length === 0) {
      log.push('no reachable nodes (dead end)');
      return { win: false, act: run.act, log };
    }
    const pick = rng.pick(reachable);
    run = travelTo(run, pick.id, rng);
    const node = currentNode(run)!;

    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      run = runCombatToEnd(run, rng, maxTurnsPerFight);
      if (!run.combat) continue;
      if (run.combat.turnPhase === 'lost') {
        log.push(`Lost act ${run.act} vs ${node.enemyIds?.join(',')} `);
        return { win: false, act: run.act, log };
      }
      const wasBoss = node.type === 'boss';
      run = finishCombatWin(run);
      const options = generateRewardOptions(run, rng);
      if (options[0]) run = addCardToDeck(run, options[0]);
      if (rng.next() < 0.3) {
        const relicId = generateRelicReward(run, rng);
        if (relicId) run = addRelic(run, relicId);
      }
      log.push(`Won act ${run.act} node (${node.type}), hp ${run.hp}/${run.maxHp}`);
      if (wasBoss) {
        if (run.act >= 3) {
          log.push('RUN CLEARED');
          return { win: true, act: run.act, log };
        }
        run = enterAct(run, (run.act + 1) as 1 | 2 | 3 | 4, rng);
      }
    } else if (node.type === 'event') {
      const ev = eventMap[node.eventId!];
      if (ev) {
        // 저주 회피, 이득 위주로 첫 안전한 선택지를 고른다
        const choice = ev.choices.find((c) => !c.addCurse) ?? ev.choices[0];
        run.gold = Math.max(0, run.gold + (choice.goldDelta ?? 0));
      }
    } else if (node.type === 'rest') {
      run = restHeal(run);
    } else if (node.type === 'shop') {
      // 봇은 상점에서 아무것도 사지 않고 지나간다
    }
  }
  log.push('guard limit reached');
  return { win: false, act: run.act, log };
}

export function runCli() {
  const N = Number(process.argv[2] ?? 10);
  const classes: ClassId[] = ['warden', 'ember', 'courier', 'scribe'];
  let wins = 0;
  let total = 0;
  for (const cls of classes) {
    for (let i = 0; i < N; i++) {
      total++;
      const result = simulateRun(cls, 0, 2000 + i);
      if (result.win) wins++;
      console.log(`[${cls}] seed ${2000 + i}: ${result.win ? 'WIN' : 'LOSE'} at act ${result.act}`);
      if (!result.win) console.log('  ' + result.log.slice(-3).join('\n  '));
    }
  }
  console.log(`\n승률: ${wins}/${total} (${((wins / total) * 100).toFixed(1)}%)`);
}

runCli();
