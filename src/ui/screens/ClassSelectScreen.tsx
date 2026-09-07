import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { ClassId } from '../../core/types';
import { useT, useLocale } from '../../i18n/useT';

const CLASS_INFO: Record<ClassId, { name: string; nameEn: string; desc: string; descEn: string; color: string }> = {
  warden: {
    name: '파수병', nameEn: 'Warden',
    desc: '전열 고정형. 힘과 방어도를 쌓아 후반에 폭발한다.',
    descEn: 'Front-line anchor. Stacks Strength and Block for a late-game payoff.',
    color: 'var(--card-attack)',
  },
  ember: {
    name: '술사', nameEn: 'Ember',
    desc: '후열 상주형. 원소 마커를 조합해 반응을 일으킨다.',
    descEn: 'Back-line caster. Combines elemental markers to trigger reactions.',
    color: 'var(--card-power)',
  },
  courier: {
    name: '밀사', nameEn: 'Courier',
    desc: '매 턴 이동형. 손패 회전과 콤보로 다타를 노린다.',
    descEn: 'Always on the move. Cycles cards and stacks combos for burst damage.',
    color: 'var(--card-skill)',
  },
  scribe: {
    name: '각인자', nameEn: 'Scribe',
    desc: '카드에 각인을 부착해 덱을 개조한다. (해금 필요)',
    descEn: 'Attaches imprints to reshape the deck. (Unlock required)',
    color: '#888',
  },
};

export default function ClassSelectScreen() {
  const meta = useGameStore((s) => s.meta);
  const startNewRun = useGameStore((s) => s.startNewRun);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const [selected, setSelected] = useState<ClassId>('warden');
  const [ascension, setAscension] = useState(0);
  const t = useT();
  const locale = useLocale();

  const maxAscension = meta.ascensionByClass[selected] ?? 0;
  const unlocked = meta.unlockedClasses.includes(selected);

  return (
    <div className="game-viewport">
      <div className="centered-screen">
        <div className="title-sub" style={{ fontSize: 20, color: 'var(--text-main)' }}>
          {t('select_class')}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {(['warden', 'ember', 'courier', 'scribe'] as ClassId[]).map((c) => {
            const info = CLASS_INFO[c];
            const isUnlocked = meta.unlockedClasses.includes(c);
            return (
              <div
                key={c}
                onClick={() => isUnlocked && setSelected(c)}
                style={{
                  width: 180,
                  padding: 16,
                  borderRadius: 10,
                  border: `2px solid ${selected === c ? 'var(--accent)' : 'var(--border)'}`,
                  background: 'var(--panel)',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  opacity: isUnlocked ? 1 : 0.4,
                  textAlign: 'left',
                }}
              >
                <div
                  className="rl-class-portrait"
                  style={{ backgroundImage: `url(assets/characters/${c}_idle.png)` }}
                />
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{locale === 'ko' ? info.name : info.nameEn}</div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                  {isUnlocked ? (locale === 'ko' ? info.desc : info.descEn) : t('locked_hint')}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="title-sub">{t('ascension')}</span>
          <input
            type="range"
            min={0}
            max={maxAscension}
            value={ascension}
            onChange={(e) => setAscension(Number(e.target.value))}
            disabled={maxAscension === 0}
          />
          <span className="tabular" style={{ width: 24 }}>
            {ascension}
          </span>
          <span className="title-sub" style={{ fontSize: 11 }}>
            ({t('max_unlocked')}: A{maxAscension})
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button className="btn btn-accent" disabled={!unlocked} onClick={() => startNewRun(selected, ascension, false)}>
            {t('start_run')}
          </button>
          <button className="btn" disabled={!unlocked} onClick={() => startNewRun(selected, 0, true)}>
            {t('daily_challenge')}
          </button>
          <button className="btn" onClick={backToTitle}>
            {t('back')}
          </button>
        </div>
      </div>
    </div>
  );
}
