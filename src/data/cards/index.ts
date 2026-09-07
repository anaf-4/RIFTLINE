import type { CardDef } from '../../core/types';
import { wardenCards } from './warden';
import { emberCards } from './ember';
import { courierCards } from './courier';
import { scribeCards } from './scribe';
import { commonCards } from './common';
import { curseCards } from './curses';

export const allCards: CardDef[] = [
  ...wardenCards,
  ...emberCards,
  ...courierCards,
  ...scribeCards,
  ...commonCards,
  ...curseCards,
];

export const cardMap: Record<string, CardDef> = Object.fromEntries(
  allCards.map((c) => [c.id, c])
);

export function getCardDef(id: string): CardDef {
  const def = cardMap[id];
  if (!def) throw new Error(`Unknown card id: ${id}`);
  return def;
}

export { wardenCards, emberCards, courierCards, scribeCards, commonCards, curseCards };
