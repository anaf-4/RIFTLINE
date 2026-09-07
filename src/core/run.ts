import type { RunState, CardInstance, ClassId, MapNode, ShopStock, ImprintId, EventChoice } from './types';
import type { Rng } from './rng';
import { createRng, randomSeed } from './rng';
import { makeCardInstance } from './deck';
import { startCombat } from './combat';
import { generateActMap, reachableNodeIds } from './map';
import { generateEncounter } from '../data/enemies';
import { allCards } from '../data/cards';
import { relics, startingRelicFor } from '../data/relics';
import { potions } from '../data/potions';
import { events } from '../data/events';
import { computeAscensionMods } from './ascension';

const START_DECKS: Record<ClassId, { id: string; count: number }[]> = {
  warden: [
    { id: 'warden_strike', count: 5 },
    { id: 'warden_bulwark', count: 4 },
    { id: 'warden_advance', count: 1 },
  ],
  ember: [
    { id: 'ember_spark', count: 5 },
    { id: 'ember_frostward', count: 4 },
    { id: 'ember_ignite', count: 1 },
  ],
  courier: [
    { id: 'courier_stab', count: 5 },
    { id: 'courier_dodge', count: 4 },
    { id: 'courier_dash', count: 1 },
  ],
  scribe: [
    { id: 'scribe_strike', count: 5 },
    { id: 'scribe_ward', count: 4 },
    { id: 'scribe_mark', count: 1 },
  ],
};

const START_HP: Record<ClassId, number> = { warden: 80, ember: 70, courier: 70, scribe: 65 };

export function createNewRun(
  className: ClassId,
  ascension: number,
  seedOverride?: number,
  isDaily = false
): { run: RunState; rng: Rng } {
  const seed = seedOverride ?? Math.floor(randomSeed());
  const rng = createRng(seed);
  const deck: CardInstance[] = [];
  for (const entry of START_DECKS[className]) {
    for (let i = 0; i < entry.count; i++) deck.push(makeCardInstance(entry.id));
  }

  const mods = computeAscensionMods(ascension);
  for (let i = 0; i < mods.startCurses; i++) deck.push(makeCardInstance('curse_rift_shard'));

  const maxHp = START_HP[className] - mods.startHpPenalty;

  const run: RunState = {
    seed,
    className,
    ascension,
    deck,
    relics: [startingRelicFor(className)],
    gold: 99,
    potions: [null, null, null],
    potionSlots: 3 - mods.potionSlotPenalty,
    maxHp,
    hp: maxHp,
    act: 1,
    mapNodes: [],
    currentNodeId: null,
    completedNodeIds: [],
    removeCount: 0,
    combat: null,
    imprintsUsed: 0,
    isDaily,
  };

  return { run: enterAct(run, 1, rng), rng };
}

export function dailySeedForToday(): number {
  const d = new Date();
  const key = `${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDate()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function enterAct(run: RunState, act: 1 | 2 | 3 | 4, rng: Rng): RunState {
  const next = structuredClone(run);
  const mods = computeAscensionMods(run.ascension);
  next.act = act;
  next.mapNodes = generateActMap(act, rng);
  next.currentNodeId = null;
  if (act > 1 && mods.actStartHeal > 0) {
    next.hp = Math.min(next.maxHp, next.hp + mods.actStartHeal);
  }
  return next;
}

export function currentNode(run: RunState): MapNode | undefined {
  return run.mapNodes.find((n) => n.id === run.currentNodeId);
}

export function reachableNodes(run: RunState): MapNode[] {
  const ids = reachableNodeIds(run.mapNodes, run.currentNodeId);
  return run.mapNodes.filter((n) => ids.has(n.id));
}

export function movesPerTurnForRun(run: RunState): number {
  const mods = computeAscensionMods(run.ascension);
  if (run.className === 'courier') return mods.courierMovesPerTurn;
  return 1 + (run.relics.includes('twin_greaves') ? 1 : 0);
}

export function travelTo(run: RunState, nodeId: string, rng: Rng): RunState {
  const next = structuredClone(run);
  const node = next.mapNodes.find((n) => n.id === nodeId);
  if (!node) throw new Error('잘못된 노드입니다.');
  next.currentNodeId = nodeId;

  if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
    const kind = node.type === 'combat' ? 'combat' : node.type;
    node.enemyIds = generateEncounter(next.act, kind, rng);
    next.combat = startCombat(
      node.enemyIds,
      next.deck,
      next.relics,
      next.hp,
      next.maxHp,
      movesPerTurnForRun(next),
      next.ascension,
      next.className,
      rng
    );
  } else if (node.type === 'event' && !node.eventId) {
    node.eventId = rng.pick(events).id;
  }

  return next;
}

export function markNodeCompleted(run: RunState): RunState {
  const next = structuredClone(run);
  if (next.currentNodeId && !next.completedNodeIds.includes(next.currentNodeId)) {
    next.completedNodeIds.push(next.currentNodeId);
  }
  return next;
}

export function isActComplete(run: RunState): boolean {
  const node = currentNode(run);
  return node?.type === 'boss';
}

// ---------- 전투 종료 ----------

export function finishCombatWin(run: RunState): RunState {
  const next = structuredClone(run);
  if (next.combat) next.hp = Math.max(1, next.combat.player.hp);
  next.combat = null;
  return markNodeCompleted(next);
}

export function goldRewardFor(run: RunState, rng: Rng): number {
  const node = currentNode(run);
  const mods = computeAscensionMods(run.ascension);
  let base = 15;
  if (node?.type === 'elite') base = 32;
  if (node?.type === 'boss') base = 90;
  const roll = base + rng.int(-5, 5);
  return Math.max(1, Math.round(roll * mods.goldMult));
}

export function generateRewardOptions(_run: RunState, rng: Rng): CardInstance[] {
  const pool = allCards.filter(
    (c) => (c.class === _run.className || c.class === 'common') && c.type !== 'curse'
  );
  const shuffled = rng.shuffle(pool);
  return shuffled.slice(0, 3).map((c) => makeCardInstance(c.id));
}

export function addCardToDeck(run: RunState, card: CardInstance): RunState {
  const next = structuredClone(run);
  next.deck.push(card);
  return next;
}

export function generateRelicReward(run: RunState, rng: Rng): string | null {
  const owned = new Set(run.relics);
  const pool = relics.filter((r) => !owned.has(r.id) && r.rarity !== 'boss');
  if (pool.length === 0) return null;
  return rng.pick(pool).id;
}

export function generateBossRelicReward(run: RunState, rng: Rng): string | null {
  const owned = new Set(run.relics);
  const pool = relics.filter((r) => !owned.has(r.id) && r.rarity === 'boss');
  if (pool.length === 0) return generateRelicReward(run, rng);
  return rng.pick(pool).id;
}

const RELIC_PICKUP_EFFECTS: Record<string, (run: RunState) => void> = {
  vitality_core: (r) => {
    r.maxHp += 8;
    r.hp += 8;
  },
  giant_marrow: (r) => {
    r.maxHp += 15;
    r.hp += 15;
  },
  potion_belt: (r) => {
    r.potionSlots += 1;
  },
  unstable_rift: (r) => {
    r.maxHp = Math.max(1, r.maxHp - 20);
    r.hp = Math.min(r.hp, r.maxHp);
  },
};

export function addRelic(run: RunState, relicId: string): RunState {
  const next = structuredClone(run);
  next.relics.push(relicId);
  RELIC_PICKUP_EFFECTS[relicId]?.(next);
  return next;
}

// ---------- 상점 ----------

export function generateShopStock(run: RunState, rng: Rng): ShopStock {
  const mods = computeAscensionMods(run.ascension);
  const cardPool = allCards.filter((c) => (c.class === run.className || c.class === 'common') && c.type !== 'curse');
  const cardChoices = rng.shuffle(cardPool).slice(0, 5).map((c) => makeCardInstance(c.id));
  const cardPrices = cardChoices.map((c) => {
    const def = allCards.find((d) => d.id === c.defId)!;
    const base = def.rarity === 'rare' ? 150 : def.rarity === 'uncommon' ? 90 : 55;
    return Math.round(base * mods.shopPriceMult);
  });

  const owned = new Set(run.relics);
  const relicPool = relics.filter((r) => !owned.has(r.id) && r.rarity !== 'boss');
  const relicChoices = rng.shuffle(relicPool).slice(0, 3).map((r) => r.id);
  const relicPrices = relicChoices.map((id) => {
    const r = relics.find((x) => x.id === id)!;
    const base = r.rarity === 'rare' ? 200 : r.rarity === 'uncommon' ? 140 : 90;
    return Math.round(base * mods.shopPriceMult);
  });

  const potionChoices = rng.shuffle(potions).slice(0, 3).map((p) => p.id);
  const potionPrices = potionChoices.map((id) => {
    const p = potions.find((x) => x.id === id)!;
    const base = p.rarity === 'rare' ? 100 : p.rarity === 'uncommon' ? 60 : 35;
    return Math.round(base * mods.shopPriceMult);
  });

  return {
    cards: cardChoices,
    cardPrices,
    relics: relicChoices,
    relicPrices,
    potions: potionChoices,
    potionPrices,
    removeCost: mods.removeCostStart + run.removeCount * 25,
  };
}

export function buyCard(run: RunState, stock: ShopStock, index: number): RunState {
  const price = stock.cardPrices[index];
  if (run.gold < price) return run;
  const next = structuredClone(run);
  next.gold -= price;
  next.deck.push(stock.cards[index]);
  return next;
}

export function buyRelic(run: RunState, stock: ShopStock, index: number): RunState {
  const price = stock.relicPrices[index];
  if (run.gold < price) return run;
  let next = structuredClone(run);
  next.gold -= price;
  next = addRelic(next, stock.relics[index]);
  return next;
}

export function buyPotion(run: RunState, stock: ShopStock, index: number): RunState {
  const price = stock.potionPrices[index];
  if (run.gold < price) return run;
  const slot = run.potions.findIndex((p) => p === null);
  if (slot === -1) return run;
  const next = structuredClone(run);
  next.gold -= price;
  next.potions[slot] = stock.potions[index];
  return next;
}

export function removeCardFromDeck(run: RunState, cardUid: string, cost: number): RunState {
  if (run.gold < cost) return run;
  const next = structuredClone(run);
  next.gold -= cost;
  next.removeCount += 1;
  next.deck = next.deck.filter((c) => c.uid !== cardUid);
  return next;
}

// ---------- 휴식 ----------

export function restHeal(run: RunState): RunState {
  const next = structuredClone(run);
  const mods = computeAscensionMods(run.ascension);
  next.hp = Math.min(next.maxHp, next.hp + Math.round(next.maxHp * mods.restHealPercent));
  return next;
}

export function upgradeCard(run: RunState, cardUid: string): RunState {
  const next = structuredClone(run);
  const card = next.deck.find((c) => c.uid === cardUid);
  if (card) card.upgraded = true;
  return next;
}

export function attachImprint(run: RunState, cardUid: string, imprint: ImprintId): RunState {
  const next = structuredClone(run);
  const card = next.deck.find((c) => c.uid === cardUid);
  if (card) {
    card.imprint = imprint;
    next.imprintsUsed += 1;
  }
  return next;
}

// ---------- 이벤트 ----------

export function resolveEventChoice(run: RunState, choice: EventChoice, rng: Rng): RunState {
  let next = structuredClone(run);

  if (choice.goldDelta) {
    next.gold = Math.max(0, next.gold + choice.goldDelta);
  }
  for (const eff of choice.effects) {
    if (eff.op === 'heal') {
      next.hp = Math.min(next.maxHp, Math.max(1, next.hp + (eff.value ?? 0)));
    } else if (eff.op === 'modifyStat' && eff.stat === 'maxHp') {
      next.maxHp += eff.value ?? 0;
      next.hp = Math.min(next.maxHp, next.hp + Math.max(0, eff.value ?? 0));
    }
  }
  if (choice.relicId === 'random') {
    const relicId = generateRelicReward(next, rng);
    if (relicId) next = addRelic(next, relicId);
  } else if (choice.relicId) {
    next = addRelic(next, choice.relicId);
  }
  if (choice.addCurse) {
    next.deck.push(makeCardInstance(choice.addCurse));
  }
  return markNodeCompleted(next);
}

// ---------- 포션 사용(비전투) ----------

export function usePotionSlot(run: RunState, slot: number): RunState {
  const next = structuredClone(run);
  next.potions[slot] = null;
  return next;
}
