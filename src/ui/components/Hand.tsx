import { useEffect, useRef, useState } from 'react';
import type { CardInstance } from '../../core/types';
import Card from './Card';
import { canPlayCard } from '../../core/combat';
import type { CombatState } from '../../core/types';
import { useOrientation } from '../orientation';
import './Hand.css';

interface HandProps {
  hand: CardInstance[];
  combat: CombatState;
  pendingCardUid: string | null;
  onCardClick: (uid: string, rect: DOMRect) => void;
}

export default function Hand({ hand, combat, pendingCardUid, onCardClick }: HandProps) {
  const seenUids = useRef<Set<string>>(new Set());
  const [newUids, setNewUids] = useState<Set<string>>(new Set());
  const orientation = useOrientation();
  const cardSize = orientation === 'portrait' ? 'small' : 'normal';
  const overlapMargin = orientation === 'portrait' ? -50 : -18;

  useEffect(() => {
    const currentUids = new Set(hand.map((c) => c.uid));
    const fresh = new Set<string>();
    for (const uid of currentUids) {
      if (!seenUids.current.has(uid)) fresh.add(uid);
    }
    if (fresh.size > 0) {
      setNewUids(fresh);
      const t = setTimeout(() => setNewUids(new Set()), 280 + fresh.size * 60 + 50);
      seenUids.current = currentUids;
      return () => clearTimeout(t);
    }
    seenUids.current = currentUids;
  }, [hand]);

  const count = hand.length;

  return (
    <div className="rl-hand">
      {hand.map((card, i) => {
        const isNew = newUids.has(card.uid);
        const newIndex = isNew ? [...newUids].indexOf(card.uid) : 0;
        const angle = count > 1 ? -8 + (16 * i) / (count - 1) : 0;
        const check = canPlayCard(combat, card.uid);

        return (
          <div
            key={card.uid}
            className={`rl-hand-slot ${isNew ? 'rl-draw-in' : ''}`}
            style={{
              // @ts-expect-error custom css var
              '--fan-rot': `${angle}deg`,
              marginLeft: i === 0 ? 0 : overlapMargin,
              animationDelay: isNew ? `${newIndex * 60}ms` : undefined,
              zIndex: pendingCardUid === card.uid ? 50 : i,
            }}
            onClick={(e) => {
              if (!check.ok) return;
              onCardClick(card.uid, e.currentTarget.getBoundingClientRect());
            }}
          >
            <Card
              defId={card.defId}
              upgraded={card.upgraded}
              size={cardSize}
              disabled={!check.ok}
              selected={pendingCardUid === card.uid}
            />
          </div>
        );
      })}
    </div>
  );
}
