// 순수 타입 정의. React/DOM 의존 없음.

export type Line = 'front' | 'back';
export type CardType = 'attack' | 'skill' | 'power' | 'status' | 'curse';
export type CardRange = 'melee' | 'ranged' | 'pierce' | null;
export type Rarity = 'common' | 'uncommon' | 'rare' | 'special';
export type ClassId = 'warden' | 'ember' | 'courier' | 'scribe';
export type ElementId = 'fire' | 'ice' | 'lightning';
export type ImprintId = 'sharp' | 'sturdy' | 'swift' | 'spread' | 'echo' | 'resonance';

export type StatusId =
  | 'vulnerable'
  | 'weak'
  | 'strength'
  | 'dexterity'
  | 'poison'
  | 'bind'
  | 'regen'
  | 'thorns';

export interface StatusMap {
  [key: string]: number;
}

export type EffectTarget = 'self' | 'enemy_single' | 'enemy_all' | 'enemy_random';

export interface EffectCondition {
  type: 'playerLine' | 'enemyHpBelow' | 'handEmpty' | 'comboCount' | 'hasStatus' | 'elementMatch';
  line?: Line;
  percent?: number;
  count?: number;
  status?: StatusId;
  element?: ElementId;
}

export interface CardEffect {
  op:
    | 'damage'
    | 'damageMulti'
    | 'block'
    | 'applyStatus'
    | 'draw'
    | 'energy'
    | 'move'
    | 'pull'
    | 'push'
    | 'heal'
    | 'exhaust'
    | 'modifyStat'
    | 'elementMark';
  target?: EffectTarget;
  value?: number;
  times?: number;
  status?: StatusId;
  element?: ElementId;
  to?: 'front' | 'back' | 'toggle';
  stat?: 'blockCarryPercent' | 'movesPerTurn' | 'energyMax' | 'maxHp' | 'potionSlots';
  condition?: EffectCondition;
  onConditionMet?: { multiplier?: number; bonusValue?: number };
}

export interface CardUpgrade {
  name: string;
  nameEn?: string;
  cost?: number;
  effects: CardEffect[];
  text?: string;
  textEn?: string;
  exhaustAfterUse?: boolean;
}

export interface CardDef {
  id: string;
  name: string;
  nameEn?: string;
  class: ClassId | 'common' | 'curse';
  type: CardType;
  rarity: Rarity;
  cost: number; // -1 = X코스트
  range: CardRange;
  /** 수동으로 지정하지 않으면 effects로부터 자동 생성된다 (i18n/effectText.ts) */
  text?: string;
  textEn?: string;
  effects: CardEffect[];
  upgrade?: CardUpgrade;
  exhaustAfterUse?: boolean;
  playable?: boolean;
  trigger?: 'onPlay' | 'endOfTurn';
}

export interface CardInstance {
  uid: string;
  defId: string;
  upgraded: boolean;
  imprint?: ImprintId;
}

export interface IntentDef {
  type: 'attack' | 'buff' | 'debuff' | 'block' | 'move' | 'unknown';
  value?: number;
  times?: number;
  status?: StatusId;
  weight: number;
  /** true면 후열에서도 공격이 유효하다 (원거리). false/미지정이면 근접 취급으로 후열에서는 공격이 닿지 않는다. */
  ranged?: boolean;
}

export interface EnemyDef {
  id: string;
  name: string;
  nameEn?: string;
  act: 1 | 2 | 3 | 4;
  line: Line;
  hp: [number, number];
  canMove: boolean;
  intents: IntentDef[];
  isBoss?: boolean;
  isElite?: boolean;
  phase2At?: number; // HP 비율(0~1) 이하에서 패턴 전환 (승천15)
}

export interface EnemyInstance {
  uid: string;
  defId: string;
  name: string;
  nameEn?: string;
  line: Line;
  hp: number;
  maxHp: number;
  block: number;
  statuses: StatusMap;
  elementMarks: Partial<Record<ElementId, number>>;
  currentIntent: IntentDef | null;
  lastIntentIndex: number;
  canMove: boolean;
  phase2: boolean;
}

export interface PowerInstance {
  cardId: string;
  name: string;
  trigger: 'endOfTurn';
  effects: CardEffect[];
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  energy: number;
  energyMax: number;
  block: number;
  line: Line;
  statuses: StatusMap;
  movesUsed: number;
  movesPerTurn: number;
  blockCarryPercent: number;
  powers: PowerInstance[];
  comboCards: number; // 밀사: 이번 턴 사용 카드 수 (cardsPlayedThisTurn과 동일하지만 카드 텍스트 조회용)
}

export type RelicHook = 'combatStart' | 'turnStart' | 'turnEnd' | 'onKill' | 'onMoveFront';

export interface RelicDef {
  id: string;
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';
  classRestrict?: ClassId;
  hook?: RelicHook;
  hookEffects?: CardEffect[];
}

export type ScreenId =
  | 'title'
  | 'classSelect'
  | 'map'
  | 'combat'
  | 'reward'
  | 'shop'
  | 'rest'
  | 'event'
  | 'gameover'
  | 'victory'
  | 'achievements';

export interface CombatLogEntry {
  id: string;
  text: string;
}

export interface CombatState {
  player: PlayerState;
  enemies: EnemyInstance[];
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  turn: number;
  cardsPlayedThisTurn: number;
  log: CombatLogEntry[];
  turnPhase: 'player' | 'enemy' | 'won' | 'lost';
  relics: string[];
  ascension: number;
  moveEnergyCost: number;
}

// ---------- 맵 ----------

export type NodeType = 'combat' | 'elite' | 'event' | 'rest' | 'shop' | 'boss';

export interface MapNode {
  id: string;
  act: 1 | 2 | 3 | 4;
  row: number;
  col: number;
  type: NodeType;
  enemyIds?: string[];
  eventId?: string;
  connections: string[]; // 다음 행 노드 id들
}

export interface EventChoice {
  id: string;
  text: string;
  textEn?: string;
  effects: CardEffect[];
  goldDelta?: number;
  relicId?: string;
  removeCardPrompt?: boolean;
  addCurse?: string;
  requiresGold?: number;
}

export interface EventDef {
  id: string;
  title: string;
  titleEn?: string;
  text: string;
  textEn?: string;
  choices: EventChoice[];
}

export interface ShopStock {
  cards: CardInstance[];
  cardPrices: number[];
  relics: string[];
  relicPrices: number[];
  potions: string[];
  potionPrices: number[];
  removeCost: number;
}

export interface RunState {
  seed: number;
  className: ClassId;
  ascension: number;
  deck: CardInstance[];
  relics: string[];
  gold: number;
  potions: (string | null)[];
  potionSlots: number;
  maxHp: number;
  hp: number;
  act: 1 | 2 | 3 | 4;
  mapNodes: MapNode[];
  currentNodeId: string | null;
  completedNodeIds: string[];
  removeCount: number;
  combat: CombatState | null;
  imprintsUsed: number; // 각인자: 런 중 부착 횟수 추적(선택)
  isDaily: boolean;
}

export interface GameState {
  screen: ScreenId;
  run: RunState | null;
  rewardOptions?: CardInstance[];
  activeEvent?: EventDef;
  shopStock?: ShopStock;
}
