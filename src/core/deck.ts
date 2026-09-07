import type { CardInstance } from './types';
import type { Rng } from './rng';

let uidCounter = 0;
export function makeCardInstance(defId: string, upgraded = false): CardInstance {
  uidCounter += 1;
  return { uid: `c${uidCounter}_${defId}`, defId, upgraded };
}

export function shuffleDeck(cards: CardInstance[], rng: Rng): CardInstance[] {
  return rng.shuffle(cards);
}

// 버림 더미를 셔플해 새 뽑을 더미로 만든다 (더미가 바닥났을 때)
export function reshuffleIfNeeded(
  drawPile: CardInstance[],
  discardPile: CardInstance[],
  rng: Rng
): { drawPile: CardInstance[]; discardPile: CardInstance[] } {
  if (drawPile.length > 0) return { drawPile, discardPile };
  if (discardPile.length === 0) return { drawPile, discardPile };
  return { drawPile: shuffleDeck(discardPile, rng), discardPile: [] };
}

export function drawCards(
  drawPile: CardInstance[],
  discardPile: CardInstance[],
  hand: CardInstance[],
  count: number,
  rng: Rng,
  handLimit = 8
): { drawPile: CardInstance[]; discardPile: CardInstance[]; hand: CardInstance[] } {
  let dp = drawPile.slice();
  let disc = discardPile.slice();
  const h = hand.slice();

  for (let i = 0; i < count; i++) {
    if (h.length >= handLimit) break; // 손패 상한 초과분은 소멸
    const reshuffled = reshuffleIfNeeded(dp, disc, rng);
    dp = reshuffled.drawPile;
    disc = reshuffled.discardPile;
    if (dp.length === 0) break; // 덱과 버림 더미 모두 빔
    const [card, ...rest] = dp;
    dp = rest;
    h.push(card);
  }

  return { drawPile: dp, discardPile: disc, hand: h };
}
