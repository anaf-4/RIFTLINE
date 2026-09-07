import { create } from 'zustand';
import type { GameState, RunState, CardInstance, ClassId, ImprintId } from '../core/types';
import type { Rng } from '../core/rng';
import { createRng } from '../core/rng';
import {
  createNewRun,
  dailySeedForToday,
  travelTo,
  markNodeCompleted,
  finishCombatWin,
  goldRewardFor,
  generateRewardOptions,
  generateRelicReward,
  generateBossRelicReward,
  addCardToDeck,
  addRelic,
  enterAct,
  currentNode,
  generateShopStock,
  buyCard,
  buyRelic,
  buyPotion,
  removeCardFromDeck,
  restHeal,
  upgradeCard,
  attachImprint,
  resolveEventChoice,
} from '../core/run';
import { playCard, endPlayerTurn, useMoveAction, canPlayCard, validTargetsForCard, usePotion } from '../core/combat';
import { getCardDef } from '../data/cards';
import { eventMap } from '../data/events';
import { potionMap } from '../data/potions';
import { loadMeta, saveMeta, loadRun, saveRun, hasSavedRun } from '../core/persistence';
import type { MetaSave } from '../core/save';
import { defaultMeta } from '../core/save';
import { achievements } from '../data/achievements';
import { sfx } from '../core/audio';
import { checkForUpdate, type UpdateInfo } from '../core/updateCheck';
import { Capacitor } from '@capacitor/core';

let rng: Rng = createRng(1);
let playSeq = 0;

interface UIState {
  pendingCardUid: string | null;
  pendingTargets: string[];
  lastRelicReward: string | null;
  animEvent: { type: 'draw' | 'play'; count?: number } | null;
  lastPlayed: { seq: number; cardUid: string; defId: string; upgraded: boolean; exhaust: boolean } | null;
  hasSave: boolean;
  newAchievements: string[];
  updateInfo: UpdateInfo;
}

interface Store {
  game: GameState;
  ui: UIState;
  meta: MetaSave;
  initApp: () => Promise<void>;
  goToClassSelect: () => void;
  startNewRun: (className: ClassId, ascension: number, isDaily: boolean) => void;
  continueRun: () => Promise<void>;
  backToTitle: () => void;
  viewAchievements: () => void;
  setLanguage: (lang: 'ko' | 'en') => void;
  markTutorialSeen: () => void;

  selectMapNode: (nodeId: string) => void;
  selectCard: (cardUid: string) => void;
  selectTarget: (enemyUid: string) => void;
  cancelTargeting: () => void;
  doMove: () => void;
  endTurn: () => void;
  usePotionInCombat: (slot: number) => void;
  proceedFromResult: () => void;
  pickReward: (cardUid: string | null) => void;

  shopBuyCard: (index: number) => void;
  shopBuyRelic: (index: number) => void;
  shopBuyPotion: (index: number) => void;
  shopRemoveCard: (cardUid: string) => void;
  shopLeave: () => void;

  restDo: (action: 'heal' | 'leave') => void;
  restUpgrade: (cardUid: string) => void;
  restImprint: (cardUid: string, imprint: ImprintId) => void;

  eventChoose: (choiceIndex: number) => void;
}

function persistRun(run: RunState | null) {
  void saveRun(run);
}
function persistMeta(meta: MetaSave) {
  void saveMeta(meta);
}

function checkAchievements(meta: MetaSave, run: RunState, won: boolean): { meta: MetaSave; unlocked: string[] } {
  const unlocked: string[] = [];
  const has = (id: string) => meta.achievements.includes(id);
  const grant = (id: string) => {
    if (!has(id)) {
      meta.achievements.push(id);
      unlocked.push(id);
    }
  };

  if (won) {
    grant('first_win');
    if (run.className === 'warden') grant('warden_win');
    if (run.className === 'ember') grant('ember_win');
    if (run.className === 'courier') grant('courier_win');
    if (run.className === 'scribe') grant('scribe_win');
    if (run.ascension >= 5) grant('ascension5');
    if (run.ascension >= 15) grant('ascension15');
    if (run.act === 4) grant('act4_win');
  }
  return { meta, unlocked };
}

export const useGameStore = create<Store>((set, get) => ({
  game: { screen: 'title', run: null },
  ui: {
    pendingCardUid: null,
    pendingTargets: [],
    lastRelicReward: null,
    animEvent: null,
    lastPlayed: null,
    hasSave: false,
    newAchievements: [],
    updateInfo: { available: false },
  },
  meta: defaultMeta(),

  initApp: async () => {
    const [meta, saved] = await Promise.all([loadMeta(), hasSavedRun()]);
    set((s) => ({ meta, ui: { ...s.ui, hasSave: saved } }));

    // 자동 업데이트는 Electron(electron-updater)에서 자체 처리한다.
    // 여기서는 안드로이드 사이드로드 빌드에서만 "새 버전 있음" 배너를 위해 확인한다.
    if (Capacitor.isNativePlatform()) {
      const updateInfo = await checkForUpdate();
      if (updateInfo.available) set((s) => ({ ui: { ...s.ui, updateInfo } }));
    }
  },

  goToClassSelect: () => {
    sfx.click();
    set({ game: { screen: 'classSelect', run: null } });
  },

  startNewRun: (className, ascension, isDaily) => {
    const seed = isDaily ? dailySeedForToday() : undefined;
    const { run, rng: newRng } = createNewRun(className, ascension, seed, isDaily);
    rng = newRng;
    set({
      game: { screen: 'map', run },
      ui: { ...get().ui, pendingCardUid: null, pendingTargets: [], lastRelicReward: null, lastPlayed: null, hasSave: true },
    });
    persistRun(run);
  },

  continueRun: async () => {
    const run = await loadRun();
    if (!run) {
      set((s) => ({ ui: { ...s.ui, hasSave: false } }));
      return;
    }
    rng = createRng((run.seed ^ (run.completedNodeIds.length * 7919)) >>> 0);
    const screen = run.combat ? 'combat' : 'map';
    set({ game: { screen, run } });
  },

  backToTitle: () => {
    set({ game: { screen: 'title', run: null } });
  },

  viewAchievements: () => {
    set({ game: { screen: 'achievements', run: get().game.run ?? null } });
  },

  setLanguage: (lang) => {
    const newMeta = { ...get().meta, settings: { ...get().meta.settings, language: lang } };
    set({ meta: newMeta });
    persistMeta(newMeta);
  },

  markTutorialSeen: () => {
    const newMeta = { ...get().meta, tutorialSeen: true };
    set({ meta: newMeta });
    persistMeta(newMeta);
  },

  selectMapNode: (nodeId) => {
    const { game } = get();
    if (!game.run) return;
    let run = travelTo(game.run, nodeId, rng);
    const node = run.mapNodes.find((n) => n.id === nodeId)!;

    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      set({ game: { screen: 'combat', run }, ui: { ...get().ui, animEvent: { type: 'draw' } } });
    } else if (node.type === 'shop') {
      const stock = generateShopStock(run, rng);
      set({ game: { screen: 'shop', run, shopStock: stock } });
    } else if (node.type === 'rest') {
      set({ game: { screen: 'rest', run } });
    } else if (node.type === 'event') {
      const ev = eventMap[node.eventId!];
      set({ game: { screen: 'event', run, activeEvent: ev } });
    }
    persistRun(run);
  },

  selectCard: (cardUid) => {
    const { game } = get();
    if (!game.run?.combat) return;
    const check = canPlayCard(game.run.combat, cardUid);
    if (!check.ok) return;

    const targets = validTargetsForCard(game.run.combat, cardUid);
    if (targets.length > 1) {
      set((s) => ({ ui: { ...s.ui, pendingCardUid: cardUid, pendingTargets: targets } }));
      return;
    }
    playSelectedCard(cardUid, targets[0], set, get);
  },

  selectTarget: (enemyUid) => {
    const { ui } = get();
    if (!ui.pendingCardUid) return;
    playSelectedCard(ui.pendingCardUid, enemyUid, set, get);
  },

  cancelTargeting: () => {
    set((s) => ({ ui: { ...s.ui, pendingCardUid: null, pendingTargets: [] } }));
  },

  doMove: () => {
    const { game } = get();
    if (!game.run?.combat) return;
    const combat = useMoveAction(game.run.combat);
    const run = { ...game.run, combat };
    set({ game: { ...game, run } });
    persistRun(run);
  },

  endTurn: () => {
    const { game } = get();
    if (!game.run?.combat) return;
    sfx.click();
    const combat = endPlayerTurn(game.run.combat, rng);
    const run = { ...game.run, combat };
    set((s) => ({ game: { ...game, run }, ui: { ...s.ui, animEvent: { type: 'draw' } } }));
    persistRun(run);
  },

  usePotionInCombat: (slot) => {
    const { game } = get();
    if (!game.run?.combat) return;
    const potionId = game.run.potions[slot];
    if (!potionId) return;
    const def = potionMap[potionId];
    if (!def) return;
    const combat = usePotion(game.run.combat, def.effects);
    const potions = game.run.potions.slice();
    potions[slot] = null;
    const run = { ...game.run, combat, potions };
    set({ game: { ...game, run } });
    persistRun(run);
  },

  proceedFromResult: () => {
    const { game, meta } = get();
    if (!game.run?.combat) return;
    const phase = game.run.combat.turnPhase;

    if (phase === 'lost') {
      sfx.defeat();
      const newMeta = structuredClone(meta);
      newMeta.totalRuns += 1;
      newMeta.runCounter += 1;
      persistMeta(newMeta);
      persistRun(null);
      set((s) => ({ game: { screen: 'gameover', run: game.run }, meta: newMeta, ui: { ...s.ui, hasSave: false } }));
      return;
    }

    if (phase === 'won') {
      sfx.victory();
      const node = currentNode(game.run);
      const gold = goldRewardFor(game.run, rng);
      let run = finishCombatWin(game.run);
      run.gold += gold;

      let relicReward: string | null = null;
      const shouldGiveRelic = node?.type === 'elite' || node?.type === 'boss' || rng.next() < 0.25;
      if (shouldGiveRelic) {
        relicReward = node?.type === 'boss' ? generateBossRelicReward(run, rng) : generateRelicReward(run, rng);
        if (relicReward) run = addRelic(run, relicReward);
      }

      if (node?.type === 'boss') {
        finishAct(run, meta, set, get);
        return;
      }

      const rewardOptions = generateRewardOptions(run, rng);
      set((s) => ({
        game: { screen: 'reward', run, rewardOptions },
        ui: { ...s.ui, lastRelicReward: relicReward },
      }));
      persistRun(run);
    }
  },

  pickReward: (cardUid) => {
    const { game } = get();
    if (!game.run) return;
    let run = game.run;
    if (cardUid) {
      const card = game.rewardOptions?.find((c) => c.uid === cardUid);
      if (card) run = addCardToDeck(run, card);
    }
    set({ game: { screen: 'map', run }, ui: { ...get().ui, pendingCardUid: null, pendingTargets: [], lastRelicReward: null } });
    persistRun(run);
  },

  shopBuyCard: (index) => {
    const { game } = get();
    if (!game.run || !game.shopStock) return;
    sfx.gold();
    const run = buyCard(game.run, game.shopStock, index);
    set({ game: { ...game, run } });
    persistRun(run);
  },
  shopBuyRelic: (index) => {
    const { game } = get();
    if (!game.run || !game.shopStock) return;
    sfx.gold();
    const run = buyRelic(game.run, game.shopStock, index);
    set({ game: { ...game, run } });
    persistRun(run);
  },
  shopBuyPotion: (index) => {
    const { game } = get();
    if (!game.run || !game.shopStock) return;
    sfx.gold();
    const run = buyPotion(game.run, game.shopStock, index);
    set({ game: { ...game, run } });
    persistRun(run);
  },
  shopRemoveCard: (cardUid) => {
    const { game } = get();
    if (!game.run || !game.shopStock) return;
    const run = removeCardFromDeck(game.run, cardUid, game.shopStock.removeCost);
    const stock = { ...game.shopStock, removeCost: game.shopStock.removeCost + 25 };
    set((s) => ({ game: { ...s.game, run, shopStock: stock } }));
    persistRun(run);
  },
  shopLeave: () => {
    const { game } = get();
    if (!game.run) return;
    const run = markNodeCompleted(game.run);
    set({ game: { screen: 'map', run } });
    persistRun(run);
  },

  restDo: (action) => {
    const { game } = get();
    if (!game.run) return;
    if (action === 'heal') {
      const run = markNodeCompleted(restHeal(game.run));
      set({ game: { screen: 'map', run } });
      persistRun(run);
    } else {
      const run = markNodeCompleted(game.run);
      set({ game: { screen: 'map', run } });
      persistRun(run);
    }
  },
  restUpgrade: (cardUid) => {
    const { game } = get();
    if (!game.run) return;
    const run = markNodeCompleted(upgradeCard(game.run, cardUid));
    set({ game: { screen: 'map', run } });
    persistRun(run);
  },
  restImprint: (cardUid, imprint) => {
    const { game } = get();
    if (!game.run) return;
    const run = markNodeCompleted(attachImprint(game.run, cardUid, imprint));
    set({ game: { screen: 'map', run } });
    persistRun(run);
  },

  eventChoose: (choiceIndex) => {
    const { game } = get();
    if (!game.run || !game.activeEvent) return;
    const choice = game.activeEvent.choices[choiceIndex];
    if (choice.requiresGold && game.run.gold < choice.requiresGold) return;
    const run = resolveEventChoice(game.run, choice, rng);
    set({ game: { screen: 'map', run } });
    persistRun(run);
  },
}));

function finishAct(run: RunState, meta: MetaSave, set: (fn: (s: Store) => Partial<Store>) => void, get: () => Store) {
  const newMeta = structuredClone(meta);
  newMeta.winsByClass[run.className] = (newMeta.winsByClass[run.className] ?? 0) + 1;

  if (run.act === 3) {
    if (!newMeta.unlockedClasses.includes('scribe')) {
      newMeta.unlockedClasses.push('scribe');
    }
    const allFourWon = (['warden', 'ember', 'courier', 'scribe'] as const).every((c) => (newMeta.winsByClass[c] ?? 0) > 0);
    if (allFourWon) newMeta.act4Unlocked = true;
  }

  const isFinalVictory = run.act === 4 || (run.act === 3 && !newMeta.act4Unlocked);

  if (isFinalVictory) {
    newMeta.totalRuns += 1;
    newMeta.totalWins += 1;
    newMeta.runCounter += 1;
    const curUnlocked = newMeta.ascensionByClass[run.className] ?? 0;
    if (run.ascension >= curUnlocked) {
      newMeta.ascensionByClass[run.className] = Math.min(15, run.ascension + 1);
    }
    const { unlocked } = checkAchievements(newMeta, run, true);
    persistMeta(newMeta);
    persistRun(null);
    set(() => ({ game: { screen: 'victory', run }, meta: newMeta, ui: { ...get().ui, newAchievements: unlocked, hasSave: false } }));
    return;
  }

  const nextAct = (run.act + 1) as 1 | 2 | 3 | 4;
  const nextRun = enterAct(run, nextAct, rng);
  persistMeta(newMeta);
  persistRun(nextRun);
  set(() => ({ game: { screen: 'map', run: nextRun }, meta: newMeta }));
}

function playSelectedCard(
  cardUid: string,
  targetUid: string | undefined,
  set: (fn: (s: Store) => Partial<Store>) => void,
  get: () => Store
) {
  const { game } = get();
  if (!game.run?.combat) return;
  const handCard = game.run.combat.hand.find((c) => c.uid === cardUid);
  if (!handCard) return;
  const def = getCardDef(handCard.defId);
  const exhaust = !!def.exhaustAfterUse || def.type === 'power';
  try {
    sfx.cardPlay();
    const combat = playCard(game.run.combat, cardUid, rng, { chosenTargetUid: targetUid });
    const run = { ...game.run, combat };
    playSeq += 1;
    set((s) => ({
      game: { ...game, run },
      ui: {
        ...s.ui,
        pendingCardUid: null,
        pendingTargets: [],
        animEvent: { type: 'play' },
        lastPlayed: { seq: playSeq, cardUid, defId: handCard.defId, upgraded: handCard.upgraded, exhaust },
      },
    }));
    persistRun(run);
  } catch {
    set((s) => ({ ui: { ...s.ui, pendingCardUid: null, pendingTargets: [] } }));
  }
}

export type { CardInstance };
export { achievements };
