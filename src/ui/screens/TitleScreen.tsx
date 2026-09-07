import { useGameStore } from '../../store/gameStore';
import { useT, useLocale } from '../../i18n/useT';

export default function TitleScreen() {
  const goToClassSelect = useGameStore((s) => s.goToClassSelect);
  const continueRun = useGameStore((s) => s.continueRun);
  const viewAchievements = useGameStore((s) => s.viewAchievements);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const hasSave = useGameStore((s) => s.ui.hasSave);
  const locale = useLocale();
  const t = useT();

  return (
    <div className="game-viewport">
      <button
        onClick={() => setLanguage(locale === 'ko' ? 'en' : 'ko')}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text-sub)',
          padding: '6px 12px',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        {locale === 'ko' ? 'EN' : '한국어'}
      </button>
      <div className="centered-screen">
        <div>
          <div className="title-logo">RIFTLINE</div>
          <div className="title-sub">{t('title_subtitle')}</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button className="btn btn-accent" onClick={goToClassSelect}>
            {t('new_game')}
          </button>
          {hasSave && (
            <button className="btn" onClick={continueRun}>
              {t('continue_game')}
            </button>
          )}
          <button className="btn" onClick={viewAchievements}>
            {t('achievements')}
          </button>
        </div>
        <div className="title-sub" style={{ maxWidth: 500 }}>
          {t('title_hint')}
        </div>
      </div>
    </div>
  );
}
