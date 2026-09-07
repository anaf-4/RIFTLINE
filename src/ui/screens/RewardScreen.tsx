import { useGameStore } from '../../store/gameStore';
import { getCardDef } from '../../data/cards';
import { cardName } from '../components/cardText';
import { relicMap } from '../../data/relics';
import Card from '../components/Card';
import { useT, useLocale } from '../../i18n/useT';

export default function RewardScreen() {
  const game = useGameStore((s) => s.game);
  const ui = useGameStore((s) => s.ui);
  const pickReward = useGameStore((s) => s.pickReward);
  const t = useT();
  const locale = useLocale();

  const options = game.rewardOptions ?? [];
  const relic = ui.lastRelicReward ? relicMap[ui.lastRelicReward] : null;

  return (
    <div className="game-viewport">
      <div className="centered-screen">
        <div className="title-sub" style={{ fontSize: 22, color: 'var(--text-main)' }}>
          {t('pick_card_title')}
        </div>
        <div className="tabular" style={{ color: 'var(--energy)' }}>
          {t('current_gold')}: {game.run?.gold ?? 0}
        </div>

        {relic && (
          <div
            style={{
              padding: '10px 20px',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              color: 'var(--accent)',
              maxWidth: 480,
            }}
          >
            {t('relic_gained')}: <b>{locale === 'en' ? relic.nameEn ?? relic.name : relic.name}</b> —{' '}
            {locale === 'en' ? relic.textEn ?? relic.text : relic.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 20 }}>
          {options.map((c) => {
            const def = getCardDef(c.defId);
            return (
              <div key={c.uid} onClick={() => pickReward(c.uid)} style={{ cursor: 'pointer' }}>
                <Card defId={c.defId} upgraded={false} />
                <div style={{ textAlign: 'center', marginTop: 8, color: 'var(--text-sub)', fontSize: 12 }}>
                  {cardName(def, false, locale)}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn" onClick={() => pickReward(null)}>
          {t('skip')}
        </button>
      </div>
    </div>
  );
}
