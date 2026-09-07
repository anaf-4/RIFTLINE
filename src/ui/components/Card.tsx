import { getCardDef } from '../../data/cards';
import { renderCardText, cardCost, cardName, rangeIcon, typeColor } from './cardText';
import { getCardArt } from './cardArt';
import { useLocale } from '../../i18n/useT';
import './Card.css';

interface CardProps {
  defId: string;
  upgraded: boolean;
  size?: 'normal' | 'small';
  disabled?: boolean;
  selected?: boolean;
}

export default function Card({ defId, upgraded, size = 'normal', disabled, selected }: CardProps) {
  const locale = useLocale();
  const def = getCardDef(defId);
  const cost = cardCost(def, upgraded);
  const text = renderCardText(def, upgraded, locale);
  const name = cardName(def, upgraded, locale);
  const art = getCardArt(def);

  return (
    <div
      className={`rl-card ${size === 'small' ? 'rl-card-small' : ''} ${disabled ? 'rl-card-disabled' : ''} ${selected ? 'rl-card-selected' : ''}`}
      style={{ borderColor: typeColor[def.type] }}
    >
      <div className="rl-card-header">
        <div className="rl-card-cost">{def.playable === false ? '-' : cost}</div>
        <div className="rl-card-name">{name}</div>
        {def.range && <div className="rl-card-range">{rangeIcon[def.range]}</div>}
      </div>
      <div className="rl-card-art" style={{ backgroundImage: `url(${art})` }} />
      <div className="rl-card-text">{text}</div>
    </div>
  );
}
