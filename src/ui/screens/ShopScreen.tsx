import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import Card from '../components/Card';
import { relicMap } from '../../data/relics';
import { potionMap } from '../../data/potions';
import { getCardDef } from '../../data/cards';
import { cardName } from '../components/cardText';
import { useT, useLocale } from '../../i18n/useT';

export default function ShopScreen() {
  const game = useGameStore((s) => s.game);
  const shopBuyCard = useGameStore((s) => s.shopBuyCard);
  const shopBuyRelic = useGameStore((s) => s.shopBuyRelic);
  const shopBuyPotion = useGameStore((s) => s.shopBuyPotion);
  const shopRemoveCard = useGameStore((s) => s.shopRemoveCard);
  const shopLeave = useGameStore((s) => s.shopLeave);
  const [showRemove, setShowRemove] = useState(false);
  const t = useT();
  const locale = useLocale();

  const run = game.run;
  const stock = game.shopStock;
  if (!run || !stock) return null;

  return (
    <div className="game-viewport" style={{ overflowY: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="title-sub" style={{ fontSize: 18, color: 'var(--text-main)' }}>
          {t('shop_title')}
        </div>
        <div className="tabular" style={{ color: 'var(--energy)' }}>
          {t('gold')} {run.gold}
        </div>
      </div>

      {!showRemove ? (
        <>
          <div className="title-sub" style={{ marginBottom: 8 }}>
            {t('shop_cards')}
          </div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            {stock.cards.map((c, i) => (
              <div key={c.uid} style={{ textAlign: 'center' }}>
                <Card defId={c.defId} upgraded={false} />
                <button
                  className="btn"
                  style={{ marginTop: 6, fontSize: 12, padding: '4px 10px' }}
                  disabled={run.gold < stock.cardPrices[i]}
                  onClick={() => shopBuyCard(i)}
                >
                  {stock.cardPrices[i]}G
                </button>
              </div>
            ))}
          </div>

          <div className="title-sub" style={{ marginBottom: 8 }}>
            {t('shop_relics')}
          </div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            {stock.relics.map((id, i) => {
              const relic = relicMap[id];
              return (
                <div
                  key={id}
                  style={{ width: 160, padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)' }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{locale === 'en' ? relic?.nameEn ?? relic?.name : relic?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-sub)', minHeight: 40, margin: '6px 0' }}>
                    {locale === 'en' ? relic?.textEn ?? relic?.text : relic?.text}
                  </div>
                  <button
                    className="btn"
                    style={{ fontSize: 12, padding: '4px 10px', width: '100%' }}
                    disabled={run.gold < stock.relicPrices[i]}
                    onClick={() => shopBuyRelic(i)}
                  >
                    {stock.relicPrices[i]}G
                  </button>
                </div>
              );
            })}
          </div>

          <div className="title-sub" style={{ marginBottom: 8 }}>
            {t('shop_potions')}
          </div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            {stock.potions.map((id, i) => {
              const potion = potionMap[id];
              return (
                <div
                  key={id}
                  style={{ width: 150, padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)' }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{locale === 'en' ? potion?.nameEn : potion?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-sub)', minHeight: 32, margin: '6px 0' }}>
                    {locale === 'en' ? potion?.textEn : potion?.text}
                  </div>
                  <button
                    className="btn"
                    style={{ fontSize: 12, padding: '4px 10px', width: '100%' }}
                    disabled={run.gold < stock.potionPrices[i] || !run.potions.includes(null)}
                    onClick={() => shopBuyPotion(i)}
                  >
                    {stock.potionPrices[i]}G
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <button className="btn" onClick={() => setShowRemove(true)}>
              {t('remove_card')} ({stock.removeCost}G)
            </button>
            <button className="btn btn-accent" onClick={shopLeave}>
              {t('leave')}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="title-sub" style={{ marginBottom: 10 }}>
            {t('remove_card_prompt')} ({stock.removeCost}G)
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {run.deck.map((c) => (
              <div
                key={c.uid}
                onClick={() => {
                  if (run.gold >= stock.removeCost) {
                    shopRemoveCard(c.uid);
                    setShowRemove(false);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <Card defId={c.defId} upgraded={c.upgraded} size="small" />
                <div style={{ fontSize: 10, textAlign: 'center', color: 'var(--text-sub)' }}>
                  {cardName(getCardDef(c.defId), c.upgraded, locale)}
                </div>
              </div>
            ))}
          </div>
          <button className="btn" onClick={() => setShowRemove(false)}>
            {t('cancel')}
          </button>
        </>
      )}
    </div>
  );
}
