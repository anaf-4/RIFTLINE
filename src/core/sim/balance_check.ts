// 밸런스 점검용 스크립트. 커밋하지 않는다 (임시 분석 도구).
import { createRng } from '../rng';
import {
  createNewRun,
  travelTo,
  currentNode,
  finishCombatWin,
  generateRewardOptions,
  generateRelicReward,
  addCardToDeck,
  addRelic,
  enterAct,
  reachableNodes,
  restHeal,
  upgradeCard,
  generateShopStock,
  buyRelic,
  buyPotion,
} from '../run';
import { playCard, endPlayerTurn, canPlayCard, validTargetsForCard, useMoveAction, usePotion } from '../combat';
import { eventMap } from '../../data/events';
import { getCardDef } from '../../data/cards';
import { potionMap } from '../../data/potions';
import type { ClassId, RunState, CombatState, MapNode } from '../types';
import type { Rng } from '../rng';

// 맵 이동: 체력이 낮으면 휴식을 최우선으로, 그 다음은 전투/이벤트/상점 순으로 고른다
// (상점/휴식을 그냥 지나치고 곧장 다음 전투로 뛰어드는 게 이전 버전의 가장 큰 문제였다).
function pickNode(reachable: MapNode[], run: RunState, rng: Rng): MapNode {
  const hpRatio = run.hp / run.maxHp;
  if (hpRatio < 0.85) {
    const rest = reachable.find((n) => n.type === 'rest');
    if (rest) return rest;
  }
  if (run.gold >= 80) {
    const shop = reachable.find((n) => n.type === 'shop');
    if (shop) return shop;
  }
  const nonElite = reachable.filter((n) => n.type !== 'elite' || hpRatio > 0.8);
  return rng.pick(nonElite.length > 0 ? nonElite : reachable);
}

function scoreCard(defId: string, hpRatio: number): number {
  // 체력이 낮으면 방어/회복류를 우선시하는 아주 단순한 휴리스틱.
  // 카드 이름 패턴 매칭은 warden_bulwark처럼 실제로 방어 카드인데 매칭이 안 되는 경우가 있어
  // 효과 목록(op)을 직접 보고 판단한다.
  const effects = getCardDef(defId).effects;
  const isBlockish = effects.some((e) => e.op === 'block');
  const isHealish = effects.some((e) => e.op === 'heal' && (e.value ?? 0) > 0);
  let score = 0;
  if (hpRatio < 0.5 && (isBlockish || isHealish)) score += 10;
  if (hpRatio >= 0.5) score += 1; // 평소엔 아무 카드나 (공격 우선 경향)
  return score;
}

function playOneTurn(run: RunState, rng: Rng): RunState {
  let r = run;
  if (!r.combat) return r;

  // 체력이 위험하면 회복 포션부터 쓴다
  if (r.combat.player.hp / r.combat.player.maxHp < 0.35) {
    const potionSlot = r.potions.findIndex((id) => id && (potionMap[id]?.effects ?? []).some((e) => e.op === 'heal' && (e.value ?? 0) > 0));
    if (potionSlot !== -1) {
      const potionId = r.potions[potionSlot]!;
      const combat = usePotion(r.combat, potionMap[potionId].effects);
      const potions = r.potions.slice();
      potions[potionSlot] = null;
      r = { ...r, combat, potions };
    }
  }

  // 체력이 낮고 후열 회피가 가능하면 후퇴한다 (밀사/술사처럼 후열 의존 클래스에게 특히 중요)
  const hpRatioStart = r.combat.player.hp / r.combat.player.maxHp;
  if (
    hpRatioStart < 0.45 &&
    r.combat.player.line === 'front' &&
    r.combat.player.movesUsed < r.combat.player.movesPerTurn &&
    r.combat.player.energy >= r.combat.moveEnergyCost
  ) {
    r = { ...r, combat: useMoveAction(r.combat) };
  }

  let guard = 0;
  while (r.combat.turnPhase === 'player' && guard < 20) {
    guard++;
    const hpRatio = r.combat.player.hp / r.combat.player.maxHp;
    const playable = r.combat.hand.filter((c) => canPlayCard(r.combat!, c.uid).ok);
    if (playable.length === 0) break;
    playable.sort((a, b) => scoreCard(b.defId, hpRatio) - scoreCard(a.defId, hpRatio));
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

function runCombatToEnd(run: RunState, rng: Rng, maxTurns: number): RunState {
  let r = run;
  let turns = 0;
  while (r.combat && r.combat.turnPhase !== 'won' && r.combat.turnPhase !== 'lost') {
    r = playOneTurn(r, rng);
    turns++;
    if (turns > maxTurns) break;
  }
  return r;
}

interface SimResult {
  win: boolean;
  actReached: number;
  turnsTotal: number;
  deathCause: string | null;
  combatsCleared: number;
  hpHistory: number[];
}

function simulateRun(className: ClassId, ascension: number, seed: number): SimResult {
  const rng = createRng(seed);
  let { run } = createNewRun(className, ascension, seed);
  let turnsTotal = 0;
  let combatsCleared = 0;
  const hpHistory: number[] = [run.hp];
  let guardNodes = 0;
  while (guardNodes < 300) {
    guardNodes++;
    const reachable = reachableNodes(run);
    if (reachable.length === 0) return { win: false, actReached: run.act, turnsTotal, deathCause: 'dead-end', combatsCleared, hpHistory };
    const pick = pickNode(reachable, run, rng);
    run = travelTo(run, pick.id, rng);
    const node = currentNode(run)!;

    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      run = runCombatToEnd(run, rng, 60);
      if (!run.combat) continue;
      turnsTotal += run.combat.turn;
      if (run.combat.turnPhase === 'lost') {
        return { win: false, actReached: run.act, turnsTotal, deathCause: `${node.type}:${node.enemyIds?.join(',')}`, combatsCleared, hpHistory };
      }
      combatsCleared++;
      hpHistory.push(run.combat.player.hp);
      const wasBoss = node.type === 'boss';
      run = finishCombatWin(run);
      const options = generateRewardOptions(run, rng);
      if (options[0]) run = addCardToDeck(run, options[0]);
      if (rng.next() < 0.3) {
        const relicId = generateRelicReward(run, rng);
        if (relicId) run = addRelic(run, relicId);
      }
      if (wasBoss) {
        if (run.act >= 3) return { win: true, actReached: run.act, turnsTotal, deathCause: null, combatsCleared, hpHistory };
        run = enterAct(run, (run.act + 1) as 1 | 2 | 3 | 4, rng);
      }
    } else if (node.type === 'event') {
      const ev = eventMap[node.eventId!];
      if (ev) {
        const choice = ev.choices.find((c) => !c.addCurse) ?? ev.choices[0];
        run.gold = Math.max(0, run.gold + (choice.goldDelta ?? 0));
      }
    } else if (node.type === 'rest') {
      if (run.hp / run.maxHp < 0.9) {
        run = restHeal(run);
      } else {
        const upgradeable = run.deck.filter((c) => !c.upgraded && getCardDef(c.defId).upgrade);
        if (upgradeable.length > 0) run = upgradeCard(run, rng.pick(upgradeable).uid);
        else run = restHeal(run);
      }
    } else if (node.type === 'shop') {
      const stock = generateShopStock(run, rng);
      // 저렴한 순으로 정렬해 살 수 있는 유물을 최대한 산다
      const relicOrder = stock.relicPrices
        .map((price, i) => ({ price, i }))
        .sort((a, b) => a.price - b.price);
      for (const { i } of relicOrder) {
        if (run.gold >= stock.relicPrices[i]) run = buyRelic(run, stock, i);
      }
      if (run.potions.includes(null)) {
        const potionOrder = stock.potionPrices
          .map((price, i) => ({ price, i }))
          .sort((a, b) => a.price - b.price);
        for (const { i } of potionOrder) {
          if (run.gold >= stock.potionPrices[i] && run.potions.includes(null)) run = buyPotion(run, stock, i);
        }
      }
    }
  }
  return { win: false, actReached: run.act, turnsTotal, deathCause: 'guard-limit', combatsCleared, hpHistory };
}

function runCli() {
  const N = Number(process.argv[2] ?? 40);
  const classes: ClassId[] = ['warden', 'ember', 'courier', 'scribe'];
  const causeCounts: Record<string, number> = {};
  for (const cls of classes) {
    let wins = 0;
    const actCounts: Record<number, number> = {};
    const combatsCounts: number[] = [];
    let sampleLoss: SimResult | null = null;
    for (let i = 0; i < N; i++) {
      const result = simulateRun(cls, 0, 5000 + i);
      if (result.win) wins++;
      else if (!sampleLoss || result.combatsCleared > sampleLoss.combatsCleared) sampleLoss = result;
      actCounts[result.actReached] = (actCounts[result.actReached] ?? 0) + 1;
      combatsCounts.push(result.combatsCleared);
      if (!result.win && result.deathCause) {
        const key = result.deathCause.split(':')[0] + ':' + (result.deathCause.split(':')[1]?.split(',')[0] ?? '');
        causeCounts[key] = (causeCounts[key] ?? 0) + 1;
      }
    }
    const avgCombats = (combatsCounts.reduce((a, b) => a + b, 0) / N).toFixed(1);
    const maxCombats = Math.max(...combatsCounts);
    console.log(
      `[${cls}] 승률 ${wins}/${N} (${((wins / N) * 100).toFixed(1)}%) | 도달 막: ${JSON.stringify(actCounts)} | 평균 클리어 전투 수: ${avgCombats} (최고 ${maxCombats})`
    );
    if (sampleLoss) console.log(`  최장 생존 사망 예시: ${sampleLoss.deathCause}, HP추이=${sampleLoss.hpHistory.join('→')}`);
  }
  console.log('\n사망 원인 상위:');
  const sorted = Object.entries(causeCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [k, v] of sorted) console.log(`  ${k}: ${v}`);
}

runCli();
