import { useGameStore } from '../../store/gameStore';
import { achievementMap } from '../../data/achievements';
import { useT, useLocale } from '../../i18n/useT';

export default function VictoryScreen() {
  const run = useGameStore((s) => s.game.run);
  const newAchievements = useGameStore((s) => s.ui.newAchievements);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const t = useT();
  const locale = useLocale();

  const isTrueEnding = run?.act === 4;

  return (
    <div className="game-viewport">
      <div className="centered-screen">
        <div className="title-logo" style={{ color: 'var(--accent)', fontSize: 44 }}>
          {isTrueEnding ? t('victory_true') : t('victory_boss')}
        </div>
        <div className="title-sub">{isTrueEnding ? t('victory_true_msg') : t('victory_boss_msg')}</div>
        {newAchievements.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {newAchievements.map((id) => (
              <div key={id} style={{ color: 'var(--accent)', fontSize: 13 }}>
                🏆 {t('achievement_unlocked')}: {locale === 'en' ? achievementMap[id]?.nameEn : achievementMap[id]?.name}
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-accent" onClick={backToTitle}>
          {t('to_title')}
        </button>
      </div>
    </div>
  );
}
