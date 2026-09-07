import type {
  CombatState,
  CardInstance,
  CardEffect,
  EnemyInstance,
  PlayerState,
  Line,
  IntentDef,
  StatusId,
  ElementId,
  ImprintId,
  ClassId,
} from './types';
import type { Rng } from './rng';
import { getCardDef } from '../data/cards';
import { getEnemyDef } from '../data/enemies';
import { relicMap } from '../data/relics';
import { drawCards, shuffleDeck } from './deck';
import { computeAscensionMods } from './ascension';

let logCounter = 0;
function log(state: CombatState, text: string) {
  logCounter += 1;
  state.log.push({ id: `l${logCounter}`, text });
  if (state.log.length > 60) state.log.shift();
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

function statusVal(statuses: Record<string, number>, id: StatusId): number {
  return statuses[id] ?? 0;
}

function addStatus(statuses: Record<string, number>, id: StatusId, value: number) {
  statuses[id] = (statuses[id] ?? 0) + value;
  if (statuses[id] <= 0) delete statuses[id];
}

function livingEnemies(state: CombatState): EnemyInstance[] {
  return state.enemies.filter((e) => e.hp > 0);
}

function checkOutcome(state: CombatState) {
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.turnPhase = 'lost';
    return;
  }
  if (livingEnemies(state).length === 0) {
    state.turnPhase = 'won';
  }
}

function runRelicHook(state: CombatState, hook: 'combatStart' | 'turnStart' | 'turnEnd' | 'onKill' | 'onMoveFront', rng: Rng) {
  for (const relicId of state.relics) {
    const def = relicMap[relicId];
    if (!def || def.hook !== hook || !def.hookEffects) continue;
    for (const eff of def.hookEffects) {
      applyEffect(state, eff, { source: 'player', rng });
    }
    log(state, `${def.name} 발동.`);
  }
}

// ---------- 전투 시작 ----------

export function startCombat(
  enemyIds: string[],
  deck: CardInstance[],
  relics: string[],
  playerHp: number,
  playerMaxHp: number,
  movesPerTurnBase: number,
  ascension: number,
  className: ClassId,
  rng: Rng
): CombatState {
  const mods = computeAscensionMods(ascension);
  const player: PlayerState = {
    hp: playerHp,
    maxHp: playerMaxHp,
    energy: 3,
    energyMax: 3,
    block: 0,
    line: 'front',
    statuses: {},
    movesUsed: 0,
    movesPerTurn: movesPerTurnBase,
    blockCarryPercent: 0.2,
    powers: [],
    comboCards: 0,
  };

  const enemies: EnemyInstance[] = enemyIds.map((id, i) => {
    const def = getEnemyDef(id);
    let hp = rng.int(def.hp[0], def.hp[1]);
    if (def.isBoss) hp = Math.round(hp * mods.bossHpMult);
    else if (def.isElite) hp = Math.round(hp * mods.eliteHpMult);
    else hp = Math.round(hp * mods.normalHpMult);
    return {
      uid: `e${i}_${id}`,
      defId: id,
      name: def.name,
      nameEn: def.nameEn,
      line: def.line,
      hp,
      maxHp: hp,
      block: 0,
      statuses: {},
      elementMarks: {},
      currentIntent: null,
      lastIntentIndex: -1,
      canMove: def.canMove,
      phase2: false,
    };
  });

  const moveEnergyCost = className === 'courier' ? 0 : mods.moveEnergyCost;

  const state: CombatState = {
    player,
    enemies,
    drawPile: shuffleDeck(deck, rng),
    hand: [],
    discardPile: [],
    exhaustPile: [],
    turn: 1,
    cardsPlayedThisTurn: 0,
    log: [],
    turnPhase: 'player',
    relics,
    ascension,
    moveEnergyCost,
  };

  runRelicHook(state, 'combatStart', rng);
  for (const e of enemies) rollIntent(e, rng, mods);

  beginPlayerTurn(state, rng, true);
  return state;
}

function rollIntent(enemy: EnemyInstance, rng: Rng, mods: ReturnType<typeof computeAscensionMods>) {
  const def = getEnemyDef(enemy.defId);
  const intents = enemy.phase2 && def.isBoss ? def.intents : def.intents;
  let idx = -1;
  for (let attempt = 0; attempt < 4; attempt++) {
    const totalWeight = intents.reduce((s, i) => s + i.weight, 0);
    let roll = rng.next() * totalWeight;
    let chosen = 0;
    for (let i = 0; i < intents.length; i++) {
      roll -= intents[i].weight;
      if (roll <= 0) {
        chosen = i;
        break;
      }
    }
    idx = chosen;
    if (idx !== enemy.lastIntentIndex || intents.length === 1) break;
  }
  enemy.lastIntentIndex = idx;
  enemy.currentIntent = intents[idx];
  void mods;
}

// ---------- 플레이어 턴 ----------

function beginPlayerTurn(state: CombatState, rng: Rng, isFirstTurn: boolean) {
  const p = state.player;

  if (!isFirstTurn) {
    const kept = Math.floor(p.block * p.blockCarryPercent);
    p.block = kept;
  }
  p.energy = p.energyMax;
  p.movesUsed = 0;

  runRelicHook(state, 'turnStart', rng);

  const poison = statusVal(p.statuses, 'poison');
  if (poison > 0) {
    p.hp -= poison;
    log(state, `중독으로 ${poison} 피해를 입었다.`);
    addStatus(p.statuses, 'poison', -1);
    checkOutcome(state);
    if (state.turnPhase !== 'player') return;
  }

  const drawn = drawCards(state.drawPile, state.discardPile, state.hand, 5, rng, 8);
  state.drawPile = drawn.drawPile;
  state.discardPile = drawn.discardPile;
  state.hand = drawn.hand;
  state.cardsPlayedThisTurn = 0;
  state.player.comboCards = 0;
  log(state, `--- ${state.turn}턴 시작 ---`);
}

export interface PlayContext {
  chosenTargetUid?: string;
}

export function canPlayCard(
  state: CombatState,
  cardUid: string
): { ok: boolean; reason?: string } {
  if (state.turnPhase !== 'player') return { ok: false, reason: '플레이어 턴이 아닙니다.' };
  const inst = state.hand.find((c) => c.uid === cardUid);
  if (!inst) return { ok: false, reason: '손패에 없는 카드입니다.' };
  const def = getCardDef(inst.defId);
  if (def.playable === false) return { ok: false, reason: '사용할 수 없는 카드입니다.' };
  const cost = effectiveCost(def, inst);
  if (cost > state.player.energy) return { ok: false, reason: '에너지가 부족합니다.' };
  const range = inst.imprint === 'spread' && def.range === 'melee' ? 'ranged' : def.range;
  if ((range === 'melee' || range === 'pierce') && state.player.line !== 'front') {
    return { ok: false, reason: '전열에 있어야 사용할 수 있습니다.' };
  }
  return { ok: true };
}

function effectiveCost(def: ReturnType<typeof getCardDef>, inst: CardInstance): number {
  let cost = inst.upgraded && def.upgrade?.cost !== undefined ? def.upgrade.cost : def.cost;
  if (inst.imprint === 'swift') cost = Math.max(0, cost - 1);
  return cost;
}

function effectiveRange(def: ReturnType<typeof getCardDef>, inst: CardInstance) {
  if (inst.imprint === 'spread' && def.range === 'melee') return 'ranged';
  return def.range;
}

function cardNeedsSingleTarget(def: ReturnType<typeof getCardDef>, upgraded: boolean): boolean {
  const effects = upgraded && def.upgrade ? def.upgrade.effects : def.effects;
  return effects.some(
    (e) =>
      e.target === 'enemy_single' &&
      (e.op === 'damage' || e.op === 'damageMulti' || e.op === 'applyStatus' || e.op === 'elementMark' || e.op === 'pull' || e.op === 'push')
  );
}

export function validTargetsForCard(state: CombatState, cardUid: string): string[] {
  const inst = state.hand.find((c) => c.uid === cardUid);
  if (!inst) return [];
  const def = getCardDef(inst.defId);
  if (!cardNeedsSingleTarget(def, inst.upgraded)) return [];
  const living = livingEnemies(state);
  const range = effectiveRange(def, inst);
  if (range === 'melee') return living.filter((e) => e.line === 'front').map((e) => e.uid);
  return living.map((e) => e.uid);
}

function applyImprintToEffects(effects: CardEffect[], imprint: ImprintId | undefined): CardEffect[] {
  if (!imprint) return effects;
  if (imprint !== 'sharp' && imprint !== 'sturdy') return effects;
  return effects.map((e) => {
    if (imprint === 'sharp' && (e.op === 'damage' || e.op === 'damageMulti')) {
      return { ...e, value: (e.value ?? 0) + 4 };
    }
    if (imprint === 'sturdy' && e.op === 'block') {
      return { ...e, value: (e.value ?? 0) + 5 };
    }
    return e;
  });
}

export function playCard(
  state0: CombatState,
  cardUid: string,
  rng: Rng,
  ctx: PlayContext = {}
): CombatState {
  const check = canPlayCard(state0, cardUid);
  if (!check.ok) throw new Error(check.reason);

  const state = clone(state0);
  const idx = state.hand.findIndex((c) => c.uid === cardUid);
  const inst = state.hand[idx];
  const def = getCardDef(inst.defId);
  const baseEffects: CardEffect[] = inst.upgraded && def.upgrade ? def.upgrade.effects : def.effects;
  const effects = applyImprintToEffects(baseEffects, inst.imprint);

  state.hand.splice(idx, 1);
  state.player.energy -= effectiveCost(def, inst);
  state.cardsPlayedThisTurn += 1;
  state.player.comboCards = state.cardsPlayedThisTurn;

  const range = effectiveRange(def, inst);
  const targetUid =
    ctx.chosenTargetUid ?? (range === 'melee'
      ? livingEnemies(state).find((e) => e.line === 'front')?.uid
      : livingEnemies(state)[0]?.uid);

  log(state, `${inst.upgraded ? def.upgrade?.name ?? def.name : def.name} 사용.`);

  for (const eff of effects) {
    applyEffect(state, eff, { source: 'player', targetUid, rng });
  }

  if (def.type === 'power' && def.trigger === 'endOfTurn') {
    state.player.powers.push({
      cardId: def.id,
      name: def.name,
      trigger: 'endOfTurn',
      effects,
    });
  }

  const exhaustFlag =
    (inst.upgraded && def.upgrade?.exhaustAfterUse !== undefined
      ? def.upgrade.exhaustAfterUse
      : def.exhaustAfterUse) || def.type === 'power';
  const goesToExhaust = exhaustFlag && inst.imprint !== 'echo';
  if (goesToExhaust) {
    state.exhaustPile.push(inst);
  } else {
    state.discardPile.push(inst);
  }

  if (inst.imprint === 'resonance') {
    const res = drawCards(state.drawPile, state.discardPile, state.hand, 1, rng, 8);
    state.drawPile = res.drawPile;
    state.discardPile = res.discardPile;
    state.hand = res.hand;
  }

  checkOutcome(state);
  return state;
}

export function useMoveAction(state0: CombatState): CombatState {
  const state = clone(state0);
  const p = state.player;
  if (state.turnPhase !== 'player') return state;
  if (statusVal(p.statuses, 'bind') > 0) return state;
  if (p.movesUsed >= p.movesPerTurn) return state;
  if (p.energy < state.moveEnergyCost) return state;
  p.energy -= state.moveEnergyCost;
  p.movesUsed += 1;
  p.line = p.line === 'front' ? 'back' : 'front';
  log(state, `${p.line === 'front' ? '전열' : '후열'}로 이동했다.`);
  if (p.line === 'front') runRelicHook(state, 'onMoveFront', createNoopRng());
  return state;
}

// 훅 실행 시점에 카드 draw 등 rng가 필요 없는 경우를 위한 더미
function createNoopRng(): Rng {
  return { next: () => 0.5, int: (a) => a, pick: (arr) => arr[0], shuffle: (arr) => arr };
}

export function usePotion(state0: CombatState, effects: CardEffect[]): CombatState {
  const state = clone(state0);
  if (state.turnPhase !== 'player') return state;
  for (const eff of effects) {
    applyEffect(state, eff as CardEffect, { source: 'player', rng: createNoopRng() });
  }
  log(state, '포션을 사용했다.');
  checkOutcome(state);
  return state;
}

// ---------- 이펙트 실행기 ----------

interface EffectCtx {
  source: 'player' | string;
  targetUid?: string;
  rng: Rng;
}

function findEnemy(state: CombatState, uid?: string): EnemyInstance | undefined {
  return state.enemies.find((e) => e.uid === uid && e.hp > 0);
}

function dealDamageToEnemy(state: CombatState, enemy: EnemyInstance, amount: number, killSource: 'player' | 'other') {
  const wasAlive = enemy.hp > 0;
  const blocked = Math.min(enemy.block, amount);
  enemy.block -= blocked;
  const rest = amount - blocked;
  enemy.hp -= rest;
  if (enemy.hp < 0) enemy.hp = 0;

  const def = getEnemyDef(enemy.defId);
  if (def.phase2At !== undefined && !enemy.phase2 && enemy.hp > 0 && enemy.hp / enemy.maxHp <= def.phase2At) {
    enemy.phase2 = true;
    log(state, `${enemy.name}이(가) 페이즈를 전환한다!`);
  }

  if (wasAlive && enemy.hp <= 0 && killSource === 'player') {
    runRelicHook(state, 'onKill', createNoopRng());
  }
}

function dealDamageToPlayer(state: CombatState, amount: number) {
  const p = state.player;
  const blocked = Math.min(p.block, amount);
  p.block -= blocked;
  const rest = amount - blocked;
  p.hp -= rest;
}

function computePlayerOutgoing(state: CombatState, base: number): number {
  const p = state.player;
  const strength = statusVal(p.statuses, 'strength');
  let dmg = base + strength;
  if (statusVal(p.statuses, 'weak') > 0) dmg *= 0.75;
  return Math.round(dmg);
}

function applyVulnerable(dmg: number, target: { statuses: Record<string, number> }): number {
  if (statusVal(target.statuses, 'vulnerable') > 0) return Math.round(dmg * 1.5);
  return dmg;
}

function computeEnemyOutgoing(enemy: EnemyInstance, base: number, mods: ReturnType<typeof computeAscensionMods>): number {
  const def = getEnemyDef(enemy.defId);
  let dmg = base + statusVal(enemy.statuses, 'strength');
  if (statusVal(enemy.statuses, 'weak') > 0) dmg *= 0.75;
  if (!def.isBoss && !def.isElite) dmg *= mods.normalDmgMult;
  if (def.isElite) dmg *= mods.eliteDmgMult;
  if (enemy.phase2) dmg *= 1.3;
  return Math.round(dmg);
}

const ELEMENT_REACTIONS: Record<string, { op: 'damage' | 'poison' | 'vulnerable'; value: number; label: string }> = {
  'fire>ice': { op: 'damage', value: 8, label: '증기 폭발' },
  'ice>lightning': { op: 'vulnerable', value: 2, label: '전도' },
  'lightning>fire': { op: 'poison', value: 4, label: '과열' },
};

function applyElementMark(state: CombatState, enemy: EnemyInstance, element: ElementId, value: number) {
  const existingEntries = Object.entries(enemy.elementMarks).filter(([, v]) => (v ?? 0) > 0);
  const existingOther = existingEntries.find(([el]) => el !== element);

  if (existingOther) {
    const [oldEl] = existingOther;
    const key = `${oldEl}>${element}`;
    const reaction = ELEMENT_REACTIONS[key];
    enemy.elementMarks = {};
    if (reaction) {
      log(state, `${enemy.name}: ${reaction.label}!`);
      if (reaction.op === 'damage') dealDamageToEnemy(state, enemy, reaction.value, 'player');
      else if (reaction.op === 'vulnerable') addStatus(enemy.statuses, 'vulnerable', reaction.value);
      else if (reaction.op === 'poison') addStatus(enemy.statuses, 'poison', reaction.value);
    }
    return;
  }

  const cur = enemy.elementMarks[element] ?? 0;
  enemy.elementMarks[element] = Math.min(5, cur + value);
}

function applyEffect(state: CombatState, eff: CardEffect, ctx: EffectCtx) {
  let multiplier = 1;
  let bonus = 0;
  if (eff.condition) {
    const met = evalCondition(state, eff.condition, ctx);
    if (met && eff.onConditionMet) {
      multiplier = eff.onConditionMet.multiplier ?? 1;
      bonus = eff.onConditionMet.bonusValue ?? 0;
    }
  }

  switch (eff.op) {
    case 'damage': {
      const value = ((eff.value ?? 0) + bonus) * multiplier;
      applyDamageEffect(state, eff, value, ctx);
      break;
    }
    case 'damageMulti': {
      const times = eff.times ?? 1;
      for (let i = 0; i < times; i++) {
        applyDamageEffect(state, eff, eff.value ?? 0, ctx);
      }
      break;
    }
    case 'block': {
      if (ctx.source === 'player') {
        const dex = statusVal(state.player.statuses, 'dexterity');
        state.player.block += (eff.value ?? 0) + dex;
      } else {
        const enemy = findEnemy(state, ctx.source);
        if (enemy) enemy.block += eff.value ?? 0;
      }
      break;
    }
    case 'applyStatus': {
      const value = eff.value ?? 0;
      const status = eff.status as StatusId;
      if (eff.target === 'enemy_single' || eff.target === 'enemy_all') {
        const targets =
          eff.target === 'enemy_all' ? livingEnemies(state) : ([findEnemy(state, ctx.targetUid)].filter(Boolean) as EnemyInstance[]);
        for (const t of targets) addStatus(t.statuses, status, value);
      } else {
        if (ctx.source === 'player') addStatus(state.player.statuses, status, value);
        else {
          const enemy = findEnemy(state, ctx.source);
          if (enemy) addStatus(enemy.statuses, status, value);
        }
      }
      break;
    }
    case 'elementMark': {
      const value = eff.value ?? 1;
      const element = eff.element as ElementId;
      if (eff.target === 'enemy_all') {
        for (const t of livingEnemies(state)) applyElementMark(state, t, element, value);
      } else {
        const target = findEnemy(state, ctx.targetUid) ?? livingEnemies(state)[0];
        if (target) applyElementMark(state, target, element, value);
      }
      break;
    }
    case 'draw': {
      const res = drawCards(state.drawPile, state.discardPile, state.hand, eff.value ?? 0, ctx.rng, 8);
      state.drawPile = res.drawPile;
      state.discardPile = res.discardPile;
      state.hand = res.hand;
      break;
    }
    case 'energy': {
      if (ctx.source === 'player') state.player.energy += eff.value ?? 0;
      break;
    }
    case 'move': {
      if (ctx.source !== 'player') break;
      const p = state.player;
      if (eff.to === 'toggle') p.line = p.line === 'front' ? 'back' : 'front';
      else p.line = eff.to as Line;
      if (p.line === 'front') runRelicHook(state, 'onMoveFront', ctx.rng);
      break;
    }
    case 'pull': {
      const enemy = findEnemy(state, ctx.targetUid);
      if (enemy) enemy.line = 'front';
      break;
    }
    case 'push': {
      const enemy = findEnemy(state, ctx.targetUid);
      if (enemy) enemy.line = 'back';
      break;
    }
    case 'heal': {
      if (ctx.source === 'player') {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + (eff.value ?? 0));
      }
      break;
    }
    case 'exhaust': {
      break;
    }
    case 'modifyStat': {
      if (ctx.source !== 'player') break;
      if (eff.stat === 'blockCarryPercent') state.player.blockCarryPercent = eff.value ?? state.player.blockCarryPercent;
      if (eff.stat === 'movesPerTurn') state.player.movesPerTurn += eff.value ?? 0;
      if (eff.stat === 'energyMax') state.player.energyMax += eff.value ?? 0;
      if (eff.stat === 'maxHp') {
        state.player.maxHp += eff.value ?? 0;
        state.player.hp += eff.value ?? 0;
      }
      break;
    }
  }
}

function applyDamageEffect(state: CombatState, eff: CardEffect, baseValue: number, ctx: EffectCtx) {
  if (ctx.source === 'player') {
    const dmg0 = computePlayerOutgoing(state, baseValue);
    if (eff.target === 'enemy_all') {
      for (const enemy of livingEnemies(state)) {
        const dmg = applyVulnerable(dmg0, enemy);
        dealDamageToEnemy(state, enemy, dmg, 'player');
      }
    } else {
      const enemy = findEnemy(state, ctx.targetUid);
      if (enemy) {
        const dmg = applyVulnerable(dmg0, enemy);
        dealDamageToEnemy(state, enemy, dmg, 'player');
        log(state, `${enemy.name}에게 ${dmg} 피해.`);
      }
    }
  } else {
    const enemy = state.enemies.find((e) => e.uid === ctx.source);
    if (!enemy) return;
    const mods = computeAscensionMods(state.ascension);
    let dmg = computeEnemyOutgoing(enemy, baseValue, mods);
    dmg = applyVulnerable(dmg, state.player);
    const p = state.player;
    if (p.line === 'back') {
      const reduction = state.relics.includes('rift_compass') ? 0.6 : 0.75;
      dmg = Math.round(dmg * reduction);
    }
    dealDamageToPlayer(state, dmg);
    log(state, `${enemy.name}에게 ${dmg} 피해를 받았다.`);

    const thorns = statusVal(p.statuses, 'thorns');
    if (thorns > 0) {
      dealDamageToEnemy(state, enemy, thorns, 'other');
      log(state, `가시로 ${enemy.name}에게 ${thorns} 반사 피해.`);
    }
  }
}

function evalCondition(state: CombatState, cond: NonNullable<CardEffect['condition']>, ctx: EffectCtx): boolean {
  switch (cond.type) {
    case 'enemyHpBelow': {
      const enemy = findEnemy(state, ctx.targetUid);
      if (!enemy) return false;
      return enemy.hp / enemy.maxHp <= (cond.percent ?? 0) / 100;
    }
    case 'playerLine':
      return state.player.line === cond.line;
    case 'handEmpty':
      return state.hand.length === 0;
    case 'comboCount':
      return state.cardsPlayedThisTurn >= (cond.count ?? 0);
    case 'hasStatus':
      return statusVal(state.player.statuses, cond.status ?? ('strength' as StatusId)) > 0;
    case 'elementMatch': {
      const enemy = findEnemy(state, ctx.targetUid);
      if (!enemy || !cond.element) return false;
      return (enemy.elementMarks[cond.element] ?? 0) > 0;
    }
    default:
      return false;
  }
}

// ---------- 턴 종료 / 적 턴 ----------

export function endPlayerTurn(state0: CombatState, rng: Rng): CombatState {
  const state = clone(state0);
  if (state.turnPhase !== 'player') return state;

  for (const power of state.player.powers) {
    for (const eff of power.effects) {
      applyEffect(state, eff, { source: 'player', rng });
    }
  }
  runRelicHook(state, 'turnEnd', rng);

  for (const curseId of ['curse_rift_shard', 'curse_doubt', 'curse_decay'] as const) {
    const count = state.hand.filter((c) => c.defId === curseId).length;
    if (count === 0) continue;
    if (curseId === 'curse_rift_shard') {
      state.player.hp -= 2 * count;
      log(state, `균열 파편의 저주로 ${2 * count} 피해를 입었다.`);
    } else if (curseId === 'curse_doubt') {
      addStatus(state.player.statuses, 'weak', 1 * count);
      log(state, `의심의 저주로 약화 ${count}을 얻었다.`);
    } else if (curseId === 'curse_decay') {
      addStatus(state.player.statuses, 'poison', 1 * count);
      log(state, `부패의 저주로 중독 ${count}을 얻었다.`);
    }
  }

  const regen = statusVal(state.player.statuses, 'regen');
  if (regen > 0) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + regen);
    addStatus(state.player.statuses, 'regen', -1);
  }
  addStatus(state.player.statuses, 'vulnerable', -Math.min(1, statusVal(state.player.statuses, 'vulnerable')));
  addStatus(state.player.statuses, 'weak', -Math.min(1, statusVal(state.player.statuses, 'weak')));
  addStatus(state.player.statuses, 'bind', -Math.min(1, statusVal(state.player.statuses, 'bind')));

  state.discardPile.push(...state.hand);
  state.hand = [];

  checkOutcome(state);
  if (state.turnPhase !== 'player' && (state.turnPhase as string) !== 'enemy') {
    return state;
  }

  state.turnPhase = 'enemy';
  runEnemyTurn(state, rng);
  if (state.turnPhase === 'enemy') {
    state.turn += 1;
    state.turnPhase = 'player';
    beginPlayerTurn(state, rng, false);
  }
  return state;
}

function runEnemyTurn(state: CombatState, rng: Rng) {
  const mods = computeAscensionMods(state.ascension);
  for (const enemy of livingEnemies(state)) {
    const poison = statusVal(enemy.statuses, 'poison');
    if (poison > 0) {
      enemy.hp -= poison;
      addStatus(enemy.statuses, 'poison', -1);
      if (enemy.hp <= 0) {
        enemy.hp = 0;
        log(state, `${enemy.name}이(가) 중독으로 쓰러졌다.`);
      }
    }
  }

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    const intent = enemy.currentIntent;
    if (!intent) continue;
    resolveIntent(state, enemy, intent, rng);
    checkOutcome(state);
    if (state.turnPhase !== 'enemy') return;
  }

  for (const enemy of livingEnemies(state)) {
    const regen = statusVal(enemy.statuses, 'regen');
    if (regen > 0) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + regen);
      addStatus(enemy.statuses, 'regen', -1);
    }
    addStatus(enemy.statuses, 'vulnerable', -Math.min(1, statusVal(enemy.statuses, 'vulnerable')));
    addStatus(enemy.statuses, 'weak', -Math.min(1, statusVal(enemy.statuses, 'weak')));
    enemy.block = 0;
    rollIntent(enemy, rng, mods);
  }

  checkOutcome(state);
}

function resolveIntent(state: CombatState, enemy: EnemyInstance, intent: IntentDef, rng: Rng) {
  switch (intent.type) {
    case 'attack': {
      // 플레이어의 근접 카드가 전열에서만 유효한 것과 대칭으로, 원거리(ranged) 표시가 없는 공격은
      // 적이 후열에 있으면(밀려났거나 스스로 이동) 닿지 않는다.
      if (enemy.line === 'back' && !intent.ranged) {
        log(state, `${enemy.name}의 공격이 후열이라 닿지 않았다.`);
        break;
      }
      const times = intent.times ?? 1;
      for (let i = 0; i < times; i++) {
        applyDamageEffect(state, { op: 'damage', value: intent.value ?? 0 }, intent.value ?? 0, {
          source: enemy.uid,
          rng,
        });
        if (state.player.hp <= 0) break;
      }
      break;
    }
    case 'buff': {
      if (intent.status) addStatus(enemy.statuses, intent.status, intent.value ?? 0);
      log(state, `${enemy.name}이(가) ${intent.status} ${intent.value}을 얻었다.`);
      break;
    }
    case 'debuff': {
      if (intent.status) addStatus(state.player.statuses, intent.status, intent.value ?? 0);
      log(state, `${enemy.name}이(가) 플레이어에게 ${intent.status}을 부여했다.`);
      break;
    }
    case 'block': {
      enemy.block += intent.value ?? 0;
      break;
    }
    case 'move': {
      if (enemy.canMove) {
        enemy.line = enemy.line === 'front' ? 'back' : 'front';
        log(state, `${enemy.name}이(가) ${enemy.line === 'front' ? '전열' : '후열'}로 이동했다.`);
      }
      break;
    }
    default:
      break;
  }
}
