import { useGameStore } from '../../store/gameStore';
import { achievements } from '../../data/achievements';
import { useT, useLocale } from '../../i18n/useT';

export default function AchievementsScreen() {
  const meta = useGameStore((s) => s.meta);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const t = useT();
  const locale = useLocale();

  return (
    <div className="game-viewport" style={{ overflowY: 'auto', padding: 30 }}>
      <div className="title-sub" style={{ fontSize: 20, color: 'var(--text-main)', marginBottom: 20 }}>
        {t('achievements')} ({meta.achievements.length}/{achievements.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {achievements.map((a) => {
          const done = meta.achievements.includes(a.id);
          return (
            <div
              key={a.id}
              style={{
                padding: 14,
                borderRadius: 8,
                border: `1px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                background: 'var(--panel)',
                opacity: done ? 1 : 0.5,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6, color: done ? 'var(--accent)' : 'var(--text-main)' }}>
                {done ? (locale === 'en' ? a.nameEn : a.name) : '???'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                {done ? (locale === 'en' ? a.textEn : a.text) : locale === 'en' ? 'Still locked.' : '아직 잠겨 있습니다.'}
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn btn-accent" onClick={backToTitle}>
        {t('to_title')}
      </button>
    </div>
  );
}
