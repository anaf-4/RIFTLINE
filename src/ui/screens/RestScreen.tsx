import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import Card from '../components/Card';
import { getCardDef } from '../../data/cards';
import { IMPRINT_NAMES, IMPRINT_NAMES_EN } from '../../data/cards/scribe';
import type { ImprintId } from '../../core/types';
import { useT, useLocale } from '../../i18n/useT';

type Mode = 'menu' | 'upgrade' | 'imprint-pick-card' | 'imprint-pick-type';

export default function RestScreen() {
  const run = useGameStore((s) => s.game.run);
  const restDo = useGameStore((s) => s.restDo);
  const restUpgrade = useGameStore((s) => s.restUpgrade);
  const restImprint = useGameStore((s) => s.restImprint);
  const [mode, setMode] = useState<Mode>('menu');
  const [pickedCardUid, setPickedCardUid] = useState<string | null>(null);
  const [previewUid, setPreviewUid] = useState<string | null>(null);
  const t = useT();
  const locale = useLocale();
  const imprintNames = locale === 'ko' ? IMPRINT_NAMES : IMPRINT_NAMES_EN;

  if (!run) return null;
  const isScribe = run.className === 'scribe';
  const upgradeable = run.deck.filter((c) => !c.upgraded && getCardDef(c.defId).upgrade);

  return (
    <div className="game-viewport" style={{ overflowY: 'auto', padding: 20 }}>
      <div className="title-sub" style={{ fontSize: 18, color: 'var(--text-main)', marginBottom: 16 }}>
        {t('rest_title')}
      </div>

      {mode === 'menu' && (
        <div style={{ display: 'flex', gap: 16 }}>
          <button className="btn btn-accent" onClick={() => restDo('heal')}>
            {t('rest_heal')}
          </button>
          <button className="btn" disabled={upgradeable.length === 0} onClick={() => setMode('upgrade')}>
            {t('rest_upgrade')}
          </button>
          {isScribe && (
            <button className="btn" onClick={() => setMode('imprint-pick-card')}>
              {t('rest_imprint')}
            </button>
          )}
          <button className="btn" onClick={() => restDo('leave')}>
            {t('rest_pass')}
          </button>
        </div>
      )}

      {mode === 'upgrade' && !previewUid && (
        <>
          <div className="title-sub" style={{ marginBottom: 10 }}>
            {t('choose_upgrade_card')}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {upgradeable.map((c) => (
              <div key={c.uid} onClick={() => setPreviewUid(c.uid)} style={{ cursor: 'pointer' }}>
                <Card defId={c.defId} upgraded={false} size="small" />
              </div>
            ))}
          </div>
          <button className="btn" onClick={() => setMode('menu')}>
            {t('cancel')}
          </button>
        </>
      )}

      {mode === 'upgrade' && previewUid && (
        <>
          <div className="title-sub" style={{ marginBottom: 10 }}>
            {t('upgrade_preview')}
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
            <Card defId={upgradeable.find((c) => c.uid === previewUid)!.defId} upgraded={false} />
            <div style={{ fontSize: 28, color: 'var(--accent)' }}>→</div>
            <div style={{ position: 'relative' }}>
              <div className="rl-upgrade-glow" />
              <Card defId={upgradeable.find((c) => c.uid === previewUid)!.defId} upgraded={true} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              className="btn btn-accent"
              onClick={() => {
                restUpgrade(previewUid);
                setPreviewUid(null);
              }}
            >
              {t('confirm_upgrade')}
            </button>
            <button className="btn" onClick={() => setPreviewUid(null)}>
              {t('cancel')}
            </button>
          </div>
        </>
      )}

      {mode === 'imprint-pick-card' && (
        <>
          <div className="title-sub" style={{ marginBottom: 10 }}>
            {t('choose_imprint_card')}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {run.deck
              .filter((c) => !c.imprint)
              .map((c) => (
                <div
                  key={c.uid}
                  onClick={() => {
                    setPickedCardUid(c.uid);
                    setMode('imprint-pick-type');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Card defId={c.defId} upgraded={c.upgraded} size="small" />
                </div>
              ))}
          </div>
          <button className="btn" onClick={() => setMode('menu')}>
            {t('cancel')}
          </button>
        </>
      )}

      {mode === 'imprint-pick-type' && pickedCardUid && (
        <>
          <div className="title-sub" style={{ marginBottom: 10 }}>
            {t('choose_imprint_type')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxWidth: 400 }}>
            {(Object.keys(imprintNames) as ImprintId[]).map((id) => (
              <button key={id} className="btn" style={{ textAlign: 'left' }} onClick={() => restImprint(pickedCardUid, id)}>
                {imprintNames[id]}
              </button>
            ))}
          </div>
          <button className="btn" onClick={() => setMode('menu')}>
            {t('cancel')}
          </button>
        </>
      )}
    </div>
  );
}
