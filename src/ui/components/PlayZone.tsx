import { useEffect, useState } from 'react';
import Card from './Card';
import { useOrientation } from '../orientation';

export interface FlyingCard {
  key: string;
  defId: string;
  upgraded: boolean;
  fromRect: DOMRect;
  exhaust: boolean;
}

interface PlayZoneProps {
  cards: FlyingCard[];
  onDone: (key: string) => void;
}

const CARD_W = 130;
const CARD_H = 182;

function FlyingCardView({ card, onDone }: { card: FlyingCard; onDone: () => void }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const orientation = useOrientation();
  const viewportW = orientation === 'portrait' ? 720 : 1280;
  const viewportH = orientation === 'portrait' ? 1280 : 720;

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 20);
    const t2 = setTimeout(() => setStage(2), 200);
    const t3 = setTimeout(onDone, 360);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const centerX = viewportW / 2 - CARD_W / 2;
  const centerY = viewportH / 2 - CARD_H / 2;
  const discardX = viewportW - 90;
  const discardY = card.exhaust ? -100 : viewportH - 40;

  let style: React.CSSProperties;
  if (stage === 0) {
    style = {
      left: card.fromRect.left,
      top: card.fromRect.top,
      transform: 'scale(1)',
      opacity: 1,
      transition: 'none',
    };
  } else if (stage === 1) {
    style = {
      left: centerX,
      top: centerY,
      transform: 'scale(1.15)',
      opacity: 1,
      transition: 'left 120ms ease-out, top 120ms ease-out, transform 120ms ease-out',
    };
  } else {
    style = {
      left: discardX,
      top: discardY,
      transform: `scale(0.5) ${card.exhaust ? 'rotate(20deg)' : ''}`,
      opacity: 0,
      transition: 'left 160ms ease-in, top 160ms ease-in, transform 160ms ease-in, opacity 160ms ease-in',
      filter: card.exhaust ? 'brightness(2)' : undefined,
    };
  }

  return (
    <div style={{ position: 'absolute', pointerEvents: 'none', zIndex: 200, ...style }}>
      <Card defId={card.defId} upgraded={card.upgraded} />
    </div>
  );
}

export default function PlayZone({ cards, onDone }: PlayZoneProps) {
  return (
    <>
      {cards.map((c) => (
        <FlyingCardView key={c.key} card={c} onDone={() => onDone(c.key)} />
      ))}
    </>
  );
}
