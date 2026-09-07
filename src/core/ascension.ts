// 승천 난이도 1~15. 기획서 18장 표를 코드로 구현.

export interface AscensionMods {
  extraEliteNodes: boolean; // A1
  normalHpMult: number; // A2, A7(피해와 별개)
  normalDmgMult: number; // A7
  eliteHpMult: number; // A3
  eliteDmgMult: number; // A3
  bossHpMult: number; // A9
  startCurses: number; // A4, A14
  restHealPercent: number; // A5
  startHpPenalty: number; // A6
  shopPriceMult: number; // A8
  removeCostStart: number; // A8
  goldMult: number; // A10
  potionSlotPenalty: number; // A11
  moveEnergyCost: number; // A12 (에너지형 클래스)
  courierMovesPerTurn: number; // A12 (밀사 전용)
  extraEliteEnemy: boolean; // A13 (2막부터 엘리트에 적 1체 추가) — 단순화하여 A13 이상이면 항상 적용
  bossTwoPhase: boolean; // A15 (이미 EnemyDef.phase2At로 항상 존재하므로 트리거 조건에만 사용)
  actStartHeal: number; // A6 이상 보충: 막 시작 시 HP 회복
  freeRemoveOnStart: boolean; // A10 이상 보충
}

export function computeAscensionMods(level: number): AscensionMods {
  const a = Math.max(0, Math.min(15, level));
  return {
    extraEliteNodes: a >= 1,
    normalHpMult: a >= 2 ? 1.1 : 1,
    normalDmgMult: a >= 7 ? 1.15 : 1,
    eliteHpMult: a >= 3 ? 1.12 : 1,
    eliteDmgMult: a >= 3 ? 1.1 : 1,
    bossHpMult: a >= 9 ? 1.15 : 1,
    startCurses: (a >= 4 ? 1 : 0) + (a >= 14 ? 1 : 0),
    restHealPercent: a >= 5 ? 0.2 : 0.3,
    startHpPenalty: a >= 6 ? 8 : 0,
    shopPriceMult: a >= 8 ? 1.2 : 1,
    removeCostStart: a >= 8 ? 100 : 75,
    goldMult: a >= 10 ? 0.85 : 1,
    potionSlotPenalty: a >= 11 ? 1 : 0,
    moveEnergyCost: a >= 12 ? 2 : 1,
    courierMovesPerTurn: a >= 12 ? 1 : 2,
    extraEliteEnemy: a >= 13,
    bossTwoPhase: a >= 15,
    actStartHeal: a >= 6 ? 6 : 0,
    freeRemoveOnStart: a >= 10,
  };
}
